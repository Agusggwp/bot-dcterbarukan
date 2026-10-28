import { guildRepository } from '../repositories/guildRepository.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

const joinDedupeCache = new Map();
const leaveDedupeCache = new Map();

function isDuplicate(cache, key, ttlMs = 10000) {
  const now = Date.now();
  // Clean expired
  for (const [k, timestamp] of cache.entries()) {
    if (now - timestamp > 60000) cache.delete(k);
  }
  if (cache.has(key) && (now - cache.get(key) < ttlMs)) {
    return true;
  }
  cache.set(key, now);
  return false;
}

export class WelcomeService {
  static formatMessage(template, member) {
    if (!template) return '';
    return template
      .replace(/{user}/g, `<@${member.id}>`)
      .replace(/{username}/g, member.user?.username || 'Anggota')
      .replace(/{server}/g, member.guild?.name || 'Server')
      .replace(/{memberCount}/g, (member.guild?.memberCount || 0).toString());
  }

  static async handleMemberJoin(member) {
    try {
      // 0. Ignore bot accounts
      if (member.user?.bot) return;

      // Deduplicate rapid duplicate events
      const dedupeKey = `${member.guild.id}:${member.id}`;
      if (isDuplicate(joinDedupeCache, dedupeKey)) {
        logger.debug({ userId: member.id, guildId: member.guild.id }, 'Ignored duplicate member join event');
        return;
      }

      const config = await guildRepository.getGuildConfig(member.guild.id);
      const welcome = config.welcomeConfig;
      if (!welcome) return;

      // 1. Auto Role
      if (welcome.autoRoleId) {
        const role = member.guild.roles.cache.get(welcome.autoRoleId);
        if (role) {
          const botMember = member.guild.members.me;
          if (botMember && botMember.roles.highest.position > role.position) {
            await member.roles.add(role).catch((err) => {
              logger.warn({ error: err.message }, 'Failed to assign auto-role');
            });
          }
        }
      }

      // 2. Channel Welcome Embed
      if (welcome.enabled && welcome.channelId) {
        const channel = await member.guild.channels.fetch(welcome.channelId).catch((err) => {
          logger.error({ error: err.message, channelId: welcome.channelId }, 'Gagal mengambil saluran sambutan');
          return null;
        });

        if (channel && channel.isTextBased()) {
          const rawMessage = welcome.message || 'Selamat datang di {server}, {user}! Anda adalah anggota ke-{memberCount}.';
          const formatted = this.formatMessage(rawMessage, member);

          const embed = AppEmbed.primary(`Selamat Datang!`, formatted)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

          await channel.send({ content: `<@${member.id}>`, embeds: [embed] }).then(() => {
            logger.info({ channelId: channel.id, userId: member.id }, '✅ Pesan sambutan berhasil dikirim ke saluran!');
          }).catch((sendErr) => {
            logger.error({ error: sendErr.message, channelId: channel.id }, '❌ Gagal mengirim pesan sambutan ke saluran');
          });
        } else {
          logger.warn({ channelId: welcome.channelId }, 'Saluran sambutan tidak ditemukan atau bot tidak memiliki akses');
        }
      } else {
        logger.info(
          { guildId: member.guild.id, enabled: welcome.enabled, channelId: welcome.channelId },
          'ℹ️ Pesan sambutan tidak dikirim: status enabled masih false atau channel belum dipilih'
        );
      }

      // 3. Welcome DM (handled safely)
      if (welcome.dmEnabled && welcome.dmMessage) {
        const dmText = this.formatMessage(welcome.dmMessage, member);
        const dmEmbed = AppEmbed.info(`Selamat Datang di ${member.guild.name}!`, dmText);
        await member.send({ embeds: [dmEmbed] }).catch(() => {
          logger.debug({ userId: member.id }, 'Could not send welcome DM: User has DMs closed');
        });
      }
    } catch (err) {
      logger.error({ error: err.message, guildId: member.guild?.id }, 'Error handling member join');
    }
  }

  static async handleMemberLeave(member) {
    try {
      // 0. Ignore bot accounts
      if (member.user?.bot) return;

      // Deduplicate rapid duplicate events
      const dedupeKey = `${member.guild.id}:${member.id}`;
      if (isDuplicate(leaveDedupeCache, dedupeKey)) {
        logger.debug({ userId: member.id, guildId: member.guild.id }, 'Ignored duplicate member leave event');
        return;
      }

      const config = await guildRepository.getGuildConfig(member.guild.id);
      const welcome = config.welcomeConfig;
      if (!welcome) return;

      // Unified channel logic: use goodbyeChannelId if set, otherwise fallback to welcome channelId
      const targetChannelId = welcome.goodbyeChannelId || welcome.channelId;
      const isEnabled = welcome.goodbyeEnabled ?? welcome.enabled;

      if (!isEnabled || !targetChannelId) {
        logger.info(
          { guildId: member.guild.id, isEnabled, targetChannelId },
          'ℹ️ Pesan perpisahan (keluar) tidak dikirim: fitur belum diaktifkan atau saluran belum dipilih'
        );
        return;
      }

      const channel = await member.guild.channels.fetch(targetChannelId).catch((err) => {
        logger.error({ error: err.message, channelId: targetChannelId }, 'Gagal mengambil saluran perpisahan (keluar)');
        return null;
      });

      if (channel && channel.isTextBased()) {
        const rawMessage = welcome.goodbyeMessage || '{username} telah meninggalkan {server}. Sekarang tersisa {memberCount} anggota.';
        const formatted = this.formatMessage(rawMessage, member);

        const embed = AppEmbed.warning('Sampai Jumpa!', formatted)
          .setThumbnail(member.user?.displayAvatarURL ? member.user.displayAvatarURL({ dynamic: true }) : null);

        await channel.send({ content: `**${member.user?.username || 'Seorang anggota'}** telah meninggalkan server.`, embeds: [embed] }).then(() => {
          logger.info({ channelId: channel.id, userId: member.id }, '✅ Pesan perpisahan (keluar) berhasil dikirim ke saluran!');
        }).catch((sendErr) => {
          logger.error({ error: sendErr.message, channelId: channel.id }, '❌ Gagal mengirim pesan perpisahan (keluar) ke saluran');
        });
      } else {
        logger.warn({ channelId: targetChannelId }, 'Saluran perpisahan tidak ditemukan atau bot tidak memiliki akses');
      }
    } catch (err) {
      logger.error({ error: err.message, guildId: member.guild?.id }, 'Error handling member leave');
    }
  }
}
