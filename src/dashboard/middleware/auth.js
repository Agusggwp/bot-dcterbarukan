import { PermissionFlagsBits } from 'discord.js';

export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.redirect('/auth/login');
  }
  next();
}

export function requireGuildAdmin(client) {
  return async (req, res, next) => {
    const { guildId } = req.params;
    if (!req.session?.user) {
      return res.redirect('/auth/login');
    }

    // Check if bot is in the guild
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).render('error', {
        title: 'Server Tidak Ditemukan',
        message: 'Bot belum diundang atau tidak berada di server ini.',
      });
    }

    // Verify user is in the guild and has Administrator permission
    const userGuilds = req.session.guilds || [];
    const matchingGuild = userGuilds.find((g) => g.id === guildId);

    if (!matchingGuild) {
      return res.status(403).render('error', {
        title: 'Akses Ditolak',
        message: 'Anda bukan anggota dari server ini.',
      });
    }

    // In Discord OAuth2, guild.permissions is a bitfield string. Administrator = 0x8 (1 << 3)
    const permissions = BigInt(matchingGuild.permissions);
    const isAdmin = (permissions & BigInt(PermissionFlagsBits.Administrator)) === BigInt(PermissionFlagsBits.Administrator);

    if (!isAdmin && matchingGuild.owner !== true) {
      return res.status(403).render('error', {
        title: 'Izin Tidak Cukup',
        message: 'Anda harus memiliki izin Administrator di server ini untuk mengakses pengaturan.',
      });
    }

    req.guild = guild;
    next();
  };
}
