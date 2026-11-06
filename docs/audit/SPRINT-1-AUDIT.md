# MoodLens V1.1: Sprint 1 Technical Audit

**Date:** 2026-11-06
**Branch audited:** `claude/busy-hamilton-gg4ow5` @ `032c781`
**Scope:** Week 1, "Audit and stabilise". The audit records the current state only. No application code was changed.

---

## 1. Sprint 1 checklist

| # | Item | Result |
|---|------|--------|
| 1 | Pull the latest repository | ✅ Clean working tree on `032c781` |
| 2 | Run `npm install` and start the app | ✅ `npm ci` on Node 22.23 / npm 10.9. `npm run dev` serves on `:3000` |
| 3 | Confirm the production build works | ✅ `npm run lint` (tsc) passes. `npm run build` passes (JS 455 kB / 142 kB gzip). `npm start` serves `dist/` |
| 4 | Find where the API key is handled | ✅ Server-side only, in `server/gemini.ts:4`. No `AIza…` key in `dist/`, and CI enforces this check |
| 5 | Find how check-ins and history are persisted | ✅ Browser `localStorage` only. The server persistence endpoints are stubs (§4) |
| 6 | Capture screenshots | ✅ 13 screenshots in [`screenshots/`](./screenshots) (desktop 1280×900, mobile 390×844) |

---

## 2. What the application actually is today

```
Browser (React 19 + Vite 6 + Tailwind 4 + motion)
 ├─ App.tsx ── holds all state; reads/writes localStorage directly
 │   ├─ Onboarding      (first visit, 4 steps)
 │   ├─ MoodSelector    (10 fixed moods)  +  free-text mood input
 │   ├─ InterventionCard (quote, micro-action, reframe, journal prompt)
 │   ├─ StreakDisplay
 │   ├─ HistoryView     (modal)
 │   ├─ HelpView        (modal)
 │   └─ AuthView        (modal, "local auth" in localStorage)
 │
 │  Not rendered anywhere: LandingPage.tsx, SettingsView.tsx
 │
 └─ src/lib/gemini.ts ── POST /api/intervention
                              │
Express (server.ts, run via tsx in dev AND prod)
 ├─ GET  /api/health            → {status:"ok"}
 ├─ POST /api/intervention      → server/gemini.ts → Gemini "gemini-3-flash-preview"
 ├─ POST /api/complete-action   → STUB: always {success:true, streak:5}
 ├─ GET  /api/streak            → STUB: always {streak:5}
 ├─ POST /api/mood-log          → STUB: always {success:true}
 └─ Vite middleware (dev) / static dist + SPA fallback (prod)
```

### Core flow as implemented
1. **Check-in:** the user picks one of 10 mood labels or types free text (≤100 chars). Energy, mental load and context are not captured.
2. **Understand/Act:** the mood string goes to Gemini with a fixed prompt, and the response is rendered as a card.
3. **Complete:** "Action Completed" increments the streak and appends `{id, mood, action, timestamp}` to history.
4. **Reflect:** not implemented. Nothing records whether the action helped.
5. **Patterns:** not implemented. History is a flat reverse-chronological list.

Of the roadmap's five areas, about 1.5 exist: a basic check-in, and a combined understand-and-act card.

### Current data model (all in `localStorage`)

| Key | Shape | Written by |
|-----|-------|-----------|
| `moodlens_history` | `Array<{id, mood, action, timestamp}>` | `App.tsx:113` |
| `moodlens_streak` | stringified int | `App.tsx:111` |
| `moodlens_last_completed` | ISO timestamp | `App.tsx:112` |
| `moodlens_onboarding_seen` | `"true"` | `App.tsx:129` |
| `moodlens_current_user` | username | `App.tsx:134` |
| `moodlens_users` | `{ [username]: plaintextPassword }` | `AuthView.tsx:43` |
| `moodlens_reminder_time` | `"HH:MM"` | `SettingsView.tsx:29` (unreachable) |

There is no schema versioning. History is not scoped to the logged-in user.

