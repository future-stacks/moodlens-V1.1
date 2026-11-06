/**
 * Deterministic safeguarding check.
 *
 * Runs on all user-written text (mood + note) in the browser BEFORE anything
 * is sent, and again on the server BEFORE any AI call. It is pattern-based on
 * purpose: an AI model must never be the only mechanism for spotting
 * high-risk disclosures.
 *
 * It errs towards caution. A false positive shows support information instead
 * of a quote and action, which is an acceptable cost. A false negative is not.
 * Any change to these patterns must keep tests/shared/safeguarding.test.ts green.
 */
export type RiskCategory = "self_harm" | "harm_to_others" | "unsafe";

export interface RiskAssessment {
  level: "high" | "none";
  category?: RiskCategory;
}

const SELF = "my ?self";

const PATTERNS: Array<[RiskCategory, RegExp]> = [
  ["self_harm", /\bsuicid/],
  ["self_harm", new RegExp(`\\b(?:kill(?:ing)?|hurt(?:ing)?|harm(?:ing)?|cut(?:ting)?|burn(?:ing)?|starv(?:e|ing)) ${SELF}\\b`)],
  ["self_harm", /\bkms\b/],
  ["self_harm", /\bself[- ]?harm/],
  ["self_harm", /\boverdos/],
  ["self_harm", /\bunalive\b/],
  ["self_harm", /\bend(?:ing)? (?:it all|my life|my own life|everything)\b/],
  ["self_harm", /\btake (?:my|my own) life\b/],
  ["self_harm", /\b(?:want|wanna|wanting|going|ready|wish|wishing) (?:to )?die\b/],
  ["self_harm", /\bwish (?:i|i'd) (?:was|were|had) (?:dead|never been born)\b/],
  ["self_harm", /\bbetter off (?:dead|without me)\b/],
  ["self_harm", /\b(?:don't|do not|dont|no longer) want to (?:live|be alive|exist|be here|wake up|go on)\b/],
  ["self_harm", /\bno (?:reason|point) (?:to|in) (?:live|living|go on|going on|being alive)\b/],
  ["self_harm", /\bcan't (?:go on|do this anymore|take it anymore|keep going)\b/],
  ["self_harm", /\bnot (?:want|wanting) to be (?:here|alive) anymore\b/],
  ["harm_to_others", /\b(?:kill|hurt|harm|stab|shoot|attack) (?:him|her|them|someone|somebody|people|my (?:partner|wife|husband|boyfriend|girlfriend|boss|child|children|kids?|son|daughter|baby|mum|dad|mother|father))\b/],
  ["unsafe", /\b(?:i'm|i am|i feel|feel|feeling) (?:not safe|unsafe|in danger)\b/],
  ["unsafe", /\b(?:being|been|getting|got) (?:abused|assaulted|raped|hit|beaten|attacked|threatened)\b/],
  ["unsafe", /\b(?:he|she|they|someone|somebody|my (?:partner|husband|wife|boyfriend|girlfriend|parent|mum|dad)) (?:hits|hurts|is hurting|abuses|is abusing|beats|threatens|is threatening) me\b/],
  ["unsafe", /\bdomestic (?:abuse|violence)\b/],
];

/** Lower-case and normalise apostrophes/whitespace so simple patterns catch common spellings. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/\b(can|don|won|isn)\s?t\b/g, "$1't") // "cant" -> "can't", "dont" -> "don't"
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessRisk(...texts: Array<string | undefined | null>): RiskAssessment {
  const text = normalise(texts.filter(Boolean).join(" . "));
  if (!text) return { level: "none" };
  for (const [category, pattern] of PATTERNS) {
    if (pattern.test(text)) return { level: "high", category };
  }
  return { level: "none" };
}
