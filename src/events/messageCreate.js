import { Events } from 'discord.js';
import { antiSpamService } from '../services/antiSpamService.js';
import { levelRepository } from '../repositories/levelRepository.js';
import { guildRepository } from '../repositories/guildRepository.js';
import { afkUsers } from '../commands/utility/afk.js';
import { formatSecondsToHuman } from '../utils/timeParser.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { LIMITS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    try {
      // 1. Anti-spam & Link filter check
      const wasSpam = await antiSpamService.checkMessage(message);
      if (wasSpam) return;

      // 2. AFK Recovery check for message author
      if (afkUsers.has(message.author.id)) {
        const afkData = afkUsers.get(message.author.id);
        afkUsers.delete(message.author.id);
        const elapsedSec = Math.floor((Date.now() - afkData.timestamp) / 1000);

        const welcomeBack = AppEmbed.info(
          'Selamat Datang Kembali!',
          `<@${message.author.id}>, status AFK Anda telah dicabut setelah aktif selama **${formatSecondsToHuman(elapsedSec)}**.`
        );
        await message.reply({ embeds: [welcomeBack] }).then((m) => setTimeout(() => m.delete().catch(() => null), 6000));
      }

      // 3. AFK Mention check
      if (message.mentions.users.size > 0) {
        for (const [mentionedId, user] of message.mentions.users) {
          if (afkUsers.has(mentionedId)) {
            const afkData = afkUsers.get(mentionedId);
            const elapsedSec = Math.floor((Date.now() - afkData.timestamp) / 1000);

            const afkEmbed = AppEmbed.warning(
              'Pengguna Sedang AFK',
              `<@${mentionedId}> saat ini sedang AFK (${formatSecondsToHuman(elapsedSec)} yang lalu).\n**Alasan:** ${afkData.reason}`
            );
            await message.reply({ embeds: [afkEmbed] });
            break;
          }
        }
      }

      // 4. Leveling & XP Processing
      const config = await guildRepository.getGuildConfig(message.guild.id);
      const levelConfig = config.levelConfig;

      if (levelConfig && levelConfig.enabled) {
        // Check if channel is ignored
        let ignoredChannels = [];
        try {
          ignoredChannels = levelConfig.ignoredChannels ? JSON.parse(levelConfig.ignoredChannels) : [];
        } catch {
          ignoredChannels = [];
        }

        if (!ignoredChannels.includes(message.channel.id)) {
          const minXp = LIMITS.DEFAULT_MIN_XP;
          const maxXp = LIMITS.DEFAULT_MAX_XP;
          const randomXp = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;
          const xpGained = Math.round(randomXp * (levelConfig.xpRate || 1.0));

          const res = await levelRepository.addXp(
            message.guild.id,
            message.author.id,
            xpGained,
            levelConfig.cooldownSeconds || LIMITS.DEFAULT_XP_COOLDOWN
          );

          if (res.updated && res.leveledUp) {
            const levelUpEmbed = AppEmbed.success(
              'Level Up! 🌟',
              `Selamat <@${message.author.id}>! Anda telah mencapai **Level ${res.newLevel}**!`
            );

            let targetChannel = message.channel;
            if (levelConfig.announcementChannelId) {
              const annChannel = await message.guild.channels.fetch(levelConfig.announcementChannelId).catch(() => null);
              if (annChannel && annChannel.isTextBased()) targetChannel = annChannel;
            }

            await targetChannel.send({ embeds: [levelUpEmbed] }).catch(() => null);

            // Check Role Rewards
            if (levelConfig.roleRewards) {
              try {
                const rewards = JSON.parse(levelConfig.roleRewards);
                const roleId = rewards[res.newLevel.toString()];
                if (roleId) {
                  const role = message.guild.roles.cache.get(roleId);
                  if (role) {
                    await message.member.roles.add(role).catch(() => null);
                  }
                }
              } catch (err) {
                logger.warn({ error: err.message }, 'Failed parsing role rewards');
              }
            }
          }
        }
      }

      // 5. Bot Mention Response
      if (message.mentions.has(message.client.user) && !message.mentions.everyone && message.content.includes(message.client.user.id)) {
        const prefix = config.prefix || '!';
        const mentionEmbed = AppEmbed.primary(
          'Halo! 🤖',
          `Prefix saya di server ini adalah \`${prefix}\`\n` +
          `Anda juga dapat menggunakan **Slash Commands** langsung dengan mengetikkan \`/\` (contoh: \`/help\`, \`/ping\`).`
        );
        return await message.reply({ embeds: [mentionEmbed] });
      }

      // 6. Text Prefix Command Support (e.g. !ping, !help, !rank, !balance)
      const prefix = config.prefix || '!';
      if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift()?.toLowerCase();

        if (cmdName === 'ping') {
          const wsPing = message.client.ws.ping;
          const embed = AppEmbed.primary('Pong! 🏓', `**Latensi WebSocket:** \`${wsPing}ms\``);
          return await message.reply({ embeds: [embed] });
        }

        if (cmdName === 'help') {
          const embed = AppEmbed.primary(
            '📚 Panduan Perintah Bot',
            `Prefix: \`${prefix}\` atau gunakan Slash Commands (\`/\`).\n\n` +
            `• \`${prefix}ping\` — Cek koneksi & latensi\n` +
            `• \`${prefix}botinfo\` — Spesifikasi & status bot\n` +
            `• \`${prefix}serverinfo\` — Info server ini\n` +
            `• \`${prefix}rank\` — Cek level & XP Anda\n` +
            `• \`${prefix}leaderboard\` — Peringkat teratas\n` +
            `• \`${prefix}balance\` — Saldo ekonomi virtual\n` +
            `• \`${prefix}daily\` — Klaim koin harian\n` +
            `• \`${prefix}work\` — Bekerja dapat koin\n` +
            `• \`${prefix}shop\` — Toko virtual server\n` +
            `• \`${prefix}inventory\` — Tas barang virtual\n\n` +
            `*Tip: Seluruh 55 perintah lengkap tersedia dengan mengetik \`/\` di Discord!*`
          );
          return await message.reply({ embeds: [embed] });
        }

        if (cmdName === 'botinfo') {
          const embed = AppEmbed.primary(
            '🤖 Info Bot Enterprise',
            `**Node.js:** \`${process.version}\`\n` +
            `**Discord.js:** \`v14.18.0\`\n` +
            `**Uptime:** \`${formatSecondsToHuman(Math.floor(process.uptime()))}\`\n` +
            `**Total Server:** \`${message.client.guilds.cache.size}\``
          );
          return await message.reply({ embeds: [embed] });
        }

        if (cmdName === 'rank') {
          const rankData = await levelRepository.getUserRank(message.guild.id, message.author.id);
          const embed = AppEmbed.primary(
            `Peringkat: ${message.author.tag}`,
            `**Level:** \`${rankData.level}\`\n**XP:** \`${rankData.xp.toLocaleString()} XP\`\n**Peringkat:** ${rankData.rank ? `#${rankData.rank}` : 'Belum Terdaftar'}`
          );
          return await message.reply({ embeds: [embed] });
        }

        if (cmdName === 'balance') {
          const { economyRepository } = await import('../repositories/economyRepository.js');
          const account = await economyRepository.getOrCreateAccount(message.guild.id, message.author.id);
          const embed = AppEmbed.primary(
            `Saldo: ${message.author.tag}`,
            `🪙 **Dompet:** \`${account.wallet.toLocaleString()} Koin\`\n🏦 **Bank:** \`${account.bank.toLocaleString()} Koin\``
          );
          return await message.reply({ embeds: [embed] });
        }

        if (cmdName === 'daily') {
          const { economyRepository } = await import('../repositories/economyRepository.js');
          const res = await economyRepository.claimDaily(message.guild.id, message.author.id, 1000);
          if (!res.success) {
            const waitSec = Math.ceil(res.remainingMs / 1000);
            return await message.reply({ embeds: [AppEmbed.warning('Sudah Diklaim', `Silakan kembali dalam **${formatSecondsToHuman(waitSec)}**.`)] });
          }
          return await message.reply({ embeds: [AppEmbed.success('Hadiah Harian Diklaim', `Anda menerima **1,000 Koin**!`)] });
        }

        if (cmdName === 'test-welcome') {
          const { WelcomeService } = await import('../services/welcomeService.js');
          const welcome = config.welcomeConfig;
          if (!welcome || !welcome.channelId) {
            return await message.reply({ embeds: [AppEmbed.warning('Belum Dikonfigurasi', 'Saluran sambutan belum diatur. Atur di Dashboard terlebih dahulu.')] });
          }
          const targetChan = await message.guild.channels.fetch(welcome.channelId).catch(() => null);
          if (!targetChan || !targetChan.isTextBased()) {
            return await message.reply({ embeds: [AppEmbed.error('Saluran Tidak Valid', 'Bot tidak dapat mengakses saluran sambutan tersebut.')] });
          }
          const rawMsg = welcome.message || 'Selamat datang di {server}, {user}! Anda adalah anggota ke-{memberCount}.';
          const formatted = WelcomeService.formatMessage(rawMsg, message.member);
          const embed = AppEmbed.primary('🎉 [Uji Coba] Selamat Datang!', formatted)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Uji Coba Pesan Sambutan' });
          await targetChan.send({ content: `<@${message.author.id}> *(Uji Coba)*`, embeds: [embed] });
          return await message.reply({ embeds: [AppEmbed.success('Terkirim', `Pesan sambutan telah dikirim ke <#${targetChan.id}>!`)] });
        }

        if (cmdName === 'play') {
          const query = args.join(' ');
          if (!query) {
            return await message.reply({ embeds: [AppEmbed.warning('Masukkan Judul/Tautan', `Contoh: \`${prefix}play lofi hip hop\` atau \`${prefix}play <link>\``)] });
          }
          if (!message.member.voice?.channel) {
            return await message.reply({ embeds: [AppEmbed.warning('Masuk ke Saluran Suara', 'Anda harus masuk ke Voice Channel terlebih dahulu untuk memutar musik.')] });
          }
          const { musicService } = await import('../services/musicService.js');
          try {
            const res = await musicService.play(message.guild.id, query, message.member, message.channel);
            if (res.status === 'PLAYING') {
              const embed = AppEmbed.success('🎶 Memutar Musik', `Sedang memutar: **[${res.track.title}](${res.track.url})**\nDurasi: \`${res.track.duration}\``);
              return await message.reply({ embeds: [embed] });
            } else {
              const embed = AppEmbed.info('📥 Dimasukkan ke Antrean', `Ditambahkan ke antrean (#${res.position}): **[${res.track.title}](${res.track.url})**\nDurasi: \`${res.track.duration}\``);
              return await message.reply({ embeds: [embed] });
            }
          } catch (err) {
            return await message.reply({ embeds: [AppEmbed.error('Gagal Memutar', err.message)] });
          }
        }

        if (cmdName === 'skip') {
          const { musicService } = await import('../services/musicService.js');
          const sub = musicService.getSubscription(message.guild.id);
          if (!sub || !sub.currentSong) {
            return await message.reply({ embeds: [AppEmbed.warning('Tidak Ada Musik', 'Saat ini tidak ada lagu yang sedang diputar.')] });
          }
          const title = sub.currentSong.title;
          sub.skip();
          return await message.reply({ embeds: [AppEmbed.info('⏭️ Dilewati', `Lagu **${title}** telah dilewati.`)] });
        }

        if (cmdName === 'stop') {
          const { musicService } = await import('../services/musicService.js');
          const sub = musicService.getSubscription(message.guild.id);
          if (!sub) {
            return await message.reply({ embeds: [AppEmbed.warning('Tidak Ada Musik', 'Bot tidak sedang memutar musik.')] });
          }
          sub.stop();
          return await message.reply({ embeds: [AppEmbed.success('⏹️ Berhenti', 'Musik dihentikan dan bot telah keluar dari saluran suara.')] });
        }

        if (cmdName === 'pause') {
          const { musicService } = await import('../services/musicService.js');
          const sub = musicService.getSubscription(message.guild.id);
          if (sub && sub.currentSong) {
            sub.pause();
            return await message.reply({ embeds: [AppEmbed.info('⏸️ Dijeda', `Musik dijeda. Ketik \`${prefix}resume\` untuk melanjutkan.`)] });
          }
        }

        if (cmdName === 'resume') {
          const { musicService } = await import('../services/musicService.js');
          const sub = musicService.getSubscription(message.guild.id);
          if (sub && sub.currentSong) {
            sub.resume();
            return await message.reply({ embeds: [AppEmbed.success('▶️ Dilanjutkan', `Melanjutkan: **${sub.currentSong.title}**`)] });
          }
        }

        if (cmdName === 'queue') {
          const { musicService } = await import('../services/musicService.js');
          const sub = musicService.getSubscription(message.guild.id);
          if (!sub || (!sub.currentSong && sub.queue.length === 0)) {
            return await message.reply({ embeds: [AppEmbed.info('Antrean Kosong', 'Tidak ada lagu di dalam antrean.')] });
          }
          let desc = `**Sedang Diputar:**\n▶️ [${sub.currentSong.title}](${sub.currentSong.url})\n\n`;
          if (sub.queue.length > 0) {
            desc += `**Antrean Berikutnya (${sub.queue.length}):**\n`;
            sub.queue.slice(0, 5).forEach((s, i) => { desc += `\`${i+1}.\` [${s.title}](${s.url})\n`; });
          }
          return await message.reply({ embeds: [AppEmbed.primary('📑 Antrean Musik', desc)] });
        }
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Error in messageCreate event');
    }
  },
};
