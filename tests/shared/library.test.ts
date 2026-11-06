import { describe, expect, it } from 'vitest';
import { InterventionSchema, snapDuration } from '../../shared/intervention';
import { GENERIC_ENTRY, LIBRARY, LIBRARY_COVERAGE, buildLibraryIntervention, resolveMoodId } from '../../shared/library';
import { MOODS } from '../../shared/moods';

describe('built-in library', () => {
  it('has an entry for every mood in the taxonomy', () => {
    expect(LIBRARY_COVERAGE).toBe(true);
  });

  it('produces a complete, valid intervention for every mood and variant', () => {
    for (const mood of [...MOODS.map((m) => m.id), 'something nobody typed before']) {
      for (let variant = 0; variant < 4; variant++) {
        const result = InterventionSchema.safeParse(buildLibraryIntervention({ mood }, variant));
        expect(result.success, `${mood} v${variant}`).toBe(true);
      }
    }
  });

  it('only contains curated quotes with an author and source', () => {
    const quotes = [...Object.values(LIBRARY), GENERIC_ENTRY].flatMap((e) => e.thoughts);
    for (const q of quotes) {
      if (q.type === 'curated_quote') {
        expect(q.author).toBeTruthy();
        expect(q.source).toBeTruthy();
      } else {
        expect(q.author).toBeNull();
        expect(q.source).toBeNull();
      }
    }
  });

  it('always offers a smaller alternative that is no longer than the action', () => {
    for (const entry of Object.values(LIBRARY)) {
      for (const { action, alternative } of entry.actions) {
        expect(alternative.duration_minutes).toBeLessThanOrEqual(action.duration_minutes);
      }
    }
  });

  it('suggests a different action when earlier ones are excluded', () => {
    const first = buildLibraryIntervention({ mood: 'overwhelmed' });
    const second = buildLibraryIntervention({ mood: 'overwhelmed', exclude: [first.action.title] });
    expect(second.action.title).not.toBe(first.action.title);
  });

  it('maps typed moods to known states without matching inside words', () => {
    expect(resolveMoodId('Overwhelmed')).toBe('overwhelmed');
    expect(resolveMoodId('a bit burnt out')).toBe('tired');
    expect(resolveMoodId('worried about work')).toBe('anxious');
    expect(resolveMoodId('feeling low')).toBe('sad');
    expect(resolveMoodId('unmotivated')).toBe('unmotivated');
    expect(resolveMoodId('slow morning')).toBeUndefined();
    expect(resolveMoodId('made progress')).toBeUndefined();
  });
});

describe('snapDuration', () => {
  it('snaps to 2, 5 or 10 minutes', () => {
    expect(snapDuration(1)).toBe(2);
    expect(snapDuration(3)).toBe(2);
    expect(snapDuration(4)).toBe(5);
    expect(snapDuration(8)).toBe(10);
    expect(snapDuration(45)).toBe(10);
  });
});
