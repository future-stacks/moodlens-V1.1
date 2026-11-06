import { z } from "zod";
import { CONTRIBUTORS, NEEDS } from "./moods";

/**
 * The MoodLens response contract. Successful AI responses, fallbacks and
 * locally generated responses all satisfy InterventionSchema, so the UI never
 * has to deal with missing quote or action fields.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const ACTION_DURATIONS = [2, 5, 10] as const;
export type ActionDuration = (typeof ACTION_DURATIONS)[number];

/** Snap any model-provided duration to the nearest supported option. */
export function snapDuration(minutes: number): ActionDuration {
  return ACTION_DURATIONS.reduce((best, d) =>
    Math.abs(d - minutes) < Math.abs(best - minutes) ? d : best,
  );
}

const Duration = z.coerce.number().positive().max(60).transform(snapDuration);

export const QuoteSchema = z.discriminatedUnion("type", [
  // Verified quotation from the curated library. Attribution is required.
  z.object({
    type: z.literal("curated_quote"),
    text: text(300),
    author: text(80),
    source: z.string().trim().max(160).nullable(),
  }),
  // Text written for MoodLens (by the team or generated). Never attributed to a person.
  z.object({
    type: z.literal("original_reflection"),
    text: text(300),
    author: z.null(),
    source: z.null(),
  }),
]);
export type Quote = z.infer<typeof QuoteSchema>;

export const ActionSchema = z.object({
  title: text(120),
  description: text(400),
  duration_minutes: Duration,
  difficulty: z.enum(["easy", "moderate"]),
});
export type Action = z.infer<typeof ActionSchema>;

export const AlternativeActionSchema = z.object({
  title: text(120),
  description: text(400),
  duration_minutes: Duration,
});
export type AlternativeAction = z.infer<typeof AlternativeActionSchema>;

export const InterventionSchema = z.object({
  acknowledgement: text(300),
  reflection: text(500),
  quote: QuoteSchema,
  action: ActionSchema,
  alternative_action: AlternativeActionSchema,
  journal_prompt: z.string().trim().max(200).nullable(),
  /** Where this response came from, so the UI can be honest about it. */
  origin: z.enum(["ai", "library"]),
});
export type Intervention = z.infer<typeof InterventionSchema>;

/** What the client sends to POST /api/intervention. Only `mood` is required. */
export const CheckInRequestSchema = z.object({
  mood: text(100),
  energy: z.number().int().min(1).max(5).optional(),
  mentalLoad: z.number().int().min(1).max(5).optional(),
  contributors: z
    .array(z.enum(CONTRIBUTORS.map((c) => c.id) as [string, ...string[]]))
    .max(CONTRIBUTORS.length)
    .optional(),
  need: z.enum(NEEDS.map((n) => n.id) as [string, ...string[]]).optional(),
  note: z.string().trim().max(280).optional(),
  /** Action titles already shown, so "another suggestion" gives something different. */
  exclude: z.array(z.string().max(120)).max(10).optional(),
  country: z.string().regex(/^[A-Z]{2}$|^OTHER$/).optional(),
});
export type CheckInRequest = z.infer<typeof CheckInRequestSchema>;
