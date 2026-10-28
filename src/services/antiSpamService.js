import { PermissionFlagsBits } from 'discord.js';
import { guildRepository } from '../repositories/guildRepository.js';
import { ModerationService } from './moderationService.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

class AntiSpamService {
  constructor() {
    this.messageHistory = new Map(); // key: `${guildId}:${userId}` -> array of timestamps
    this.joinHistory = new Map();    // key: guildId -> array of timestamps
  }

  async checkMessage(message) {
    if (!message.guild || message.author.bot) return false;

    const config = await guildRepository.getGuildConfig(message.guild.id);
    const now = Date.now();
    const key = `${message.guild.id}:${message.author.id}`;

    // 0. Anti-Spam Hack Trap (Honeypot Channel) Check
    if (config.antiSpamTrapEnabled && config.antiSpamTrapChannelId === message.channel.id) {
      // Exclude Administrators and Server Owner so staff don't get accidentally kicked
      const isStaff = message.member?.permissions?.has(PermissionFlagsBits.Administrator) || message.guild.ownerId === message.author.id;
      if (!isStaff) {
        // 1. Immediately delete the dangerous spam/phishing message
        await message.delete().catch(() => null);

        // 2. DM the user with safety advice
        const dmEmbed = AppEmbed.error(
          'Dikeluarkan dari Server (Anti-Spam Hack Trap)',
          `Anda telah dikeluarkan dari server **${message.guild.name}** karena terdeteksi mengirim pesan di saluran terlarang / perangkap spam (<#${message.channel.id}>).\n\n` +
          `⚠️ **PERINGATAN KEAMANAN:** Jika Anda tidak merasa mengirim pesan tersebut, akun Discord Anda kemungkinan telah **terinfeksi token grabber / dibajak**. Segera ubah kata sandi akun Discord Anda dan aktifkan Two-Factor Authentication (2FA)!`
        );
        await message.author.send({ embeds: [dmEmbed] }).catch(() => null);

        // 3. Immediately kick the member
        const kickRes = await ModerationService.kickMember({
          guild: message.guild,
          moderatorMember: message.guild.members.me,
          targetMember: message.member,
          reason: `[Anti-Spam Hack Trap] Mengirim pesan di saluran perangkap spam (#${message.channel.name}). Konten: "${(message.content || '').slice(0, 80)}"`,
        });

        // 4. Alert staff via ModLog channel
        if (config.modLogChannelId) {
          const modLogChan = await message.guild.channels.fetch(config.modLogChannelId).catch(() => null);
          if (modLogChan && modLogChan.isTextBased()) {
            const trapEmbed = AppEmbed.error(
              '🚨 AKUN SPAM / HACK DI-KICK OTOMATIS',
              `Sistem mendeteksi pesan di saluran perangkap keamanan (Honeypot Channel).\n\n` +
              `• **Pengguna:** <@${message.author.id}> (\`${message.author.tag}\` | \`${message.author.id}\`)\n` +
              `• **Saluran Perangkap:** <#${message.channel.id}>\n` +
              `• **Tindakan:** Langsung di-KICK dari server\n` +
              `• **Status Kick:** ${kickRes.success ? '✅ Berhasil' : `❌ Gagal (${kickRes.reason})`}\n` +
              `• **Isi Pesan:**\n\`\`\`\n${(message.content || '(Lampiran/Gambar/Stiker)').slice(0, 500)}\n\`\`\``
            );
            await modLogChan.send({ embeds: [trapEmbed] }).catch(() => null);
          }
        }

        logger.warn(
          { userId: message.author.id, userTag: message.author.tag, channelId: message.channel.id, guildId: message.guild.id },
          'Anti-Spam Hack Trap terpicu: Pengguna langsung di-kick'
        );
        return true;
      }
    }

    // 1. Mention Spam Check
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (config.mentionSpamThreshold && mentionCount >= config.mentionSpamThreshold) {
      await message.delete().catch(() => null);

      await ModerationService.timeoutMember({
        guild: message.guild,
        moderatorMember: message.guild.members.me,
        targetMember: message.member,
        durationSeconds: 300, // 5 min timeout
        reason: `[Sistem Otomatis] Terdeteksi Mention Spam (${mentionCount} sebutan).`,
      });

      await message.channel.send({
        content: `⚠️ <@${message.author.id}> telah diberikan timeout 5 menit karena melakukan mention spam.`,
      }).then((m) => setTimeout(() => m.delete().catch(() => null), 8000));

      return true;
    }

    // 2. Link Filter Check
    if (config.filterLinksEnabled) {
      const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
      if (inviteRegex.test(message.content)) {
        // Exclude members with ManageMessages or Admin
        if (!message.member.permissions.has('ManageMessages')) {
          await message.delete().catch(() => null);
          await message.channel.send({
            content: `🚫 <@${message.author.id}>, tautan undangan Discord tidak diizinkan di server ini.`,
          }).then((m) => setTimeout(() => m.delete().catch(() => null), 6000));
          return true;
        }
      }
    }

    // 3. Flood Spam Check
    if (config.antiSpamEnabled) {
      let history = this.messageHistory.get(key) || [];
      history = history.filter((ts) => now - ts < config.antiSpamIntervalMs);
      history.push(now);
      this.messageHistory.set(key, history);

      if (history.length >= config.antiSpamThreshold) {
        this.messageHistory.delete(key);
        await message.delete().catch(() => null);

        await ModerationService.timeoutMember({
          guild: message.guild,
          moderatorMember: message.guild.members.me,
          targetMember: message.member,
          durationSeconds: 60, // 1 min timeout
          reason: `[Sistem Otomatis] Pesan flood spam terdeteksi (${history.length} pesan dalam ${config.antiSpamIntervalMs / 1000}s).`,
        });

        await message.channel.send({
          content: `⚠️ <@${message.author.id}> diberikan timeout 1 menit karena mengirim pesan terlalu cepat (flood spam).`,
        }).then((m) => setTimeout(() => m.delete().catch(() => null), 6000));

        return true;
      }
    }

    return false;
  }

  async checkJoinRaid(member) {
    const config = await guildRepository.getGuildConfig(member.guild.id);
    if (!config.antiRaidEnabled) return;

    const now = Date.now();
    let joins = this.joinHistory.get(member.guild.id) || [];
    joins = joins.filter((ts) => now - ts < config.antiRaidIntervalMs);
    joins.push(now);
    this.joinHistory.set(member.guild.id, joins);

    if (joins.length >= config.antiRaidThreshold) {
      logger.warn({ guildId: member.guild.id, joinCount: joins.length }, 'ANTI-RAID TRIGGERED!');
      // Alert staff via mod log
      if (config.modLogChannelId) {
        const logChannel = await member.guild.channels.fetch(config.modLogChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send({
            content: `🚨 **PERINGATAN ANTI-RAID:** Terdeteksi lonjakan bergabung (${joins.length} anggota baru dalam ${config.antiRaidIntervalMs / 1000} detik)! Harap periksa keamanan server.`,
          }).catch(() => null);
        }
      }
    }
  }
}

export const antiSpamService = new AntiSpamService();
