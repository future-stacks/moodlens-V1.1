/**
 * Mood taxonomy shared by the client and server.
 *
 * Every id used by MoodLens V1.1 (anxious, motivated, sad, grateful, stuck,
 * inspired, tired, angry, hopeful, lost) is kept so existing history entries
 * still resolve to a label. New states for the core audience are added.
 */
export type MoodTone =
  | "heavy" // sad, lonely: acknowledge first, gentle actions only
  | "activated" // anxious, stressed, overwhelmed, angry: settle and narrow focus
  | "low" // tired, stuck, unmotivated, lost: lower the cost of starting
  | "positive"; // calm, hopeful, grateful: savour and use the energy kindly

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  tone: MoodTone;
}

export const MOODS: Mood[] = [
  { id: "overwhelmed", label: "Overwhelmed", emoji: "🌊", tone: "activated" },
  { id: "anxious", label: "Anxious", emoji: "😰", tone: "activated" },
  { id: "stressed", label: "Stressed", emoji: "😣", tone: "activated" },
  { id: "sad", label: "Sad", emoji: "🌧", tone: "heavy" },
  { id: "lonely", label: "Lonely", emoji: "🫂", tone: "heavy" },
  { id: "stuck", label: "Stuck", emoji: "🪨", tone: "low" },
  { id: "unmotivated", label: "Unmotivated", emoji: "🫠", tone: "low" },
  { id: "tired", label: "Tired", emoji: "😴", tone: "low" },
  { id: "lost", label: "Lost", emoji: "🧭", tone: "low" },
  { id: "frustrated", label: "Frustrated", emoji: "😤", tone: "activated" },
  { id: "angry", label: "Angry", emoji: "⚡", tone: "activated" },
  { id: "calm", label: "Calm", emoji: "🌿", tone: "positive" },
  { id: "hopeful", label: "Hopeful", emoji: "🌅", tone: "positive" },
  { id: "motivated", label: "Motivated", emoji: "🔥", tone: "positive" },
  { id: "inspired", label: "Inspired", emoji: "✨", tone: "positive" },
  { id: "grateful", label: "Grateful", emoji: "🙏", tone: "positive" },
];

const BY_ID = new Map(MOODS.map((m) => [m.id, m]));

export function findMood(idOrLabel: string): Mood | undefined {
  const key = idOrLabel.trim().toLowerCase();
  return BY_ID.get(key) ?? MOODS.find((m) => m.label.toLowerCase() === key);
}

/** Display label for a stored mood value (a known id or free text). */
export function moodLabel(value: string): string {
  return findMood(value)?.label ?? value;
}

/** Optional check-in context. Every field is optional by design. */
export const CONTRIBUTORS = [
  { id: "too-many-tasks", label: "Too many tasks" },
  { id: "a-decision", label: "A decision" },
  { id: "work", label: "Work" },
  { id: "money", label: "Money" },
  { id: "relationships", label: "Relationships" },
  { id: "family", label: "Family" },
  { id: "health", label: "Health" },
  { id: "sleep", label: "Sleep" },
  { id: "uncertainty", label: "Uncertainty" },
] as const;

export const NEEDS = [
  { id: "to-feel-heard", label: "To feel understood" },
  { id: "perspective", label: "Perspective" },
  { id: "a-small-step", label: "A small step" },
  { id: "to-focus", label: "To focus" },
  { id: "to-rest", label: "To rest" },
] as const;

export type ContributorId = (typeof CONTRIBUTORS)[number]["id"];
export type NeedId = (typeof NEEDS)[number]["id"];