### AI integration (`server/gemini.ts`)
- Model: `gemini-3-flash-preview`, a preview model that may be renamed or withdrawn.
- Uses structured output (`responseSchema`), but the server does not validate the response against it before returning it.
- The persona is "senior product engineer, behavioral psychologist, and habit design expert". This doesn't match the product positioning and implies clinical authority.
- The user's mood is interpolated straight into the prompt (`The user is currently feeling: ${mood}`).
- The fallback returns 4 fields, but the UI expects 7 (§3, B1).
- There is no rate limiting, timeout, safety handling or logging beyond `console.error`.

---

## 3. Findings

Severity: **P0** blocks any public use · **P1** breaks the core experience or a stated promise · **P2** quality or maintainability · **P3** polish.

### Security and privacy

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| S1 | **P0** | **Passwords are stored in plaintext in `localStorage`.** "Login" is client-side only and gives no protection. Any script on the origin, or anyone with the device, can read every password. | `AuthView.tsx:28-43`. Verified at runtime: `moodlens_users = {"audit-user":"hunter2-secret"}` |
| S2 | **P0** | **No safeguarding path.** A free-text mood such as "I want to end it all" goes to the LLM and gets back a "micro-action". There is no crisis detection, signposting or disclaimer. | `server.ts:22-28`, `server/gemini.ts` |
| S3 | P1 | **The privacy statement is inaccurate.** Help says "all your data… is stored locally in your browser", but every mood (including free text) is sent to Google's Gemini API. | `HelpView.tsx:27` |
| S4 | P1 | `/api/intervention` has **no rate limiting**, so anyone can spend the Gemini quota. | `server.ts:22` |
| S5 | P1 | No security headers (CSP, HSTS, X-Frame-Options, etc.), and `X-Powered-By: Express` is exposed. | `curl -I /` |
| S6 | P2 | 27 `npm audit` advisories (1 critical `proxy-addr`, 16 high). Most come in through the **`shadcn` CLI listed as a runtime dependency** (it pulls in MCP SDK, hono and ts-morph). Direct: `vite`, `shadcn`. | `npm audit` |
| S7 | P2 | Prompt injection surface: raw user text is interpolated into the prompt. The impact is limited for now (100-char cap, no tools), but the structure is wrong for future context fields. | `server/gemini.ts:17` |
| S8 | P2 | Malformed JSON returns an HTML error page instead of a JSON error. | `curl -d '{bad'` → HTML 400 |

### Correctness bugs

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| B1 | **P1** | **The AI fallback renders a broken card.** The fallback has no `quote`, `author` or `journalPrompt`, so the user sees an empty quote, a bare "—" and an empty Journal Prompt box. Every user without a valid key sees this. | `screenshots/desktop-03-intervention-fallback.png` |
| B2 | P1 | **The "Day Streak" counts actions, not days.** Each "Action Completed" adds 1, so five clicks in one minute make a 5-day streak. | `App.tsx:96-99` |
| B3 | P1 | Streak reset uses elapsed 24h blocks, not calendar days, so it resets inconsistently around midnight and across timezones. | `App.tsx:60` |
| B4 | P1 | The server persistence endpoints are hardcoded stubs (`streak: 5`) that return fake success. Their comment mentions Firestore, which conflicts with the PostgreSQL plan. | `server.ts:30-43` |
| B5 | P2 | `JSON.parse` of `localStorage` has no try/catch. Corrupted storage crashes the app on load (white screen). | `App.tsx:52`, `AuthView.tsx:28` |
| B6 | P2 | History is not partitioned by user. Logging in or out doesn't change what's shown, so "accounts" are cosmetic. | `App.tsx` |
| B7 | P2 | The server returns unvalidated AI output. If the model omits a required field, the UI breaks in the same way as B1. | `server/gemini.ts:39` |
| B8 | P2 | Unknown `/api/*` routes return the SPA `index.html` with status 200 instead of a 404 JSON response. | `curl /api/nope` → 200 HTML |
| B9 | P3 | "Copy Quote" copies `"" — ` when the quote is missing. | `InterventionCard.tsx:35` |
| B10 | P3 | A failed request on "New Insight" leaves the user on an infinite spinner path. `mood` stays set and `intervention` is the stale value or null. | `App.tsx:75-87` |

