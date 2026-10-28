import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const mockData = {
  'index.ejs': {
    user: { username: 'TestUser' },
    stats: { guilds: 10, users: 500, ping: 25, uptime: '2j 15m' }
  },
  'guilds.ejs': {
    user: { username: 'TestUser' },
    guilds: [
      { id: '123', name: 'Test Guild 1', iconUrl: 'https://example.com/icon.png', botInGuild: true },
      { id: '456', name: 'Test Guild 2', iconUrl: 'https://example.com/icon.png', botInGuild: false }
    ],
    botClientId: '123456789'
  },
  'error.ejs': {
    title: 'Server Error',
    message: 'Something went wrong'
  },
  'dashboard.ejs': {
    user: { username: 'TestUser' },
    guild: { id: '123', name: 'Test Guild', iconUrl: 'https://example.com/icon.png' },
    config: {
      antiSpam: true,
      antiLink: false,
      antiRaid: true,
      logChannelId: '999',
      warnThreshold: 3,
      autoPunish: 'MUTE',
      welcomeEnabled: true,
      welcomeChannelId: '888',
      welcomeMessage: 'Selamat datang {user}!',
      goodbyeEnabled: false,
      goodbyeChannelId: '',
      goodbyeMessage: '',
      levelingEnabled: true,
      levelUpChannelId: '777',
      levelMultiplier: 1.0,
      xpPerMessage: 15
    },
    channels: [
      { id: '999', name: 'mod-log' },
      { id: '888', name: 'welcome' },
      { id: '777', name: 'general' }
    ],
    roles: [
      { id: '111', name: 'Admin' },
      { id: '222', name: 'Member' }
    ],
    voiceChannels: [
      { id: '333', name: 'Music Lounge', membersCount: 2 }
    ],
    initialMusic: {
      playback: { isPlaying: false, paused: false, currentTrack: null, volume: 80, loop: 'OFF', channelId: null },
      queue: []
    },
    modLogs: [
      { id: '1', action: 'WARN', targetTag: 'User#1234', moderatorTag: 'Mod#0001', reason: 'Spamming', createdAt: new Date() }
    ]
  }
};

for (const [file, data] of Object.entries(mockData)) {
  const filePath = path.join('src/dashboard/views', file);
  const template = fs.readFileSync(filePath, 'utf8');
  try {
    const html = ejs.render(template, data, { filename: filePath });
    console.log(`✅ ${file} compiled successfully (${html.length} bytes rendered)`);
  } catch (err) {
    console.error(`❌ ${file} compilation error:`, err);
  }
}
