// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { KEYS, deleteAllData, exportData, loadCheckIns, loadSettings, migrate, saveCheckIns } from '../../src/lib/storage';
import { buildLibraryIntervention } from '../../shared/library';

const legacyHistory = [
  { id: 'a1', mood: 'anxious', action: 'Take 3 deep breaths.', timestamp: '2026-10-01T09:00:00.000Z' },
  { id: 'a2', mood: 'feeling scattered', action: 'Write a list', timestamp: '2026-10-02T09:00:00.000Z' },
];

describe('storage migration from V1.1', () => {
  beforeEach(() => localStorage.clear());

  it('converts legacy history into check-ins without deleting the original', () => {
    localStorage.setItem('moodlens_history', JSON.stringify(legacyHistory));
    localStorage.setItem('moodlens_streak', '4');

    const result = migrate();

    expect(result.migrated).toBe(2);
    const checkIns = loadCheckIns();
    expect(checkIns.map((c) => [c.id, c.mood, c.legacyAction, c.completedAt])).toEqual([
      ['a1', 'anxious', 'Take 3 deep breaths.', '2026-10-01T09:00:00.000Z'],
      ['a2', 'feeling scattered', 'Write a list', '2026-10-02T09:00:00.000Z'],
    ]);
    expect(localStorage.getItem('moodlens_history')).not.toBeNull();
    expect(localStorage.getItem(KEYS.version)).toBe('2');
  });

  it('is idempotent', () => {
    localStorage.setItem('moodlens_history', JSON.stringify(legacyHistory));
    migrate();
    migrate();
    expect(loadCheckIns()).toHaveLength(2);
  });

  it('deletes fake-auth data containing plaintext passwords', () => {
    localStorage.setItem('moodlens_users', JSON.stringify({ alice: 'hunter2' }));
    localStorage.setItem('moodlens_current_user', 'alice');
    expect(migrate().removedInsecure).toBe(true);
    expect(localStorage.getItem('moodlens_users')).toBeNull();
    expect(localStorage.getItem('moodlens_current_user')).toBeNull();
  });

  it('survives corrupted legacy data', () => {
    localStorage.setItem('moodlens_history', '{not json');
    expect(() => migrate()).not.toThrow();
    expect(loadCheckIns()).toEqual([]);
  });
});

describe('storage reads', () => {
  beforeEach(() => localStorage.clear());

  it('drops invalid check-ins instead of crashing', () => {
    localStorage.setItem(KEYS.checkins, JSON.stringify([{ nope: true }, { id: 'x', createdAt: '2026-11-01T00:00:00Z', mood: 'sad' }]));
    expect(loadCheckIns().map((c) => c.id)).toEqual(['x']);
  });

  it('returns default settings for missing or invalid values', () => {
    expect(loadSettings()).toEqual({ country: 'GB', aiEnabled: true });
    localStorage.setItem(KEYS.settings, '"garbage"');
    expect(loadSettings()).toEqual({ country: 'GB', aiEnabled: true });
  });

  it('round-trips a full check-in', () => {
    const checkIn = {
      id: 'c1',
      createdAt: '2026-11-03T10:00:00.000Z',
      mood: 'overwhelmed',
      energy: 2,
      contributors: ['work' as const],
      intervention: buildLibraryIntervention({ mood: 'overwhelmed' }),
      actionChoice: 'alternative' as const,
      feedback: 'helpful' as const,
    };
    saveCheckIns([checkIn]);
    expect(loadCheckIns()).toEqual([checkIn]);
  });
});

describe('export and delete', () => {
  beforeEach(() => localStorage.clear());

  it('exports settings and check-ins', () => {
    saveCheckIns([{ id: 'c1', createdAt: '2026-11-03T10:00:00.000Z', mood: 'sad' }]);
    const data = exportData();
    expect(data.checkIns).toHaveLength(1);
    expect(data.settings.country).toBe('GB');
  });

  it('removes every MoodLens key, including legacy ones, and nothing else', () => {
    localStorage.setItem('moodlens_history', '[]');
    localStorage.setItem('moodlens_streak', '3');
    localStorage.setItem(KEYS.checkins, '[]');
    localStorage.setItem('unrelated_app_key', 'keep');
    deleteAllData();
    expect(Object.keys(localStorage)).toEqual(['unrelated_app_key']);
  });
});
