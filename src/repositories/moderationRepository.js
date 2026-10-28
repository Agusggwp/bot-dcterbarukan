import { prisma } from '../database/client.js';
import { broadcastModCase } from '../utils/dashboardEvents.js';

class ModerationRepository {
  async createCase({ guildId, targetId, targetTag, moderatorId, moderatorTag, action, reason, duration, metadata }) {
    const modCase = await prisma.$transaction(async (tx) => {
      // Find highest case number for this guild
      const lastCase = await tx.moderationCase.findFirst({
        where: { guildId },
        orderBy: { caseNumber: 'desc' },
        select: { caseNumber: true },
      });

      const nextCaseNumber = (lastCase?.caseNumber || 0) + 1;

      return await tx.moderationCase.create({
        data: {
          guildId,
          caseNumber: nextCaseNumber,
          targetId,
          targetTag,
          moderatorId,
          moderatorTag,
          action,
          reason: reason || 'Tidak ada alasan yang diberikan.',
          duration,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    });

    try {
      broadcastModCase(guildId, modCase);
    } catch {}

    return modCase;
  }

  async getCase(guildId, caseNumber) {
    return await prisma.moderationCase.findUnique({
      where: {
        guildId_caseNumber: {
          guildId,
          caseNumber,
        },
      },
    });
  }

  async getUserCases(guildId, targetId = null, limit = 10) {
    const where = { guildId };
    if (targetId) {
      where.targetId = targetId;
    }
    return await prisma.moderationCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async addWarning({ guildId, userId, moderatorId, reason }) {
    return await prisma.userWarning.create({
      data: {
        guildId,
        userId,
        moderatorId,
        reason,
      },
    });
  }

  async getUserWarnings(guildId, userId) {
    return await prisma.userWarning.findMany({
      where: { guildId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async clearUserWarnings(guildId, userId) {
    return await prisma.userWarning.deleteMany({
      where: { guildId, userId },
    });
  }
}

export const moderationRepository = new ModerationRepository();
