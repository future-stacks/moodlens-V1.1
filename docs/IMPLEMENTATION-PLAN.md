# MoodLens: Public-Beta Implementation Plan

This plan maps the product brief (Check in → Understand → Receive a thought → Take action → Reflect) onto the existing code. It builds on [`audit/SPRINT-1-AUDIT.md`](./audit/SPRINT-1-AUDIT.md).

## Current implementation vs. intended experience

| Stage / area | Status today | Plan |
|---|---|---|
| **Check in** | ✅ Works: 10 mood chips + free text (`MoodSelector.tsx`, `App.tsx`) | **Retain.** Extend the mood list (add Overwhelmed, Stressed, Frustrated, Unmotivated, Lonely, Calm, Happy, Confused). Keep all existing ids so history stays valid. Add *optional* energy, mental load, "what's contributing" and "what I need" in a collapsible section. |
| **Understand** | ❌ Missing. The AI returns `reframe`, which is closer to an instruction than an acknowledgement | Add `acknowledgement` + `reflection` to the response contract. |
| **Receive a thought** | ⚠️ Partial. A quote exists and is visually prominent, but its attribution comes from the AI unverified (invented-attribution risk) and the fallback has no quote (renders blank) | **Retain and harden.** Add a curated library of verified, attributed quotes plus original MoodLens reflections. The AI may only write *original reflections*. It never attributes text to real people. Real quotations come only from the curated list, by id. |
| **Take action** | ⚠️ Partial. One "micro-action" of ≤2 min | Make it an action with title/description/`duration_minutes` (2/5/10)/difficulty, plus a smaller `alternative_action`. Add buttons for Done / Easier option / Another suggestion / Not helpful. |
| **Reflect** | ❌ Missing | Add an optional short step after the action: "Did this help?" + "How do you feel now?". Store it with the check-in. |
| **History** | ⚠️ Partial. It stores mood + action text only | Store the full check-in (context, thought, action, outcome, feedback). |
| **Insights** | ❌ Missing | Add a descriptive weekly view: check-ins this week, most common states, actions reported helpful. |
| **Streaks** | ⚠️ Works but punitive and buggy (counts clicks, resets to 0) | **Replace** with "You checked in N times this week". No resets, no guilt copy. |
| **Auth** | ❌ Fake. Plaintext passwords in localStorage | **Remove.** Purge `moodlens_users` on load. Keep the app account-free. |
| **Safeguarding** | ❌ Missing | Add a deterministic server- **and** client-side detector. A high-risk disclosure gets a separate support response (UK: 999/112, NHS 111, Samaritans 116 123), never a quote + action. Resources are keyed by a manually selected country. |
| **Privacy copy** | ❌ Inaccurate ("all data stays local") | Rewrite Help/Settings to state exactly what goes to Google Gemini, and why. |
| **Settings** | ⚠️ Exists but unreachable, with reminder/notification features that don't work | Wire it in with privacy info, country, data export and delete-all. Drop the non-functional reminders. |
| **Server** | ⚠️ AI output unvalidated, stub endpoints, no rate limit, no headers | Add zod validation, mood-specific fallbacks, removal of the stubs, rate limiting, helmet, JSON errors, 404 for unknown API routes. |
| **Tests** | ❌ None | Add Vitest (unit), Supertest (API), Playwright (main journey). Run all in CI. |

## Data migration (localStorage)

Existing keys: `moodlens_history` (`{id,mood,action,timestamp}[]`), `moodlens_streak`, `moodlens_last_completed`, `moodlens_onboarding_seen`, `moodlens_current_user`, `moodlens_users`.

A new `moodlens_checkins_v2` key holds the full check-in records. On first load:
- each legacy history item becomes a v2 check-in (`legacy: true`, mood + action title preserved, completed = true)
- the legacy `moodlens_history` key is **kept**, not deleted, so the migration is reversible
- `moodlens_users` (plaintext passwords) and `moodlens_current_user` are deleted. This is the one intentional deletion, and it's a security fix
- `moodlens_streak` and `moodlens_last_completed` are left in place but no longer read

## Order of work (one commit each)

1. Shared response contract, curated thought library, validated AI output, complete fallbacks, test harness
2. Deterministic safeguarding layer + country resources
3. Storage module + migration, removal of fake auth, weekly count replacing streak
4. Core-experience UI: check-in context, acknowledgement, quote card, action + alternative, reflection
5. History, Insights, Settings (privacy, country, export/delete), accurate disclosures
6. Accessibility and mobile fixes (dialogs, header, contrast, reduced motion)
7. Server hardening: rate limit, headers, errors, stub removal, dependency cleanup
8. End-to-end test + CI

## Product decisions made from the brief (flag if wrong)

- **Quote attribution:** the AI is never allowed to output a named author. Attributed quotes come only from the curated, verified list. This removes the invented-attribution risk entirely.
- **Weekly count** uses ISO weeks (Monday start), local time.
- **Country:** UK is the default. The list is structured so countries can be added with verified numbers. Only the UK is included for now. "Other" shows generic advice to contact local emergency services, with no invented numbers.
