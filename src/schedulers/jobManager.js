import { giveawayRepository } from '../repositories/giveawayRepository.js';
import { reminderRepository } from '../repositories/reminderRepository.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export class JobManager {
  constructor(client) {
    this.client = client;
    this.interval = null;
    this.isRunning = false;
    this.isProcessing = false;
  }

  start(intervalMs = 15000) {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info({ intervalMs }, 'Starting Enterprise Job Scheduler...');

    // Run first check immediately after 3s, then periodically
    setTimeout(() => this.tick(), 3000);

    this.interval = setInterval(() => {
      this.tick();
    }, intervalMs);

    if (this.interval.unref) {
      this.interval.unref();
    }
  }

  async tick() {
    if (this.isProcessing || !this.isRunning) return;
    this.isProcessing = true;

    try {
      await Promise.allSettled([
        this.processDueGiveaways(),
        this.processDueReminders(),
      ]);
    } catch (err) {
      logger.error({ error: err.message }, 'Unexpected error during scheduler tick');
    } finally {
      this.isProcessing = false;
    }
  }

  async processDueGiveaways() {
    const dueGiveaways = await giveawayRepository.getDueGiveaways();
    if (!dueGiveaways || dueGiveaways.length === 0) return;

    logger.info({ count: dueGiveaways.length }, 'Processing ended giveaways...');

    for (const item of dueGiveaways) {
      try {
        const result = await giveawayRepository.endGiveaway(item.id);
        if (!result) continue;

        const { giveaway, winners } = result;

        const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) continue;

        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);

        let winnersText = 'Tidak ada peserta yang berpartisipasi.';
        if (winners && winners.length > 0) {
          winnersText = winners.map((id) => `<@${id}>`).join(', ');
        }

        const endedEmbed = AppEmbed.primary(
          '🎉 GIVEAWAY SELESAI 🎉',
          `**Hadiah:** ${giveaway.prize}\n**Pemenang:** ${winnersText}\n**Dipandu oleh:** <@${giveaway.hostedById}>`
        );

        if (message) {
          await message.edit({ embeds: [endedEmbed], components: [] }).catch(() => null);
        }

        if (winners && winners.length > 0) {
          await channel.send({
            content: `Selamat ${winnersText}! Anda memenangkan **${giveaway.prize}**! 🎊`,
            embeds: [endedEmbed],
          }).catch(() => null);
        } else {
          await channel.send({
            content: `Giveaway untuk **${giveaway.prize}** telah berakhir tanpa pemenang karena tidak ada entri valid.`,
          }).catch(() => null);
        }
      } catch (err) {
        logger.error({ giveawayId: item.id, error: err.message }, 'Failed processing giveaway end');
      }
    }
  }

  async processDueReminders() {
    const dueReminders = await reminderRepository.getDueReminders();
    if (!dueReminders || dueReminders.length === 0) return;

    for (const reminder of dueReminders) {
      try {
        // Mark completed first to avoid duplicate notifications in case of failures
        await reminderRepository.markCompleted(reminder.id);

        const embed = AppEmbed.info(
          '🔔 PENGINGAT (REMINDER)',
          `Halo <@${reminder.userId}>, ini pengingat yang Anda minta:\n\n> **${reminder.reminderText}**`
        );

        let delivered = false;

        // Try sending to the channel first if exists
        if (reminder.channelId) {
          const channel = await this.client.channels.fetch(reminder.channelId).catch(() => null);
          if (channel && channel.isTextBased()) {
            await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] }).catch(() => null);
            delivered = true;
          }
        }

        // If not delivered or channel deleted, try DM
        if (!delivered) {
          const user = await this.client.users.fetch(reminder.userId).catch(() => null);
          if (user) {
            await user.send({ embeds: [embed] }).catch(() => null);
          }
        }
      } catch (err) {
        logger.error({ reminderId: reminder.id, error: err.message }, 'Failed processing reminder');
      }
    }
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info('Enterprise Job Scheduler stopped');
  }
}
