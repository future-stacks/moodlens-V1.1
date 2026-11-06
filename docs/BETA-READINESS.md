# MoodLens: Public-Beta Readiness

Status against the acceptance criteria in the product brief (Phase D), as of 2026-11-06 on branch `claude/busy-hamilton-gg4ow5`.

✅ met and covered by automated tests · ⚠️ met in code, needs a non-engineering step · ❌ not yet

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | A user can complete a mood check-in | ✅ | `CheckInPanel`; e2e "core journey" |
| 2 | MoodLens acknowledges the emotional state | ✅ | `acknowledgement` + `reflection` in the contract; every library mood has both |
| 3 | A relevant quote or original thought | ✅ | `QuoteCard`; every mood has thoughts (`tests/shared/library.test.ts`) |
| 4 | Quotations and sources labelled accurately | ✅ | AI output is forced to `original_reflection` and attributed-looking text is rejected. Curated quotes require author + source (tested). See note A |
| 5 | One practical, achievable action | ✅ | `action` with 2/5/10-minute duration |
| 6 | The user can select an alternative action | ✅ | Smaller alternative, "Suggest something else" |
| 7 | The user can say whether it helped | ✅ | "This isn't helpful" and the reflection step; feedback steers future suggestions |
| 8 | The user can revisit previous check-ins | ✅ | `HistoryView`, including migrated V1.1 entries |
| 9 | Basic weekly insights | ✅ | `InsightsView`; `tests/client/insights.test.ts` |
| 10 | Works when the AI provider is unavailable | ✅ | Server and client library fallbacks; tests for provider error, invalid output, server unreachable |
| 11 | AI output validated before display | ✅ | zod on the server and again in the browser |
| 12 | High-risk disclosures handled separately | ✅ ⚠️ | Deterministic check in the client and server, with 35 pattern tests. See note B |
| 13 | No fake auth or plaintext passwords | ✅ | `AuthView` removed; legacy keys purged on load (unit + e2e) |
| 14 | Privacy disclosures accurate | ✅ ⚠️ | Onboarding, Settings, Help and the note field. See note C |
| 15 | Main experience works on mobile | ✅ | e2e on Pixel 7; no horizontal scroll at 390px |
| 16 | Automated tests cover critical journeys | ✅ | 91 Vitest + 16 Playwright tests (8 per viewport), all in CI |
| 17 | Production build succeeds | ✅ | `npm run build`; CI |
| 18 | Public-beta security and privacy baseline | ⚠️ | Engineering baseline done (below). The legal/compliance items in note C remain |

### Security baseline in place
CSP, HSTS and helmet defaults (production) · rate limiting · request validation and size limits · JSON errors with no stack traces · server-only API key with a CI leak scan · 0 `npm audit` findings in production dependencies · no server-side storage of check-in content · data export and delete-all.

---

## Notes and decisions for the product owner

**A. Curated quotations.** The library has six real quotations (Kabat-Zinn, Alcott, Frost, Lamott, Tolkien, Dickinson), included only where wording and source were confidently known. Please have someone check each against the original work before launch. Everything else is labelled *A MoodLens reflection*.

**B. Safeguarding review.** The detector errs towards caution, and its patterns and copy were written by engineering. Before real users, someone with safeguarding or clinical experience should review `shared/safeguarding.ts`, the support screen copy, and the verified contacts in `shared/supportResources.ts`. Only the UK is configured. Other countries show generic guidance plus findahelpline.com.

**C. Data protection (UK GDPR).** Check-ins can be health data (special category).
- **Gemini terms:** confirm which Gemini API terms MoodLens runs under. Google's free-tier terms allow it to use API content to improve its products, which would contradict user expectations here. Use a paid tier, or Vertex AI with data-use controls, for the beta.
- **Before launch:**
  - a DPIA
  - a privacy policy and terms (the app copy is accurate, but these documents are required)
  - an explicit consent decision (the AI-off switch exists, but consent may need to be opt-in)
  - a record of Google as a processor

**D. Model.** It defaults to `gemini-3-flash-preview` (what V1.1 used), and the `GEMINI_MODEL` env var sets it. Pin a generally available model before beta.

**E. Mood list.** All 10 V1.1 moods are kept and 6 added (16 total). Angry and Frustrated are both present. Trim the list if it feels long.

---

## Outstanding engineering work

| Area | Item | Roadmap week |
|---|---|---|
| Observability | Error tracking (e.g. Sentry) and metrics. Logs are already structured JSON | 6–7 |
| Deployment | AWS architecture, staging environment, HTTPS, secrets manager, CD pipeline. The compiled server and env config are ready | 7 |
| Metrics | Privacy-respecting product metrics (completion rate, time to first action) with consent | 8 |
| Sync | Optional account-based sync and a PostgreSQL schema; backups once server persistence exists | 4+ |
| AI quality | An evaluation set of difficult prompts run against the live model | 6 |
| Dev dependencies | Vitest 3 → 5 (dev-only advisory; a major upgrade) | — |
