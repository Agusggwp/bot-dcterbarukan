import { describe, it, expect } from 'vitest';
import { parseDurationToSeconds, formatSecondsToHuman } from '../src/utils/timeParser.js';

describe('Time and Duration Utilities', () => {
  it('correctly parses duration strings to seconds', () => {
    expect(parseDurationToSeconds('30s')).toBe(30);
    expect(parseDurationToSeconds('10m')).toBe(600);
    expect(parseDurationToSeconds('2h')).toBe(7200);
    expect(parseDurationToSeconds('1d')).toBe(86400);
    expect(parseDurationToSeconds('1w')).toBe(604800);
  });

  it('returns null for invalid inputs', () => {
    expect(parseDurationToSeconds('invalid')).toBeNull();
    expect(parseDurationToSeconds('-10m')).toBeNull();
    expect(parseDurationToSeconds('')).toBeNull();
    expect(parseDurationToSeconds(null)).toBeNull();
    expect(parseDurationToSeconds('10x')).toBeNull();
  });

  it('formats seconds into human readable text in Indonesian', () => {
    expect(formatSecondsToHuman(45)).toBe('45 detik');
    expect(formatSecondsToHuman(120)).toBe('2 menit');
    expect(formatSecondsToHuman(3665)).toBe('1 jam 1 menit 5 detik');
    expect(formatSecondsToHuman(90000)).toBe('1 hari 1 jam');
    expect(formatSecondsToHuman(0)).toBe('0 detik');
  });
});
