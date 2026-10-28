import { prisma } from '../database/client.js';

class GuildRepository {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 60 * 1000; // 1 minute in-memory cache
  }

  async getGuildConfig(guildId) {
    const cached = this.cache.get(guildId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    let config = await prisma.guildConfig.findUnique({
      where: { guildId },
      include: {
        welcomeConfig: true,
        levelConfig: true,
      },
    });

    if (!config) {
      config = await prisma.guildConfig.create({
        data: {
          guildId,
          welcomeConfig: {
            create: {},
          },
          levelConfig: {
            create: {},
          },
        },
        include: {
          welcomeConfig: true,
          levelConfig: true,
        },
      });
    }

    this.cache.set(guildId, { data: config, timestamp: Date.now() });
    return config;
  }

  async updateGuildConfig(guildId, data) {
    const updated = await prisma.guildConfig.update({
      where: { guildId },
      data,
      include: {
        welcomeConfig: true,
        levelConfig: true,
      },
    });
    this.cache.set(guildId, { data: updated, timestamp: Date.now() });
    return updated;
  }

  async updateWelcomeConfig(guildId, data) {
    const updated = await prisma.welcomeConfig.upsert({
      where: { guildId },
      create: { guildId, ...data },
      update: data,
    });
    this.cache.delete(guildId);
    return updated;
  }

  async updateLevelConfig(guildId, data) {
    const updated = await prisma.levelConfig.upsert({
      where: { guildId },
      create: { guildId, ...data },
      update: data,
    });
    this.cache.delete(guildId);
    return updated;
  }

  invalidate(guildId) {
    this.cache.delete(guildId);
  }
}

export const guildRepository = new GuildRepository();