### UX, accessibility and mobile

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| U1 | P1 | The streak card is white with near-white text, so the streak number is almost invisible. It looks like a leftover from another design system. | `StreakDisplay.tsx:12`, `desktop-02-home.png` |
| U2 | P1 | On mobile, the header icon buttons overlap the "MOODLENS" wordmark. | `mobile-02-home.png` |
| U3 | P1 | Modals have no `role="dialog"`, focus trap or Escape-to-close, and icon-only buttons rely on `title` instead of `aria-label`. Verified: Escape does not close History. | `HistoryView.tsx`, `HelpView.tsx`, `AuthView.tsx` |
| U4 | P2 | Check-in captures only one mood word. There is no energy, mental-load or context input (roadmap §2.01). | `MoodSelector.tsx` |
| U5 | P2 | The mood set mixes positive states (Grateful, Inspired, Hopeful) with overload states, and has no "Overwhelmed" or "Decision fatigue", the target user's core states. | `MoodSelector.tsx:15-26` |
| U6 | P2 | The card leads with an inspirational quote. The roadmap leads with understanding, then one action. There are no duration or difficulty options and no "easier option". | `InterventionCard.tsx` |
| U7 | P2 | There is no reflection or feedback step after an action (helpful / not helpful / too hard). | — |
| U8 | P2 | Animations ignore `prefers-reduced-motion`. | `motion` usage throughout |

### Product and positioning misalignment with the roadmap

| ID | Finding |
|----|---------|
| M1 | The copy leans on streaks and gamification ("Gamified consistency", "Maintain your streak", "Streak reset" toast). The roadmap explicitly says not to optimise for streaks. |
| M2 | "Action > Reflection" / "Action over reflection" contradicts the new loop: Check in → Understand → Act → **Reflect**. |
| M3 | The landing page (unused) has `href="#"` Privacy and Terms links, and "Master your mood" sounds like a treatment claim. |
| M4 | The AI persona claims "behavioral psychologist" expertise. This implies clinical authority, which the product must not claim. |
| M5 | The README promises "Smart Reminders" and "Pattern Recognition", which aren't reachable or don't exist. It also names FastAPI for the backend, while the roadmap says Express. |

### Engineering hygiene

