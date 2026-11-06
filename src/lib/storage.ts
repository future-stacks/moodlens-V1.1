import { z } from 'zod';
import { InterventionSchema } from '../../shared/intervention';
import { CONTRIBUTORS, NEEDS } from '../../shared/moods';

/**
 * Local-first persistence. Everything MoodLens remembers lives in this
 * browser's localStorage, under the keys below. Reads are validated, so a
 * corrupted or hand-edited value never crashes the app.
 *
 * Schema history
 *  v1 (MoodLens V1.1): moodlens_history [{id, mood, action, timestamp}],
 *     moodlens_streak, moodlens_last_completed, moodlens_users (plaintext
 *     passwords!), moodlens_current_user, moodlens_reminder_time
 *  v2: moodlens_checkins_v2, moodlens_settings
 */
export const KEYS = {
  checkins: 'moodlens_checkins_v2',
  settings: 'moodlens_settings',
  version: 'moodlens_storage_version',
  onboarding: 'moodlens_onboarding_seen',
  legacyHistory: 'moodlens_history',
} as const;

/** V1.1 keys that held fake-auth data. Removed on load, as a security fix. */
const INSECURE_LEGACY_KEYS = ['moodlens_users', 'moodlens_current_user'];

export const STORAGE_VERSION = 2;

const contributorIds = CONTRIBUTORS.map((c) => c.id) as [string, ...string[]];
const needIds = NEEDS.map((n) => n.id) as [string, ...string[]];

export const FeedbackSchema = z.enum(['helpful', 'somewhat', 'not_helpful']);
export const FeltAfterSchema = z.enum(['better', 'same', 'worse']);

export const CheckInSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  /** A known mood id or the user's own words. */
  mood: z.string(),
  energy: z.number().int().min(1).max(5).optional(),
  mentalLoad: z.number().int().min(1).max(5).optional(),
  contributors: z.array(z.enum(contributorIds)).optional(),
  need: z.enum(needIds).optional(),
  note: z.string().optional(),
  intervention: InterventionSchema.optional(),
  /** Which action the user chose: the suggestion or the smaller alternative. */
  actionChoice: z.enum(['main', 'alternative']).optional(),
  completedAt: z.string().optional(),
  feedback: FeedbackSchema.optional(),
  feltAfter: FeltAfterSchema.optional(),
  /** Titles of suggestions the user marked "This isn't helpful" during this check-in. */
  notHelpful: z.array(z.string()).optional(),
  /** Set for entries migrated from V1.1, which only stored the action text. */
  legacyAction: z.string().optional(),
});
export type CheckIn = z.infer<typeof CheckInSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type FeltAfter = z.infer<typeof FeltAfterSchema>;

export const SettingsSchema = z.object({
  /** Country for support resources. Chosen manually, never inferred. */
  country: z.string().default('GB'),
  /** When off, nothing is sent to the AI provider; the built-in library is used. */
  aiEnabled: z.boolean().default(true),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // e.g. blocked by browser privacy settings
  }
}

function readJson(key: string): unknown {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    storage()?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota exceeded or storage unavailable
  }
}

export function loadCheckIns(): CheckIn[] {
  const raw = readJson(KEYS.checkins);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = CheckInSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function saveCheckIns(checkIns: CheckIn[]): boolean {
  return writeJson(KEYS.checkins, checkIns);
}

export function loadSettings(): Settings {
  const parsed = SettingsSchema.safeParse(readJson(KEYS.settings) ?? {});
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): boolean {
  return writeJson(KEYS.settings, settings);
}

const LegacyItemSchema = z.object({
  id: z.string().optional(),
  mood: z.string(),
  action: z.string(),
  timestamp: z.string(),
});

/**
 * Bring stored data up to the current schema. Safe to run on every load.
 *
 * - V1.1 history is copied into check-ins; the original key is left in place
 *   so nothing is lost if this version is rolled back.
 * - Fake-auth keys holding plaintext passwords are deleted.
 */
export function migrate(): { migrated: number; removedInsecure: boolean } {
  const store = storage();
  if (!store) return { migrated: 0, removedInsecure: false };

  let removedInsecure = false;
  for (const key of INSECURE_LEGACY_KEYS) {
    if (store.getItem(key) !== null) {
      store.removeItem(key);
      removedInsecure = true;
    }
  }

  let migrated = 0;
  const version = Number(store.getItem(KEYS.version) ?? 1);
  if (version < 2) {
    const legacy = readJson(KEYS.legacyHistory);
    if (Array.isArray(legacy)) {
      const existing = loadCheckIns();
      const known = new Set(existing.map((c) => c.id));
      const converted: CheckIn[] = legacy.flatMap((item, i) => {
        const parsed = LegacyItemSchema.safeParse(item);
        if (!parsed.success) return [];
        const id = parsed.data.id ?? `legacy-${i}-${parsed.data.timestamp}`;
        if (known.has(id)) return [];
        return [{
          id,
          createdAt: parsed.data.timestamp,
          mood: parsed.data.mood,
          completedAt: parsed.data.timestamp,
          legacyAction: parsed.data.action,
        }];
      });
      migrated = converted.length;
      if (migrated > 0 && !saveCheckIns([...converted, ...existing])) {
        return { migrated: 0, removedInsecure }; // don't bump the version if the write failed
      }
    }
    store.setItem(KEYS.version, String(STORAGE_VERSION));
  }
  return { migrated, removedInsecure };
}

/** Everything MoodLens stores about the user, for "Download my data". */
export function exportData() {
  return {
    exportedAt: new Date().toISOString(),
    app: 'MoodLens',
    storageVersion: STORAGE_VERSION,
    settings: loadSettings(),
    checkIns: loadCheckIns(),
  };
}

/** Remove every MoodLens key from this browser, including legacy V1.1 keys. */
export function deleteAllData(): void {
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key?.startsWith('moodlens_')) keys.push(key);
  }
  keys.forEach((k) => store.removeItem(k));
}
