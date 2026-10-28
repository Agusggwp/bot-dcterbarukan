import { prisma } from '../database/client.js';

class EconomyRepository {
  async getOrCreateAccount(guildId, userId) {
    let account = await prisma.economyAccount.findUnique({
      where: { guildId_userId: { guildId, userId } },
    });

    if (!account) {
      account = await prisma.economyAccount.create({
        data: {
          guildId,
          userId,
          wallet: 0n,
          bank: 0n,
          inventory: '[]',
        },
      });
    }

    return account;
  }

  async claimDaily(guildId, userId, amount = 1000) {
    const now = new Date();
    const cooldownMs = 24 * 60 * 60 * 1000;

    return await prisma.$transaction(async (tx) => {
      let account = await tx.economyAccount.findUnique({
        where: { guildId_userId: { guildId, userId } },
      });

      if (!account) {
        account = await tx.economyAccount.create({
          data: { guildId, userId, wallet: 0n, bank: 0n, inventory: '[]' },
        });
      }

      if (account.lastDaily && now.getTime() - new Date(account.lastDaily).getTime() < cooldownMs) {
        const remainingMs = cooldownMs - (now.getTime() - new Date(account.lastDaily).getTime());
        return { success: false, reason: 'COOLDOWN', remainingMs };
      }

      const updated = await tx.economyAccount.update({
        where: { id: account.id },
        data: {
          wallet: account.wallet + BigInt(amount),
          lastDaily: now,
        },
      });

      await tx.economyTransaction.create({
        data: {
          guildId,
          receiverId: userId,
          amount: BigInt(amount),
          type: 'DAILY',
          description: 'Hadiah harian (Daily Reward)',
        },
      });

      return { success: true, newBalance: updated.wallet, amount };
    });
  }

  async claimWeekly(guildId, userId, amount = 7000) {
    const now = new Date();
    const cooldownMs = 7 * 24 * 60 * 60 * 1000;

    return await prisma.$transaction(async (tx) => {
      let account = await tx.economyAccount.findUnique({
        where: { guildId_userId: { guildId, userId } },
      });

      if (!account) {
        account = await tx.economyAccount.create({
          data: { guildId, userId, wallet: 0n, bank: 0n, inventory: '[]' },
        });
      }

      if (account.lastWeekly && now.getTime() - new Date(account.lastWeekly).getTime() < cooldownMs) {
        const remainingMs = cooldownMs - (now.getTime() - new Date(account.lastWeekly).getTime());
        return { success: false, reason: 'COOLDOWN', remainingMs };
      }

      const updated = await tx.economyAccount.update({
        where: { id: account.id },
        data: {
          wallet: account.wallet + BigInt(amount),
          lastWeekly: now,
        },
      });

      await tx.economyTransaction.create({
        data: {
          guildId,
          receiverId: userId,
          amount: BigInt(amount),
          type: 'WEEKLY',
          description: 'Hadiah mingguan (Weekly Reward)',
        },
      });

      return { success: true, newBalance: updated.wallet, amount };
    });
  }

  async work(guildId, userId, amount) {
    const now = new Date();
    const cooldownMs = 60 * 60 * 1000; // 1 hour cooldown

    return await prisma.$transaction(async (tx) => {
      let account = await tx.economyAccount.findUnique({
        where: { guildId_userId: { guildId, userId } },
      });

      if (!account) {
        account = await tx.economyAccount.create({
          data: { guildId, userId, wallet: 0n, bank: 0n, inventory: '[]' },
        });
      }

      if (account.lastWork && now.getTime() - new Date(account.lastWork).getTime() < cooldownMs) {
        const remainingMs = cooldownMs - (now.getTime() - new Date(account.lastWork).getTime());
        return { success: false, reason: 'COOLDOWN', remainingMs };
      }

      const updated = await tx.economyAccount.update({
        where: { id: account.id },
        data: {
          wallet: account.wallet + BigInt(amount),
          lastWork: now,
        },
      });

      await tx.economyTransaction.create({
        data: {
          guildId,
          receiverId: userId,
          amount: BigInt(amount),
          type: 'WORK',
          description: 'Gaji kerja (Work Reward)',
        },
      });

      return { success: true, newBalance: updated.wallet, amount };
    });
  }

  async transfer(guildId, senderId, receiverId, amount) {
    const transferAmount = BigInt(amount);
    if (transferAmount <= 0n) {
      return { success: false, reason: 'INVALID_AMOUNT' };
    }

    if (senderId === receiverId) {
      return { success: false, reason: 'SELF_TRANSFER' };
    }

    return await prisma.$transaction(async (tx) => {
      let sender = await tx.economyAccount.findUnique({
        where: { guildId_userId: { guildId, userId: senderId } },
      });

      if (!sender || sender.wallet < transferAmount) {
        return { success: false, reason: 'INSUFFICIENT_FUNDS' };
      }

      let receiver = await tx.economyAccount.findUnique({
        where: { guildId_userId: { guildId, userId: receiverId } },
      });

      if (!receiver) {
        receiver = await tx.economyAccount.create({
          data: { guildId, userId: receiverId, wallet: 0n, bank: 0n, inventory: '[]' },
        });
      }

      const updatedSender = await tx.economyAccount.update({
        where: { id: sender.id },
        data: { wallet: sender.wallet - transferAmount },
      });

      await tx.economyAccount.update({
        where: { id: receiver.id },
        data: { wallet: receiver.wallet + transferAmount },
      });

      await tx.economyTransaction.create({
        data: {
          guildId,
          senderId,
          receiverId,
          amount: transferAmount,
          type: 'TRANSFER',
          description: `Transfer dari <@${senderId}> ke <@${receiverId}>`,
        },
      });

      return { success: true, senderWallet: updatedSender.wallet };
    });
  }

  async buyItem(guildId, userId, item) {
    const price = BigInt(item.price);

    return await prisma.$transaction(async (tx) => {
      let account = await tx.economyAccount.findUnique({
        where: { guildId_userId: { guildId, userId } },
      });

      if (!account || account.wallet < price) {
        return { success: false, reason: 'INSUFFICIENT_FUNDS' };
      }

      let inventory = [];
      try {
        inventory = account.inventory ? JSON.parse(account.inventory) : [];
      } catch {
        inventory = [];
      }

      const existingIndex = inventory.findIndex((i) => i.id === item.id);
      if (existingIndex >= 0) {
        inventory[existingIndex].quantity = (inventory[existingIndex].quantity || 1) + 1;
      } else {
        inventory.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        });
      }

      const updated = await tx.economyAccount.update({
        where: { id: account.id },
        data: {
          wallet: account.wallet - price,
          inventory: JSON.stringify(inventory),
        },
      });

      await tx.economyTransaction.create({
        data: {
          guildId,
          senderId: userId,
          amount: price,
          type: 'BUY',
          description: `Membeli item: ${item.name}`,
        },
      });

      return { success: true, newBalance: updated.wallet, inventory };
    });
  }

  async getLeaderboard(guildId, take = 10) {
    return await prisma.economyAccount.findMany({
      where: { guildId },
      orderBy: { wallet: 'desc' },
      take,
    });
  }
}

export const economyRepository = new EconomyRepository();
