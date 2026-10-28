import { PermissionFlagsBits } from 'discord.js';
import { moderationRepository } from '../repositories/moderationRepository.js';
import { guildRepository } from '../repositories/guildRepository.js';
import { validateHierarchy } from '../utils/permissionGuard.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export class ModerationService {
  static async sendModLog(guild, embed) {
    try {
      const config = await guildRepository.getGuildConfig(guild.id);
      if (!config.modLogChannelId) return;

      const logChannel = await guild.channels.fetch(config.modLogChannelId).catch(() => null);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      logger.error({ guildId: guild.id, error: err.message }, 'Failed to send moderation log');
    }
  }

  static async banMember({ guild, moderatorMember, targetUser, reason, deleteMessageDays = 0 }) {
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    const hierarchy = validateHierarchy({
      moderatorMember,
      targetMember,
      botMember: guild.members.me,
    });

    if (!hierarchy.valid) {
      return { success: false, reason: hierarchy.reason };
    }

    try {
      await guild.bans.create(targetUser.id, {
        reason: `${reason} | Moderator: ${moderatorMember.user.tag}`,
        deleteMessageSeconds: deleteMessageDays * 86400,
      });

      const modCase = await moderationRepository.createCase({
        guildId: guild.id,
        targetId: targetUser.id,
        targetTag: targetUser.tag,
        moderatorId: moderatorMember.id,
        moderatorTag: moderatorMember.user.tag,
        action: 'BAN',
        reason,
      });

      const logEmbed = AppEmbed.error(
        `Kasus #${modCase.caseNumber} | BAN`,
        `**Target:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${moderatorMember.id}>\n**Alasan:** ${reason}`
      );
      await this.sendModLog(guild, logEmbed);

      return { success: true, caseNumber: modCase.caseNumber };
    } catch (err) {
      logger.error({ error: err.message }, 'Error banning member');
      return { success: false, reason: `Gagal memblokir: ${err.message}` };
    }
  }

  static async unbanMember({ guild, moderatorMember, targetUserId, reason }) {
    try {
      await guild.bans.remove(targetUserId, `${reason} | Moderator: ${moderatorMember.user.tag}`);

      const modCase = await moderationRepository.createCase({
        guildId: guild.id,
        targetId: targetUserId,
        targetTag: targetUserId,
        moderatorId: moderatorMember.id,
        moderatorTag: moderatorMember.user.tag,
        action: 'UNBAN',
        reason,
      });

      const logEmbed = AppEmbed.success(
        `Kasus #${modCase.caseNumber} | UNBAN`,
        `**Target ID:** ${targetUserId}\n**Moderator:** <@${moderatorMember.id}>\n**Alasan:** ${reason}`
      );
      await this.sendModLog(guild, logEmbed);

      return { success: true, caseNumber: modCase.caseNumber };
    } catch (err) {
      logger.error({ error: err.message }, 'Error unbanning member');
      return { success: false, reason: `Gagal membatalkan blokir: ${err.message}` };
    }
  }

  static async kickMember({ guild, moderatorMember, targetMember, reason }) {
    const hierarchy = validateHierarchy({
      moderatorMember,
      targetMember,
      botMember: guild.members.me,
    });

    if (!hierarchy.valid) {
      return { success: false, reason: hierarchy.reason };
    }

    try {
      await targetMember.kick(`${reason} | Moderator: ${moderatorMember.user.tag}`);

      const modCase = await moderationRepository.createCase({
        guildId: guild.id,
        targetId: targetMember.id,
        targetTag: targetMember.user.tag,
        moderatorId: moderatorMember.id,
        moderatorTag: moderatorMember.user.tag,
        action: 'KICK',
        reason,
      });

      const logEmbed = AppEmbed.warning(
        `Kasus #${modCase.caseNumber} | KICK`,
        `**Target:** <@${targetMember.id}> (${targetMember.user.tag})\n**Moderator:** <@${moderatorMember.id}>\n**Alasan:** ${reason}`
      );
      await this.sendModLog(guild, logEmbed);

      return { success: true, caseNumber: modCase.caseNumber };
    } catch (err) {
      logger.error({ error: err.message }, 'Error kicking member');
      return { success: false, reason: `Gagal mengeluarkan anggota: ${err.message}` };
    }
  }

  static async timeoutMember({ guild, moderatorMember, targetMember, durationSeconds, reason }) {
    const hierarchy = validateHierarchy({
      moderatorMember,
      targetMember,
      botMember: guild.members.me,
    });

    if (!hierarchy.valid) {
      return { success: false, reason: hierarchy.reason };
    }

    try {
      await targetMember.timeout(durationSeconds * 1000, `${reason} | Moderator: ${moderatorMember.user.tag}`);

      const modCase = await moderationRepository.createCase({
        guildId: guild.id,
        targetId: targetMember.id,
        targetTag: targetMember.user.tag,
        moderatorId: moderatorMember.id,
        moderatorTag: moderatorMember.user.tag,
        action: 'TIMEOUT',
        duration: durationSeconds,
        reason,
      });

      const logEmbed = AppEmbed.warning(
        `Kasus #${modCase.caseNumber} | TIMEOUT`,
        `**Target:** <@${targetMember.id}>\n**Moderator:** <@${moderatorMember.id}>\n**Durasi:** ${durationSeconds} detik\n**Alasan:** ${reason}`
      );
      await this.sendModLog(guild, logEmbed);

      return { success: true, caseNumber: modCase.caseNumber };
    } catch (err) {
      logger.error({ error: err.message }, 'Error timing out member');
      return { success: false, reason: `Gagal memberikan timeout: ${err.message}` };
    }
  }

  static async untimeoutMember({ guild, moderatorMember, targetMember, reason }) {
    const hierarchy = validateHierarchy({
      moderatorMember,
      targetMember,
      botMember: guild.members.me,
    });

    if (!hierarchy.valid) {
      return { success: false, reason: hierarchy.reason };
    }

    try {
      await targetMember.timeout(null, `${reason} | Moderator: ${moderatorMember.user.tag}`);

      const modCase = await moderationRepository.createCase({
        guildId: guild.id,
        targetId: targetMember.id,
        targetTag: targetMember.user.tag,
        moderatorId: moderatorMember.id,
        moderatorTag: moderatorMember.user.tag,
        action: 'UNTIMEOUT',
        reason,
      });

      const logEmbed = AppEmbed.success(
        `Kasus #${modCase.caseNumber} | UNTIMEOUT`,
        `**Target:** <@${targetMember.id}>\n**Moderator:** <@${moderatorMember.id}>\n**Alasan:** ${reason}`
      );
      await this.sendModLog(guild, logEmbed);

      return { success: true, caseNumber: modCase.caseNumber };
    } catch (err) {
      logger.error({ error: err.message }, 'Error removing timeout');
      return { success: false, reason: `Gagal membatalkan timeout: ${err.message}` };
    }
  }

  static async warnMember({ guild, moderatorMember, targetUser, reason }) {
    try {
      await moderationRepository.addWarning({
        guildId: guild.id,
        userId: targetUser.id,
        moderatorId: moderatorMember.id,
        reason,
      });

      const modCase = await moderationRepository.createCase({
        guildId: guild.id,
        targetId: targetUser.id,
        targetTag: targetUser.tag,
        moderatorId: moderatorMember.id,
        moderatorTag: moderatorMember.user.tag,
        action: 'WARN',
        reason,
      });

      const logEmbed = AppEmbed.warning(
        `Kasus #${modCase.caseNumber} | PERINGATAN (WARN)`,
        `**Target:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${moderatorMember.id}>\n**Alasan:** ${reason}`
      );
      await this.sendModLog(guild, logEmbed);

      return { success: true, caseNumber: modCase.caseNumber };
    } catch (err) {
      logger.error({ error: err.message }, 'Error warning member');
      return { success: false, reason: `Gagal memberi peringatan: ${err.message}` };
    }
  }

  static async purgeMessages({ channel, amount, filterUser = null }) {
    try {
      let messages = await channel.messages.fetch({ limit: amount });

      // Discord restriction: Cannot bulk delete messages older than 14 days
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter((m) => m.createdTimestamp > fourteenDaysAgo);

      if (filterUser) {
        messages = messages.filter((m) => m.author.id === filterUser.id);
      }

      if (messages.size === 0) {
        return { success: false, reason: 'Tidak ada pesan yang dapat dihapus (pesan mungkin berusia lebih dari 14 hari).' };
      }

      const deleted = await channel.bulkDelete(messages, true);
      return { success: true, count: deleted.size };
    } catch (err) {
      logger.error({ error: err.message }, 'Error purging messages');
      return { success: false, reason: `Gagal menghapus pesan: ${err.message}` };
    }
  }

  static async lockChannel({ channel, moderatorMember, reason }) {
    try {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false,
      });

      return { success: true };
    } catch (err) {
      logger.error({ error: err.message }, 'Error locking channel');
      return { success: false, reason: err.message };
    }
  }

  static async unlockChannel({ channel, moderatorMember, reason }) {
    try {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: null,
        AddReactions: null,
      });

      return { success: true };
    } catch (err) {
      logger.error({ error: err.message }, 'Error unlocking channel');
      return { success: false, reason: err.message };
    }
  }
}
