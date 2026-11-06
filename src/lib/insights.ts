import { startOfWeek, subWeeks, subDays } from 'date-fns';
import type { CheckIn } from './storage';
import { moodLabel } from '../../shared/moods';

/**
 * Descriptive summaries of what the user has recorded. These are counts and
 * self-reports only. Nothing here infers causes or makes clinical claims.
 */

const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

export function checkInsInWeek(checkIns: CheckIn[], now = new Date(), weeksAgo = 0): CheckIn[] {
  const start = subWeeks(weekStart(now), weeksAgo);
  const end = subWeeks(weekStart(now), weeksAgo - 1);
  return checkIns.filter((c) => {
    const t = new Date(c.createdAt);
    return t >= start && t < end;
  });
}

export function weeklyCount(checkIns: CheckIn[], now = new Date()): number {
  return checkInsInWeek(checkIns, now).length;
}

export function topMoods(checkIns: CheckIn[], now = new Date(), days = 30, limit = 3) {
  const since = subDays(now, days);
  const counts = new Map<string, { label: string; count: number }>();
  for (const c of checkIns) {
    if (new Date(c.createdAt) < since) continue;
    const label = moodLabel(c.mood);
    const key = label.toLowerCase();
    counts.set(key, { label, count: (counts.get(key)?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** The title of the action the user actually took for a check-in, if any. */
export function actionTitle(c: CheckIn): string | undefined {
  if (c.intervention) {
    return c.actionChoice === 'alternative' ? c.intervention.alternative_action.title : c.intervention.action.title;
  }
  return c.legacyAction;
}

/** Actions the user said helped (fully or somewhat), most recent first, de-duplicated. */
export function helpfulActions(checkIns: CheckIn[], limit = 5) {
  const seen = new Set<string>();
  const out: Array<{ title: string; mood: string; feedback: 'helpful' | 'somewhat' }> = [];
  for (const c of [...checkIns].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (c.feedback !== 'helpful' && c.feedback !== 'somewhat') continue;
    const title = actionTitle(c);
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    out.push({ title, mood: moodLabel(c.mood), feedback: c.feedback });
    if (out.length >= limit) break;
  }
  return out;
}

export function averageEnergy(checkIns: CheckIn[]): number | undefined {
  const values = checkIns.map((c) => c.energy).filter((e): e is number => typeof e === 'number');
  if (values.length === 0) return undefined;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function feltAfterSummary(checkIns: CheckIn[]) {
  const summary = { better: 0, same: 0, worse: 0 };
  for (const c of checkIns) if (c.feltAfter) summary[c.feltAfter]++;
  return summary;
}
