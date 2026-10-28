import { describe, it, expect } from 'vitest';
import { validateHierarchy } from '../src/utils/permissionGuard.js';

describe('Discord Permission and Hierarchy Guard', () => {
  const guildMock = { ownerId: 'owner-123' };

  it('should reject moderation targeting the server owner', () => {
    const result = validateHierarchy({
      moderatorMember: { id: 'mod-1', guild: guildMock, roles: { highest: { position: 10 } } },
      targetMember: { id: 'owner-123', guild: guildMock, roles: { highest: { position: 100 } } },
      botMember: { id: 'bot-1', roles: { highest: { position: 50 } } },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Pemilik Server');
  });

  it('should reject moderation when user targets themselves', () => {
    const result = validateHierarchy({
      moderatorMember: { id: 'user-1', guild: guildMock, roles: { highest: { position: 10 } } },
      targetMember: { id: 'user-1', guild: guildMock, roles: { highest: { position: 10 } } },
      botMember: { id: 'bot-1', roles: { highest: { position: 50 } } },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('diri Anda sendiri');
  });

  it('should reject moderation when target role is equal or higher than moderator role', () => {
    const result = validateHierarchy({
      moderatorMember: { id: 'mod-1', guild: guildMock, roles: { highest: { position: 10 } } },
      targetMember: { id: 'target-1', guild: guildMock, roles: { highest: { position: 10 } } }, // equal
      botMember: { id: 'bot-1', roles: { highest: { position: 50 } } },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Hirarki Peran');
  });

  it('should reject moderation when target role is higher than bot role', () => {
    const result = validateHierarchy({
      moderatorMember: { id: 'owner-123', guild: guildMock, roles: { highest: { position: 100 } } },
      targetMember: { id: 'admin-1', guild: guildMock, roles: { highest: { position: 60 } } },
      botMember: { id: 'bot-1', roles: { highest: { position: 40 } } }, // Bot is lower
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Peran tertinggi Bot');
  });

  it('should allow valid moderation when hierarchy rules are satisfied', () => {
    const result = validateHierarchy({
      moderatorMember: { id: 'mod-1', guild: guildMock, roles: { highest: { position: 30 } } },
      targetMember: { id: 'user-1', guild: guildMock, roles: { highest: { position: 5 } } },
      botMember: { id: 'bot-1', roles: { highest: { position: 50 } } },
    });

    expect(result.valid).toBe(true);
  });
});
