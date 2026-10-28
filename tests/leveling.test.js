import { describe, it, expect } from 'vitest';
import { calculateLevel, xpForLevel } from '../src/repositories/levelRepository.js';

describe('Leveling Progression & Math Formula', () => {
  it('correctly computes levels based on XP formula', () => {
    expect(calculateLevel(0)).toBe(0);
    expect(calculateLevel(50)).toBe(0);
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(399)).toBe(1);
    expect(calculateLevel(400)).toBe(2);
    expect(calculateLevel(900)).toBe(3);
    expect(calculateLevel(2500)).toBe(5);
    expect(calculateLevel(10000)).toBe(10);
  });

  it('correctly calculates XP threshold for target levels', () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(400);
    expect(xpForLevel(5)).toBe(2500);
    expect(xpForLevel(10)).toBe(10000);
  });
});
