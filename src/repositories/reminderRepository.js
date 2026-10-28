import { prisma } from '../database/client.js';

class ReminderRepository {
  async createReminder({ userId, channelId, guildId, reminderText, dueAt }) {
    return await prisma.reminder.create({
      data: {
        userId,
        channelId,
        guildId,
        reminderText,
        dueAt,
        completed: false,
      },
    });
  }

  async getDueReminders() {
    return await prisma.reminder.findMany({
      where: {
        completed: false,
        dueAt: { lte: new Date() },
      },
    });
  }

  async markCompleted(id) {
    return await prisma.reminder.update({
      where: { id },
      data: { completed: true },
    });
  }

  async getUserReminders(userId) {
    return await prisma.reminder.findMany({
      where: { userId, completed: false },
      orderBy: { dueAt: 'asc' },
    });
  }
}

export const reminderRepository = new ReminderRepository();
