import { Events } from 'discord.js';
import { handleGiveawayButton } from '../interactions/buttons/giveawayButton.js';
import { handleTicketButtons } from '../interactions/buttons/ticketButtons.js';
import { rateLimiter } from '../utils/rateLimiter.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // 1. Slash Commands
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          logger.warn({ command: interaction.commandName }, 'Command not found in registry');
          return;
        }

        // Rate limiting check
        const cooldown = command.cooldown || 3;
        const rateKey = `cmd:${interaction.user.id}:${command.data.name}`;
        const limitCheck = rateLimiter.isRateLimited(rateKey, 1, cooldown * 1000);

        if (limitCheck.limited) {
          const waitSeconds = Math.ceil(limitCheck.resetInMs / 1000);
          const limitEmbed = AppEmbed.warning(
            'Mohon Tunggu Sebentar',
            `Anda menggunakan perintah ini terlalu cepat. Silakan tunggu **${waitSeconds} detik**.`
          );
          return await interaction.reply({ embeds: [limitEmbed], ephemeral: true });
        }

        await command.execute(interaction);
        return;
      }

      // 2. Button Interactions
      if (interaction.isButton()) {
        const handledGiveaway = await handleGiveawayButton(interaction);
        if (handledGiveaway) return;

        const handledTicket = await handleTicketButtons(interaction);
        if (handledTicket) return;
      }
    } catch (error) {
      logger.error(
        {
          error: error.message,
          stack: error.stack,
          user: interaction.user?.id,
          guild: interaction.guild?.id,
          command: interaction.commandName || interaction.customId,
        },
        'Unhandled interaction execution error'
      );

      const errorEmbed = AppEmbed.error(
        'Terjadi Kesalahan Sistem',
        'Maaf, terjadi kendala saat memproses permintaan Anda. Staf teknis telah diberitahu secara otomatis.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => null);
      }
    }
  },
};
