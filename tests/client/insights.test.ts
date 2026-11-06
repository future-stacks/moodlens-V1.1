import { describe, expect, it } from 'vitest';
import { averageEnergy, helpfulActions, topMoods, weeklyCount } from '../../src/lib/insights';
import type { CheckIn } from '../../src/lib/storage';
import { buildLibraryIntervention } from '../../shared/library';

// Thursday 5 November 2026, local time (the week starts on Monday 2 November)
const now = new Date(2026, 10, 5, 12, 0, 0);
const at = (y: number, m: number, d: number, h = 9) => new Date(y, m, d, h).toISOString();
const ci = (id: string, createdAt: string, extra: Partial<CheckIn> = {}): CheckIn => ({ id, createdAt, mood: 'sad', ...extra });

describe('weeklyCount', () => {
  it('counts check-ins since Monday of the current week', () => {
    const checkIns = [
      ci('sun', at(2026, 10, 1, 23)), // Sunday of the previous week
      ci('mon', at(2026, 10, 2, 0)), // Monday
      ci('thu1', at(2026, 10, 5, 8)),
      ci('thu2', at(2026, 10, 5, 9)),
    ];
    expect(weeklyCount(checkIns, now)).toBe(3);
  });

  it('does not reset or penalise anything: an empty week is simply zero', () => {
    expect(weeklyCount([ci('old', at(2026, 9, 1))], now)).toBe(0);
  });
});

describe('topMoods', () => {
  it('ranks moods selected in the last 30 days, merging ids and labels', () => {
    const checkIns = [
      ci('1', at(2026, 10, 1), { mood: 'anxious' }),
      ci('2', at(2026, 10, 2), { mood: 'Anxious' }),
      ci('3', at(2026, 10, 3), { mood: 'tired' }),
      ci('4', at(2026, 8, 1), { mood: 'tired' }), // too old
    ];
    expect(topMoods(checkIns, now)).toEqual([
      { label: 'Anxious', count: 2 },
      { label: 'Tired', count: 1 },
    ]);
  });
});

describe('helpfulActions', () => {
  it('lists actions the user reported as helpful, using the action they chose', () => {
    const intervention = buildLibraryIntervention({ mood: 'overwhelmed' });
    const checkIns = [
      ci('1', at(2026, 10, 1), { mood: 'overwhelmed', intervention, actionChoice: 'alternative', feedback: 'helpful' }),
      ci('2', at(2026, 10, 2), { mood: 'sad', legacyAction: 'Take a walk', feedback: 'not_helpful' }),
    ];
    expect(helpfulActions(checkIns)).toEqual([
      { title: intervention.alternative_action.title, mood: 'Overwhelmed', feedback: 'helpful' },
    ]);
  });
});

describe('averageEnergy', () => {
  it('averages only check-ins where energy was given', () => {
    expect(averageEnergy([ci('1', now.toISOString(), { energy: 2 }), ci('2', now.toISOString(), { energy: 3 }), ci('3', now.toISOString())])).toBe(2.5);
    expect(averageEnergy([ci('1', now.toISOString())])).toBeUndefined();
  });
});
