import { describe, it, expect, vi } from 'vitest';
import { dashboardEvents, broadcastMusicUpdate, broadcastModCase } from '../src/utils/dashboardEvents.js';

describe('Real-Time Dashboard Events Pub/Sub', () => {
  it('broadcastMusicUpdate triggers guild-specific and general listeners', () => {
    const guildId = '1234567890';
    const mockStatus = { playing: true, currentSong: { title: 'Test Song' } };

    const specificSpy = vi.fn();
    const generalSpy = vi.fn();

    dashboardEvents.once(`music:${guildId}`, specificSpy);
    dashboardEvents.once('musicUpdate', generalSpy);

    broadcastMusicUpdate(guildId, mockStatus);

    expect(specificSpy).toHaveBeenCalledWith(mockStatus);
    expect(generalSpy).toHaveBeenCalledWith({ guildId, status: mockStatus });
  });

  it('broadcastModCase triggers guild-specific and general listeners', () => {
    const guildId = '1234567890';
    const mockCase = { caseNumber: 1, action: 'WARN', targetTag: 'User#1234' };

    const specificSpy = vi.fn();
    const generalSpy = vi.fn();

    dashboardEvents.once(`modCase:${guildId}`, specificSpy);
    dashboardEvents.once('modCaseCreated', generalSpy);

    broadcastModCase(guildId, mockCase);

    expect(specificSpy).toHaveBeenCalledWith(mockCase);
    expect(generalSpy).toHaveBeenCalledWith({ guildId, modCase: mockCase });
  });
});
