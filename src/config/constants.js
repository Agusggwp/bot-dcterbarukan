export const COLORS = {
  PRIMARY: 0x5865F2, // Discord Blurple
  SUCCESS: 0x57F287, // Green
  WARNING: 0xFEE75C, // Yellow
  ERROR: 0xED4245,   // Red
  INFO: 0x3498DB,    // Blue
  DARK: 0x2B2D31,    // Discord Dark Theme
};

export const EMOJIS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  SHIELD: '🛡️',
  TICKET: '🎫',
  LOCK: '🔒',
  UNLOCK: '🔓',
  COIN: '🪙',
  TROPHY: '🏆',
  GIVEAWAY: '🎉',
  BELL: '🔔',
  PENCIL: '✏️',
  TRASH: '🗑️',
};

export const LIMITS = {
  PURGE_MAX: 100,
  PURGE_MIN: 1,
  TIMEOUT_MAX_SECONDS: 2419200, // 28 days (Discord maximum timeout)
  TIMEOUT_MIN_SECONDS: 5,
  MASSROLE_BATCH_SIZE: 15,
  MAX_TICKETS_PER_USER: 3,
  MAX_GIVEAWAY_WINNERS: 20,
  DEFAULT_XP_COOLDOWN: 60, // 60 seconds
  DEFAULT_MIN_XP: 15,
  DEFAULT_MAX_XP: 25,
};

export const PERMISSION_TRANSLATIONS = {
  Administrator: 'Administrator',
  ManageGuild: 'Kelola Server',
  ManageRoles: 'Kelola Peran',
  ManageChannels: 'Kelola Saluran',
  KickMembers: 'Keluarkan Anggota',
  BanMembers: 'Blokir Anggota',
  ModerateMembers: 'Moderasi Anggota (Timeout)',
  ManageMessages: 'Kelola Pesan',
  SendMessages: 'Kirim Pesan',
  EmbedLinks: 'Sematkan Tautan',
  AttachFiles: 'Lampirkan Berkas',
  ViewAuditLog: 'Lihat Audit Log',
};
