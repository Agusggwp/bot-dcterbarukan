import { describe, it, expect, vi } from 'vitest';
import { musicService } from '../src/services/musicService.js';

describe('MusicService Unit Tests', () => {
  it('getStatus returns clean default structure when no active music session', () => {
    const status = musicService.getStatus('non-existent-guild');
    expect(status).toBeDefined();
    expect(status.playing).toBe(false);
    expect(status.currentSong).toBeNull();
    expect(status.queue).toEqual([]);
    expect(status.volume).toBe(80);
    expect(status.loopMode).toBe('off');
  });

  it('searchTrack parses query correctly', async () => {
    // Search a known popular query
    const track = await musicService.searchTrack('lofi hip hop');
    expect(track).toBeDefined();
    expect(track.title).toBeTruthy();
    expect(track.url).toContain('youtube.com');
  });
});
