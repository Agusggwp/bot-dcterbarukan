import express from 'express';
import { PermissionFlagsBits } from 'discord.js';
import { requireAuth, requireGuildAdmin } from '../middleware/auth.js';
import { guildRepository } from '../../repositories/guildRepository.js';
import { moderationRepository } from '../../repositories/moderationRepository.js';
import { formatSecondsToHuman } from '../../utils/timeParser.js';

export function createPagesRouter(client) {
  const router = express.Router();

  // Landing Page
  router.get('/', (req, res) => {
    res.render('index', {
      user: req.session?.user || null,
      stats: {
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        uptime: formatSecondsToHuman(Math.floor(process.uptime())),
        ping: client.ws.ping,
      },
    });
  });

  // Health Status Endpoint
  router.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsageMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      botPingMs: client.ws.ping,
      guildCount: client.guilds.cache.size,
    });
  });

  // Guilds Selection Page
  router.get('/guilds', requireAuth, (req, res) => {
    const userGuilds = req.session.guilds || [];

    // Filter user guilds where they have Administrator permission
    const adminGuilds = userGuilds
      .filter((g) => {
        const perms = BigInt(g.permissions);
        const isAdmin = (perms & BigInt(PermissionFlagsBits.Administrator)) === BigInt(PermissionFlagsBits.Administrator);
        return isAdmin || g.owner === true;
      })
      .map((g) => {
        const botInGuild = client.guilds.cache.has(g.id);
        return {
          ...g,
          botInGuild,
          iconUrl: g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png',
        };
      });

    res.render('guilds', {
      user: req.session.user,
      botClientId: client.user?.id || env.DISCORD_CLIENT_ID,
      guilds: adminGuilds,
    });
  });

  // Guild Management Page
  router.get('/guilds/:guildId', requireAuth, requireGuildAdmin(client), async (req, res) => {
    const { guild } = req;
    const config = await guildRepository.getGuildConfig(guild.id);
    const recentCases = await moderationRepository.getUserCases(guild.id, null, 5).catch(() => []);

    // Extract text channels, voice channels & roles for select options
    const channels = guild.channels.cache
      .filter((c) => c.isTextBased())
      .map((c) => ({ id: c.id, name: c.name }));

    const voiceChannels = guild.channels.cache
      .filter((c) => c.isVoiceBased())
      .map((c) => ({ id: c.id, name: c.name, memberCount: c.members?.size || 0 }));

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }));

    res.render('dashboard', {
      user: req.session.user,
      guild: {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        iconUrl: guild.iconURL({ dynamic: true }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
      },
      config,
      channels,
      voiceChannels,
      roles,
      recentCases,
    });
  });

  return router;
}
