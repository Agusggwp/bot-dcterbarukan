import { describe, it, expect } from 'vitest';
import { giveawayRepository } from '../src/repositories/giveawayRepository.js';
import { JobManager } from '../src/schedulers/jobManager.js';

describe('Concurrency, Randomness Fairness, and Idempotency', () => {
  it('guarantees unique winners in giveaway selection (no duplicates)', () => {
    const participants = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'];
    const winners = giveawayRepository.pickRandomWinners(participants, 3);

    expect(winners.length).toBe(3);
    const uniqueSet = new Set(winners);
    expect(uniqueSet.size).toBe(3); // Every winner is unique
  });

  it('handles giveaway when participants are fewer than winner count', () => {
    const participants = ['user-1', 'user-2'];
    const winners = giveawayRepository.pickRandomWinners(participants, 5);

    expect(winners.length).toBe(2);
    expect(winners).toContain('user-1');
    expect(winners).toContain('user-2');
  });

  it('handles giveaway with zero participants safely', () => {
    const winners = giveawayRepository.pickRandomWinners([], 3);
    expect(winners).toEqual([]);
  });

  it('prevents overlapping scheduler tick runs (lock guard)', async () => {
    const fakeClient = {};
    const scheduler = new JobManager(fakeClient);

    // Simulate an ongoing job run
    scheduler.isRunning = true;
    scheduler.isProcessing = true;

    // A tick called while processing must skip without throwing or executing dual runs
    let executed = false;
    scheduler.processDueGiveaways = async () => {
      executed = true;
    };

    await scheduler.tick();
    expect(executed).toBe(false); // Guard held!

    // Unlock
    scheduler.isProcessing = false;
    await scheduler.tick();
    expect(executed).toBe(true); // Now executes
  });
});