| ID | Sev | Finding |
|----|-----|---------|
| E1 | P1 | **No tests at all.** There is no test runner, and `lint` is only `tsc --noEmit` (no ESLint). |
| E2 | P2 | Production runs through `tsx` (a devDependency) and imports `vite` at the top level, so `npm ci --omit=dev && npm start` would fail. There is no compiled server build. |
| E3 | P2 | Build tooling (`vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `shadcn`) is in `dependencies`. `vite` appears in both `dependencies` and `devDependencies`. |
| E4 | P2 | Dead code: `LandingPage.tsx` and `SettingsView.tsx` are never rendered, and there are unused imports (`Brain`, `Sparkles` in `App.tsx`). |
| E5 | P2 | `Intervention`/`HistoryItem` types are duplicated across files, and the server and client share no types. `intervention` is typed `any` in `App.tsx`. |
| E6 | P2 | `App.tsx` owns all state and persistence. There is no storage abstraction, which makes adding account sync costly. |
| E7 | P3 | No structured logging. Errors are logged with `console.error` with full stack traces. |
| E8 | P3 | CI runs only on `main`, so feature branches get no checks until a PR to `main` is opened. |

---

## 4. What works and is worth keeping

- **The API key is genuinely server-side**, and CI guards the bundle against key leaks. This was the most important earlier fix.
- The **Express + Vite single-process setup** is simple and fine for staging.
- **Structured output** (`responseSchema`) is already in place, so we only need to tighten it.
- **Input validation exists** on `/api/intervention` (type and length).
- **The local-first model** works offline for history, and the roadmap wants to keep it.
- The **visual language** (dark, calm, rounded) is coherent apart from the streak card.
- Type-check and build are clean, and dependencies install reproducibly from the lockfile.

---

## 5. Prioritised backlog

Each item names the findings it resolves. The order follows dependency and risk rather than effort.

### Now: stabilise before building anything new (end of Week 1 / start of Week 2)
1. **Remove fake local auth** (S1, B6). Delete `AuthView` and the `moodlens_users` storage, and clear existing plaintext entries on load. Real accounts arrive in Week 4/5. Until then the app is honestly local-only.
2. **Add a safeguarding baseline** (S2). Run a server-side keyword and pattern check for crisis language before the AI call, and return a fixed, non-AI support response with UK signposting (Samaritans 116 123, NHS 111, 999). Add a persistent "MoodLens is not an emergency or medical service" line.
3. **Fix the AI fallback and validate the response** (B1, B7, B9). Use one shared response schema, validate it with zod on the server, and send a complete fallback marked `source: "fallback"`.
4. **Correct the privacy copy** (S3). State that check-in text is sent to Google Gemini to generate suggestions.
5. **Add a rate limit and security headers** (S4, S5, S8, B8). Use `express-rate-limit` on `/api/*` and `helmet`, add a JSON error handler, and return 404 for unknown API routes.
6. **Set up a test harness** (E1). Add Vitest, React Testing Library and Supertest, with first tests for `/api/intervention` validation and fallback and for the streak logic.

### Next: Week 2 core experience
7. Introduce a **typed storage module** (E5, E6, B5) with a versioned schema and safe parsing. Every later feature, including sync, goes through it.
8. **Redesign the check-in** (U4, U5): mood (overload-oriented set), energy (1–5), mental load (1–5), optional context tags, completable in under 60 seconds.
9. **Restructure the intervention card** (U6, M2): Understand (reflection) → one action with duration and difficulty → "Give me something easier". Make the quote optional and secondary.
10. **Replace streaks with gentle momentum** (B2, B3, U1, M1), for example "3 check-ins this week". Base it on calendar days, with no reset shaming.
11. **Accessibility and mobile pass** (U2, U3, U8): dialogs, focus, labels, header layout, reduced motion.

### Week 3: intelligence layer
12. Rewrite the prompt and persona (M4, S7). Pass user context as structured data, not interpolated text, and add an explicit "not a clinician" instruction.
13. Generate responses from the full check-in (mood, energy, load, context), returning `reflection`, `action`, `durationMinutes`, `difficulty` and `easierAlternative`.
14. Add a reflect step and feedback (U7): helpful / not helpful / too difficult, plus whether the user's state changed.
15. Pin a stable (non-preview) model version through an environment variable.

### Week 4+: as per roadmap
16. Patterns view over local data (Week 4), framed as observations, not causes.
17. Choose PostgreSQL + Drizzle or Prisma, replace the stub endpoints (B4), and add optional account sync.
18. Clean up dependencies (S6, E2, E3): move build tools to devDependencies, drop the `shadcn` runtime dependency, and compile the server for production.
19. Remove dead code or wire it in (E4). The landing page is for Week 8, Settings for later.
20. Run CI on all branches and PRs (E8), and add ESLint.

---

## 6. Open decisions for the product owner

1. **Auth (backlog item 1):** removing the fake login now means the header loses its "account" button until real auth arrives. Is that acceptable, or should it become "Accounts coming soon"?
2. **Streak:** drop it entirely, or reframe it as a weekly check-in count?
3. **Crisis signposting region:** UK-only numbers for the beta, or a locale-aware list?
4. **Quote:** keep it as an optional secondary element, or remove it?

---

## Appendix: reproduction commands

```bash
npm ci && npm run lint && npm run build             # all pass
npm run dev                                         # :3000
curl -X POST localhost:3000/api/intervention \
  -H 'content-type: application/json' -d '{"mood":"overwhelmed"}'
# → 4-field fallback (no key): B1
curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/nope   # 200: B8
curl -X POST localhost:3000/api/intervention \
  -H 'content-type: application/json' -d '{bad'                  # HTML 400: S8
npm audit                                           # 27 advisories: S6
```

The screenshot script was run with the pre-installed Playwright against the dev server. It walks onboarding → home → intervention → history → auth → help at desktop and mobile sizes.
