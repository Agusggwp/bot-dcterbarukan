import { prisma } from '../database/client.js';

class TicketRepository {
  async countUserOpenTickets(guildId, creatorId) {
    return await prisma.ticket.count({
      where: {
        guildId,
        creatorId,
        status: { in: ['OPEN', 'REOPENED'] },
      },
    });
  }

  async createTicket({ guildId, channelId, creatorId, category, subject }) {
    return await prisma.$transaction(async (tx) => {
      const lastTicket = await tx.ticket.findFirst({
        where: { guildId },
        orderBy: { ticketNumber: 'desc' },
        select: { ticketNumber: true },
      });

      const nextNumber = (lastTicket?.ticketNumber || 0) + 1;

      return await tx.ticket.create({
        data: {
          guildId,
          channelId,
          ticketNumber: nextNumber,
          creatorId,
          category: category || 'General Support',
          subject,
          status: 'OPEN',
          participants: {
            create: {
              userId: creatorId,
              role: 'CREATOR',
            },
          },
        },
        include: {
          participants: true,
        },
      });
    });
  }

  async getTicketByChannelId(channelId) {
    return await prisma.ticket.findUnique({
      where: { channelId },
      include: {
        participants: true,
        transcript: true,
      },
    });
  }

  async claimTicket(ticketId, staffUserId) {
    return await prisma.ticket.update({
      where: { id: ticketId },
      data: { claimedById: staffUserId },
    });
  }

  async closeTicket(ticketId, closeReason = null) {
    return await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        closeReason,
        closedAt: new Date(),
      },
    });
  }

  async reopenTicket(ticketId) {
    return await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'REOPENED',
        closedAt: null,
        closeReason: null,
      },
    });
  }

  async addParticipant(ticketId, userId, role = 'PARTICIPANT') {
    return await prisma.ticketParticipant.upsert({
      where: {
        ticketId_userId: { ticketId, userId },
      },
      create: { ticketId, userId, role },
      update: { role },
    });
  }

  async removeParticipant(ticketId, userId) {
    return await prisma.ticketParticipant.deleteMany({
      where: { ticketId, userId },
    });
  }

  async saveTranscript(ticketId, content, format = 'TXT') {
    return await prisma.ticketTranscript.upsert({
      where: { ticketId },
      create: { ticketId, content, format },
      update: { content, format },
    });
  }
}

export const ticketRepository = new TicketRepository();
