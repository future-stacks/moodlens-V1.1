# MoodLens

**From emotional clarity to meaningful action.**

MoodLens is a short reflection and action-support tool for busy professionals dealing with overload, overthinking, decision fatigue and difficulty getting started. You check in with how you feel. MoodLens acknowledges it, offers a thought that fits your mood, and suggests one manageable next step.

> Understand your state. Find your next step. Build momentum.

MoodLens is **not** a medical, diagnostic or emergency service, and it is not a replacement for therapy or professional support.

---

## The experience

**Check in → Understand → Receive a thought → Take action → Reflect**

| Stage | What happens |
|---|---|
| **Check in** | Pick from 16 feelings or use your own words. You can optionally add energy, mental load, what's contributing, what you need and a short note. Only the feeling is required. |
| **Understand** | A short, non-judgemental acknowledgement and a possible interpretation, never a diagnosis. |
| **A thought** | A prominent quote card. *A MoodLens reflection* is original text and is never attributed to a real person. Named quotations come only from a small, checked collection, with author and source. |
| **Take action** | One specific step of about 2, 5 or 10 minutes, with a smaller alternative, "Suggest something else" and "This isn't helpful". |
| **Reflect** | Optional: *Did this help?* and *How do you feel now?* Steps you mark as unhelpful are avoided in future. |

There are also **History** (past check-ins, thoughts, actions and your feedback), **Insights** (weekly check-in count, common feelings, steps you said helped, presented as observations rather than diagnoses) and **Settings** (AI on/off, support-resource country, data export, delete all).

There is no streak. MoodLens shows "You checked in N times this week" and never resets or penalises time away.

### Safeguarding

Every check-in passes through a deterministic, pattern-based check (`shared/safeguarding.ts`) **in the browser before anything is sent**, and again **on the server before any AI call**. A high-risk disclosure never gets a quote and action. It gets a plain support screen with verified UK contacts (999/112, NHS 111, Samaritans 116 123, and the National Domestic Abuse Helpline where relevant). Resources are keyed by a manually chosen country (`shared/supportResources.ts`). Countries without verified numbers get generic guidance, never guessed numbers.

### Privacy

- Check-ins are stored **only in the browser** (`localStorage`). There are no accounts.
- With AI suggestions on, check-in content is sent through the MoodLens server to **Google Gemini** to write the response. The server does not store it.
- With AI off, nothing leaves the device and suggestions come from the built-in library.
- Users can download their data as JSON or delete everything from Settings.

---

## Architecture

```
React 19 + Vite + Tailwind 4 (src/)
  CheckInPanel → InterventionCard → ReflectPanel     History · Insights · Settings · Help
  src/lib/storage.ts   validated localStorage + V1.1 migration
  src/lib/api.ts       local safeguarding → POST /api/intervention → validated response, local library fallback
        │
Express (server/app.ts, compiled to dist-server/server.mjs)
  helmet (CSP, HSTS) · rate limit · JSON errors · zod request validation
  safeguarding → Gemini (server/gemini.ts) → zod-validated response → library fallback
        │
shared/   one contract for client and server
  intervention.ts  response/request schemas
  library.ts       built-in thoughts and actions for every mood
  moods.ts         mood taxonomy and context options
  safeguarding.ts  deterministic risk detection
  supportResources.ts  verified support contacts by country
```

The Gemini API key is read only on the server and never reaches the browser bundle. CI checks the build output for leaked keys.

---

## Development

Requires Node 20+.

```bash
npm install
cp .env.example .env      # add GEMINI_API_KEY (optional; without it the built-in library is used)
npm run dev               # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run lint` | Type-check |
| `npm test` | Unit, API and component tests (Vitest, Supertest, Testing Library) |
| `npm run build` | Client bundle (`dist/`) and compiled server (`dist-server/`) |
| `npm start` | Run the production build |
| `npm run test:e2e` | Playwright journeys and axe accessibility scans against the production build |

See `.env.example` for all configuration. Project documents:

- [`docs/BETA-READINESS.md`](docs/BETA-READINESS.md): acceptance criteria status and outstanding work
- [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md): how the brief maps to the code
- [`docs/audit/SPRINT-1-AUDIT.md`](docs/audit/SPRINT-1-AUDIT.md): the original technical audit

Built by Future&Hope.
