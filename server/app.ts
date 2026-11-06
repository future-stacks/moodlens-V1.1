import express from "express";
import { CheckInRequestSchema } from "../shared/intervention";
import { getIntervention, type GenerateFn } from "./gemini";

export interface AppOptions {
  /** Override the AI call (tests). `null` forces the built-in library. */
  generate?: GenerateFn | null;
}

/** Builds the API app. Static/Vite serving is added by server.ts. */
export function createApp(options: AppOptions = {}) {
  const app = express();
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/intervention", async (req, res) => {
    const parsed = CheckInRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", details: parsed.error.issues.map((i) => i.path.join(".") || "body") });
    }
    const intervention = await getIntervention(parsed.data, options.generate);
    res.json({ kind: "intervention", intervention });
  });

  // Placeholder for the endpoints requested by the user
  // These will be implemented with Firestore logic once Firebase is set up

  app.post("/api/complete-action", (req, res) => {
    res.json({ success: true, streak: 5 });
  });

  app.get("/api/streak", (req, res) => {
    res.json({ streak: 5, lastCompleted: new Date().toISOString() });
  });

  app.post("/api/mood-log", (req, res) => {
    res.json({ success: true });
  });

  return app;
}
