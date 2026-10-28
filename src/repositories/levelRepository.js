import { prisma } from '../database/client.js';

export function calculateLevel(xp) {
  if (xp <= 0) return 0;
  // Level curve: Level = floor(0.1 * sqrt(xp)) => xp = (Level * 10)^2 = 100 * Level^2
  // For Level 1: 100 XP. Level 2: 400 XP. Level 3: 900 XP. Level 5: 2500 XP. Level 10: 10,000 XP.
  return Math.floor(0.1 * Math.sqrt(xp));
}

export function xpForLevel(level) {
  return Math.pow(level * 10, 2);
}

class LevelRepository {
  async addXp(guildId, userId, amount, cooldownSeconds = 60) {
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      let current = await tx.level.findUnique({
        where: {
          guildId_userId: { guildId, userId },
        },
      });

      if (!current) {
        const newLevel = calculateLevel(amount);
        current = await tx.level.create({
          data: {
            guildId,
            userId,
            xp: amount,
            level: newLevel,
            lastXpAt: now,
          },
        });
        return { updated: true, leveledUp: newLevel > 0, oldLevel: 0, newLevel, currentXp: amount };
      }

      // Check cooldown
      const diffSeconds = (now.getTime() - new Date(current.lastXpAt).getTime()) / 1000;
      if (diffSeconds < cooldownSeconds) {
        return { updated: false, reason: 'COOLDOWN' };
      }

      const newXp = current.xp + amount;
      const newLevel = calculateLevel(newXp);
      const leveledUp = newLevel > current.level;

      const updated = await tx.level.update({
        where: { id: current.id },
        data: {
          xp: newXp,
          level: newLevel,
          lastXpAt: now,
        },
      });

      return {
        updated: true,
        leveledUp,
        oldLevel: current.level,
        newLevel: updated.level,
        currentXp: updated.xp,
      };
    });
  }

  async getUserRank(guildId, userId) {
    const userLevel = await prisma.level.findUnique({
      where: { guildId_userId: { guildId, userId } },
    });

    if (!userLevel) {
      return {
        rank: null,
        level: 0,
        xp: 0,
        nextLevelXp: xpForLevel(1),
      };
    }

    const higherUsers = await prisma.level.count({
      where: {
        guildId,
        xp: { gt: userLevel.xp },
      },
    });

    return {
      rank: higherUsers + 1,
      level: userLevel.level,
      xp: userLevel.xp,
      nextLevelXp: xpForLevel(userLevel.level + 1),
    };
  }

  async getLeaderboard(guildId, take = 10, skip = 0) {
    const users = await prisma.level.findMany({
      where: { guildId },
      orderBy: { xp: 'desc' },
      take,
      skip,
    });

    const totalCount = await prisma.level.count({ where: { guildId } });

    return { users, totalCount };
  }

  async resetUser(guildId, userId) {
    return await prisma.level.deleteMany({
      where: { guildId, userId },
    });
  }

  async resetGuild(guildId) {
    return await prisma.level.deleteMany({
      where: { guildId },
    });
  }
}

export const levelRepository = new LevelRepository();
