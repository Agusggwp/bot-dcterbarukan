import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionFlagsBits } from 'discord.js';
import { antiSpamService } from '../src/services/antiSpamService.js';
import { guildRepository } from '../src/repositories/guildRepository.js';
import { ModerationService } from '../src/services/moderationService.js';

describe('Anti-Spam Hack Trap (Honeypot Channel)', () => {
  const guildMock = {
    id: 'guild-trap-test',
    name: 'Test Server',
    ownerId: 'owner-999',
    channels: {
      fetch: vi.fn().mockResolvedValue({ isTextBased: () => true, send: vi.fn().mockResolvedValue(true) }),
    },
    members: {
      me: { id: 'bot-123', user: { tag: 'bot#0000' } },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ignore messages if trap feature is disabled', async () => {
    vi.spyOn(guildRepository, 'getGuildConfig').mockResolvedValue({
      antiSpamTrapEnabled: false,
      antiSpamTrapChannelId: 'channel-trap-1',
      antiSpamEnabled: false,
      filterLinksEnabled: false,
    });

    const mockMessage = {
      guild: guildMock,
      author: { id: 'user-normal', bot: false },
      channel: { id: 'channel-trap-1', name: 'trap-room' },
      content: 'free discord nitro hack click here',
      mentions: { users: new Map(), roles: new Map() },
      delete: vi.fn(),
      member: {
        permissions: { has: () => false },
      },
    };

    const isSpam = await antiSpamService.checkMessage(mockMessage);
    expect(isSpam).toBe(false);
    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  it('should immediately delete message and kick regular member if they post in honeypot channel', async () => {
    vi.spyOn(guildRepository, 'getGuildConfig').mockResolvedValue({
      antiSpamTrapEnabled: true,
      antiSpamTrapChannelId: 'channel-trap-1',
      antiSpamEnabled: false,
      filterLinksEnabled: false,
      modLogChannelId: 'modlog-1',
    });

    const kickSpy = vi.spyOn(ModerationService, 'kickMember').mockResolvedValue({ success: true, caseNumber: 1 });

    const mockMessage = {
      guild: guildMock,
      author: { id: 'hacked-user-1', tag: 'victim#1234', bot: false, send: vi.fn().mockResolvedValue(true) },
      channel: { id: 'channel-trap-1', name: 'trap-room' },
      content: 'http://steam-community-free-gifts.xyz',
      mentions: { users: new Map(), roles: new Map() },
      delete: vi.fn().mockResolvedValue(true),
      member: {
        id: 'hacked-user-1',
        permissions: { has: (perm) => perm !== PermissionFlagsBits.Administrator },
      },
    };

    const isSpam = await antiSpamService.checkMessage(mockMessage);

    expect(isSpam).toBe(true);
    expect(mockMessage.delete).toHaveBeenCalled();
    expect(mockMessage.author.send).toHaveBeenCalled();
    expect(kickSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        guild: guildMock,
        targetMember: mockMessage.member,
      })
    );
  });

  it('should NOT kick administrators or server owner in honeypot channel', async () => {
    vi.spyOn(guildRepository, 'getGuildConfig').mockResolvedValue({
      antiSpamTrapEnabled: true,
      antiSpamTrapChannelId: 'channel-trap-1',
      antiSpamEnabled: false,
      filterLinksEnabled: false,
    });

    const kickSpy = vi.spyOn(ModerationService, 'kickMember');

    const adminMessage = {
      guild: guildMock,
      author: { id: 'admin-1', tag: 'admin#0001', bot: false },
      channel: { id: 'channel-trap-1', name: 'trap-room' },
      content: 'Testing trap channel config',
      mentions: { users: new Map(), roles: new Map() },
      delete: vi.fn(),
      member: {
        permissions: { has: (perm) => perm === PermissionFlagsBits.Administrator },
      },
    };

    const isSpam = await antiSpamService.checkMessage(adminMessage);

    expect(isSpam).toBe(false);
    expect(adminMessage.delete).not.toHaveBeenCalled();
    expect(kickSpy).not.toHaveBeenCalled();
  });
});
