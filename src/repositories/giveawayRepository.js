import { prisma } from '../database/client.js';

class GiveawayRepository {
  async createGiveaway({ guildId, channelId, messageId, prize, winnerCount, requiredRoleId, hostedById, endsAt }) {
    return await prisma.giveaway.create({
      data: {
        guildId,
        channelId,
        messageId,
        prize,
        winnerCount,
        requiredRoleId,
        hostedById,
        endsAt,
        ended: false,
      },
    });
  }

  async getGiveawayByMessageId(messageId) {
    return await prisma.giveaway.findUnique({
      where: { messageId },
      include: {
        entries: true,
      },
    });
  }

  async addEntry(giveawayId, userId) {
    try {
      await prisma.giveawayEntry.create({
        data: {
          giveawayId,
          userId,
        },
      });
      return { success: true };
    } catch (err) {
      // Prisma P2002 is Unique constraint violation (already joined)
      if (err.code === 'P2002') {
        return { success: false, reason: 'ALREADY_ENTERED' };
      }
      throw err;
    }
  }

  async getDueGiveaways() {
    return await prisma.giveaway.findMany({
      where: {
        ended: false,
        endsAt: { lte: new Date() },
      },
      include: {
        entries: true,
      },
    });
  }

  async endGiveaway(giveawayId) {
    return await prisma.$transaction(async (tx) => {
      const giveaway = await tx.giveaway.findUnique({
        where: { id: giveawayId },
        include: { entries: true },
      });

      if (!giveaway || giveaway.ended) {
        return null;
      }

      const eligibleUserIds = giveaway.entries.map((e) => e.userId);
      const winners = this.pickRandomWinners(eligibleUserIds, giveaway.winnerCount);

      const updated = await tx.giveaway.update({
        where: { id: giveawayId },
        data: {
          ended: true,
          winners: JSON.stringify(winners),
        },
        include: {
          entries: true,
        },
      });

      return { giveaway: updated, winners };
    });
  }

  async rerollGiveaway(giveawayId) {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
      include: { entries: true },
    });

    if (!giveaway) return null;

    const eligibleUserIds = giveaway.entries.map((e) => e.userId);
    const newWinners = this.pickRandomWinners(eligibleUserIds, giveaway.winnerCount);

    await prisma.giveaway.update({
      where: { id: giveawayId },
      data: {
        winners: JSON.stringify(newWinners),
      },
    });

    return { giveaway, winners: newWinners };
  }

  pickRandomWinners(userIds, count) {
    if (!userIds || userIds.length === 0) return [];
    if (userIds.length <= count) return [...userIds];

    // Fisher-Yates partial shuffle for fair unbiased winner selection
    const shuffled = [...userIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }
}

export const giveawayRepository = new GiveawayRepository();
