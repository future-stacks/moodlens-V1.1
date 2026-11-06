import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { CheckInRequestSchema } from "../shared/intervention";
import { assessRisk } from "../shared/safeguarding";
import { getIntervention, type GenerateFn } from "./gemini";

export interface AppOptions {
  /** Override the AI call (tests). `null` forces the built-in library. */
  generate?: GenerateFn | null;
  /** Requests allowed per IP per minute on /api/intervention. */
  rateLimitPerMinute?: number;
  production?: boolean;
}

/** Builds the API app. Static/Vite serving is added by server.ts. */
export function createApp(options: AppOptions = {}) {
  const production = options.production ?? process.env.NODE_ENV === "production";
  const app = express();

  // Behind a load balancer/CDN, set TRUST_PROXY to the number of proxy hops so
  // rate limiting sees the real client IP.
  const hops = Number(process.env.TRUST_PROXY);
  if (Number.isInteger(hops) && hops > 0) app.set("trust proxy", hops);

  app.use(
    helmet({
      // Vite's dev server injects inline scripts, so CSP and HSTS apply in production only.
      contentSecurityPolicy: production
        ? {
            directives: {
              "default-src": ["'self'"],
              "script-src": ["'self'"],
              "style-src": ["'self'", "'unsafe-inline'"], // motion/sonner set inline styles
              "img-src": ["'self'", "data:"],
              "font-src": ["'self'", "data:"],
              "connect-src": ["'self'"],
              "object-src": ["'none'"],
              "base-uri": ["'self'"],
              "form-action": ["'self'"],
              "frame-ancestors": ["'none'"],
            },
          }
        : false,
      strictTransportSecurity: production,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use("/api", express.json({ limit: "16kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const interventionLimiter = rateLimit({
    windowMs: 60_000,
    limit: options.rateLimitPerMinute ?? (Number(process.env.RATE_LIMIT_PER_MINUTE) || 20),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "rate_limited" });
    },
  });

  app.post("/api/intervention", interventionLimiter, async (req, res, next) => {
    try {
      const parsed = CheckInRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: "invalid_request", details: parsed.error.issues.map((i) => i.path.join(".") || "body") });
      }
      // Safeguarding runs before any AI call. High-risk disclosures never reach the
      // AI provider and never receive a quote + action. Only the category is logged.
      const risk = assessRisk(parsed.data.mood, parsed.data.note);
      if (risk.level === "high") {
        console.warn(JSON.stringify({ level: "warn", msg: "safeguarding_triggered", category: risk.category }));
        return res.json({ kind: "support", category: risk.category });
      }
      const intervention = await getIntervention(parsed.data, options.generate);
      res.json({ kind: "intervention", intervention });
    } catch (error) {
      next(error);
    }
  });

  // Unknown API routes are a 404, not the SPA's index.html.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  app.use("/api", errorHandler);

  return app;
}

/** JSON errors for API routes; never leaks stack traces. Register after all routes. */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status >= 500) {
    console.error(JSON.stringify({ level: "error", msg: "unhandled_error", path: req.path, error: String(err?.message ?? err) }));
  }
  const error = status === 400 ? "invalid_json" : status === 413 ? "payload_too_large" : status >= 500 ? "internal_error" : "bad_request";
  res.status(status).json({ error });
};
