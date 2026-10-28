import express from 'express';
import { z } from 'zod';
import { guildRepository } from '../../repositories/guildRepository.js';
import { requireAuth, requireGuildAdmin } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';

export function createApiRouter(client) {
  const router = express.Router();

  const settingsSchema = z.object({
    modLogChannelId: z.string().optional().nullable(),
    adminRoleId: z.string().optional().nullable(),
    modRoleId: z.string().optional().nullable(),
    antiSpamEnabled: z.boolean().optional(),
    antiRaidEnabled: z.boolean().optional(),
    filterLinksEnabled: z.boolean().optional(),
    antiSpamTrapEnabled: z.boolean().optional(),
    antiSpamTrapChannelId: z.string().optional().nullable(),
    antiSpamTrapMessage: z.string().max(1000).optional().nullable(),
    autoSendTrapNotice: z.boolean().optional(),
    welcomeEnabled: z.boolean().optional(),
    welcomeChannelId: z.string().optional().nullable(),
    welcomeMessage: z.string().max(1000).optional().nullable(),
    goodbyeEnabled: z.boolean().optional(),
    goodbyeChannelId: z.string().optional().nullable(),
    goodbyeMessage: z.string().max(1000).optional().nullable(),
    autoRoleId: z.string().optional().nullable(),
    levelingEnabled: z.boolean().optional(),
    xpRate: z.number().min(0.1).max(10).optional(),
    musicDefaultVolume: z.number().min(0).max(100).optional(),
    musicChannelId: z.string().optional().nullable(),
    musicDjRoleId: z.string().optional().nullable(),
    musicAutoLeave: z.boolean().optional(),
  });

  router.post('/guilds/:guildId/settings', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;

    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.format() });
    }

    try {
      const data = parsed.data;

      // Update Guild Config
      await guildRepository.updateGuildConfig(guildId, {
        modLogChannelId: data.modLogChannelId || null,
        adminRoleId: data.adminRoleId || null,
        modRoleId: data.modRoleId || null,
        antiSpamEnabled: data.antiSpamEnabled ?? true,
        antiRaidEnabled: data.antiRaidEnabled ?? false,
        filterLinksEnabled: data.filterLinksEnabled ?? false,
        antiSpamTrapEnabled: data.antiSpamTrapEnabled ?? false,
        antiSpamTrapChannelId: data.antiSpamTrapChannelId || null,
        antiSpamTrapMessage: data.antiSpamTrapMessage || null,
        musicDefaultVolume: data.musicDefaultVolume ?? 80,
        musicChannelId: data.musicChannelId || null,
        musicDjRoleId: data.musicDjRoleId || null,
        musicAutoLeave: data.musicAutoLeave ?? true,
      });

      // Update Welcome & Goodbye (Masuk & Keluar) Config
      await guildRepository.updateWelcomeConfig(guildId, {
        enabled: data.welcomeEnabled ?? false,
        channelId: data.welcomeChannelId || null,
        message: data.welcomeMessage || null,
        autoRoleId: data.autoRoleId || null,
        goodbyeEnabled: data.goodbyeEnabled ?? false,
        // If goodbyeChannelId is not explicitly specified, unified mode uses welcomeChannelId!
        goodbyeChannelId: data.goodbyeChannelId || data.welcomeChannelId || null,
        goodbyeMessage: data.goodbyeMessage || null,
      });

      // Update Level Config
      await guildRepository.updateLevelConfig(guildId, {
        enabled: data.levelingEnabled ?? true,
        xpRate: data.xpRate ?? 1.0,
      });

      // If user enabled trap and provided a channel, auto-send notice if requested
      if (data.antiSpamTrapEnabled && data.antiSpamTrapChannelId && data.autoSendTrapNotice) {
        try {
          const guild = client.guilds.cache.get(guildId);
          if (guild) {
            const trapChan = await guild.channels.fetch(data.antiSpamTrapChannelId).catch(() => null);
            if (trapChan && trapChan.isTextBased()) {
              const { AppEmbed } = await import('../../utils/embedBuilder.js');
              const defaultMsg = 'Jangan kirim pesan ke sini karena ini saluran khusus! Siapa pun yang mengetik di saluran ini akan langsung di-KICK otomatis demi keamanan server.';
              const noticeText = data.antiSpamTrapMessage || defaultMsg;
              const embed = AppEmbed.error('⛔ PERINGATAN: SALURAN KHUSUS / TERLARANG', noticeText)
                .setFooter({ text: 'Sistem Keamanan Anti-Spam Hack • Mengirim pesan = KICK otomatis' });
              await trapChan.send({ embeds: [embed] }).catch(() => null);
            }
          }
        } catch (e) {
          logger.warn({ error: e.message }, 'Failed auto-sending trap notice on settings save');
        }
      }

      res.json({ success: true, message: 'Pengaturan berhasil diperbarui.' });
    } catch (err) {
      logger.error({ guildId, error: err.message }, 'Failed to update guild settings via dashboard API');
      res.status(500).json({ success: false, message: 'Gagal memperbarui database.' });
    }
  });

  router.post('/guilds/:guildId/send-trap-notice', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(404).json({ success: false, message: 'Server tidak ditemukan di bot.' });

      const config = await guildRepository.getGuildConfig(guildId);
      const channelId = req.body?.channelId || config.antiSpamTrapChannelId;
      if (!channelId) {
        return res.status(400).json({ success: false, message: 'Pilih Saluran Perangkap terlebih dahulu.' });
      }

      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return res.status(400).json({ success: false, message: 'Saluran tidak valid atau bot tidak memiliki izin mengirim pesan.' });
      }

      const { AppEmbed } = await import('../../utils/embedBuilder.js');
      const defaultMsg = 'Jangan kirim pesan ke sini karena ini saluran khusus! Siapa pun yang mengetik di saluran ini akan langsung di-KICK otomatis demi keamanan server.';
      const noticeText = req.body?.message || config.antiSpamTrapMessage || defaultMsg;

      const embed = AppEmbed.error('⛔ PERINGATAN: SALURAN KHUSUS / TERLARANG', noticeText)
        .setFooter({ text: 'Sistem Keamanan Anti-Spam Hack • Mengirim pesan = KICK otomatis' });

      await channel.send({ embeds: [embed] });

      res.json({ success: true, message: `Pesan peringatan berhasil dikirim ke #${channel.name}!` });
    } catch (err) {
      logger.error({ error: err.message }, 'Error sending trap notice from dashboard');
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/guilds/:guildId/test-welcome', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(404).json({ success: false, message: 'Server tidak ditemukan di bot.' });

      const config = await guildRepository.getGuildConfig(guildId);
      const welcome = config.welcomeConfig;
      if (!welcome || !welcome.channelId) {
        return res.status(400).json({ success: false, message: 'Pilih Saluran Sambutan dan simpan pengaturan terlebih dahulu.' });
      }

      const channel = await guild.channels.fetch(welcome.channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return res.status(400).json({ success: false, message: 'Saluran tidak valid atau bot tidak memiliki izin mengirim pesan.' });
      }

      const { WelcomeService } = await import('../../services/welcomeService.js');
      const { AppEmbed } = await import('../../utils/embedBuilder.js');

      const member = await guild.members.fetch(req.session.user.id).catch(() => guild.members.me);
      const rawMsg = welcome.message || 'Selamat datang di {server}, {user}! Anda adalah anggota ke-{memberCount}.';
      const formatted = WelcomeService.formatMessage(rawMsg, member);

      const embed = AppEmbed.primary('🎉 [Uji Coba] Selamat Datang!', formatted)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Pesan Uji Coba dari Dashboard' });

      await channel.send({ content: `<@${member.id}> *(Uji Coba dari Dashboard)*`, embeds: [embed] });

      res.json({ success: true, message: `Pesan uji coba berhasil dikirim ke #${channel.name}!` });
    } catch (err) {
      logger.error({ error: err.message }, 'Error sending test welcome from dashboard');
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/guilds/:guildId/test-goodbye', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return res.status(404).json({ success: false, message: 'Server tidak ditemukan di bot.' });

      const config = await guildRepository.getGuildConfig(guildId);
      const welcome = config.welcomeConfig;
      const targetChanId = welcome?.goodbyeChannelId || welcome?.channelId;
      if (!targetChanId) {
        return res.status(400).json({ success: false, message: 'Pilih Saluran Masuk & Keluar terlebih dahulu.' });
      }

      const channel = await guild.channels.fetch(targetChanId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return res.status(400).json({ success: false, message: 'Saluran tidak valid atau bot tidak memiliki izin mengirim pesan.' });
      }

      const { WelcomeService } = await import('../../services/welcomeService.js');
      const { AppEmbed } = await import('../../utils/embedBuilder.js');

      const member = await guild.members.fetch(req.session.user.id).catch(() => guild.members.me);
      const rawMsg = welcome?.goodbyeMessage || '{username} telah meninggalkan server {server}. Sekarang tersisa {memberCount} anggota.';
      const formatted = WelcomeService.formatMessage(rawMsg, member);

      const embed = AppEmbed.warning('👋 [Uji Coba] Sampai Jumpa!', formatted)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Pesan Uji Coba Perpisahan (Keluar) dari Dashboard' });

      await channel.send({ content: `**${member.user.username}** *(Uji Coba Pesan Keluar)*`, embeds: [embed] });

      res.json({ success: true, message: `Pesan uji coba perpisahan berhasil dikirim ke #${channel.name}!` });
    } catch (err) {
      logger.error({ error: err.message }, 'Error sending test goodbye from dashboard');
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Music Status & Live Control
  router.get('/guilds/:guildId/music/status', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;
    const { musicService } = await import('../../services/musicService.js');
    const status = musicService.getStatus(guildId);
    res.json({ success: true, ...status });
  });

  router.post('/guilds/:guildId/music/control', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;
    const { action, value, query, voiceChannelId } = req.body;
    const { musicService } = await import('../../services/musicService.js');
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({ success: false, message: 'Server Discord tidak ditemukan.' });
    }

    // 1. ACTION: PLAY NEW SONG DIRECTLY FROM WEB DASHBOARD
    if (action === 'play') {
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ success: false, message: 'Silakan masukkan judul lagu atau tautan YouTube!' });
      }

      // Resolve member & voice channel
      const member = await guild.members.fetch(req.session.user.id).catch(() => null);
      let voiceChannel = null;
      if (voiceChannelId) {
        voiceChannel = guild.channels.cache.get(voiceChannelId);
      }
      if (!voiceChannel && member?.voice?.channel) {
        voiceChannel = member.voice.channel;
      }
      if (!voiceChannel) {
        // Fallback: check if bot already has an active session in a voice channel
        const currentSub = musicService.getSubscription(guildId);
        if (currentSub?.voiceChannel) {
          voiceChannel = currentSub.voiceChannel;
        }
      }

      if (!voiceChannel) {
        return res.status(400).json({
          success: false,
          message: 'Silakan pilih Saluran Suara (Voice Channel) pada menu di atas atau masuk ke salah satu Voice Channel di Discord terlebih dahulu!',
        });
      }

      // Resolve text channel
      const config = await guildRepository.getGuildConfig(guildId);
      let textChannel = null;
      if (config.musicChannelId) {
        textChannel = guild.channels.cache.get(config.musicChannelId);
      }
      if (!textChannel) {
        textChannel = guild.channels.cache.find((c) => c.isTextBased());
      }

      const callerMember = member || {
        id: req.session.user.id,
        user: { tag: req.session.user.username },
        voice: { channel: voiceChannel },
      };

      try {
        const result = await musicService.play(guildId, query.trim(), callerMember, textChannel, voiceChannel);
        const status = musicService.getStatus(guildId);
        return res.json({
          success: true,
          message: result.status === 'PLAYING'
            ? `Berhasil memutar: ${result.track.title}`
            : `Ditambahkan ke antrean (#${result.position}): ${result.track.title}`,
          ...status,
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    // 2. OTHER CONTROLS REQUIRE ACTIVE SUBSCRIPTION
    const sub = musicService.getSubscription(guildId);
    if (!sub) {
      return res.status(400).json({ success: false, message: 'Tidak ada pemutar musik aktif di saluran suara saat ini.' });
    }

    try {
      if (action === 'pause') sub.pause();
      else if (action === 'resume') sub.resume();
      else if (action === 'skip') sub.skip();
      else if (action === 'stop') sub.stop();
      else if (action === 'volume') sub.setVolume(Number(value) || 80);
      else if (action === 'loop') {
        const nextMode = sub.loopMode === 'off' ? 'song' : sub.loopMode === 'song' ? 'queue' : 'off';
        sub.setLoop(nextMode);
      }
      else if (action === 'remove') {
        sub.removeTrack(Number(value));
      }
      else if (action === 'clearQueue') {
        sub.clearQueue();
      }
      else {
        return res.status(400).json({ success: false, message: 'Aksi kontrol tidak valid.' });
      }

      const status = musicService.getStatus(guildId);
      res.json({ success: true, message: `Aksi musik '${action}' berhasil dijalankan.`, ...status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Real-Time Server-Sent Events (SSE) Stream
  router.get('/guilds/:guildId/events', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    if (res.flushHeaders) res.flushHeaders();

    // 1. Send Initial Snapshot
    const { musicService } = await import('../../services/musicService.js');
    const { moderationRepository } = await import('../../repositories/moderationRepository.js');
    const initialMusic = musicService.getStatus(guildId);
    const initialCases = await moderationRepository.getUserCases(guildId, null, 20);

    res.write(`data: ${JSON.stringify({ type: 'init', music: initialMusic, cases: initialCases })}\n\n`);

    // 2. Real-Time Event Handlers
    const { dashboardEvents } = await import('../../utils/dashboardEvents.js');

    const onMusicUpdate = (status) => {
      res.write(`data: ${JSON.stringify({ type: 'music', music: status })}\n\n`);
    };

    const onModCase = (modCase) => {
      res.write(`data: ${JSON.stringify({ type: 'modCase', modCase })}\n\n`);
    };

    dashboardEvents.on(`music:${guildId}`, onMusicUpdate);
    dashboardEvents.on(`modCase:${guildId}`, onModCase);

    // Heartbeat ping every 25 seconds
    const pingTimer = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(pingTimer);
      dashboardEvents.off(`music:${guildId}`, onMusicUpdate);
      dashboardEvents.off(`modCase:${guildId}`, onModCase);
    });
  });

  // Recent Moderation Cases JSON API (Fallback)
  router.get('/guilds/:guildId/mod-cases', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guildId } = req.params;
    const { moderationRepository } = await import('../../repositories/moderationRepository.js');
    const cases = await moderationRepository.getUserCases(guildId, null, 25);
    res.json({ success: true, cases });
  });

  return router;
}
