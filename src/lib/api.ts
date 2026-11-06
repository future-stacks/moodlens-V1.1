import { InterventionSchema, type CheckInRequest, type Intervention } from "../../shared/intervention";
import { buildLibraryIntervention } from "../../shared/library";
import { assessRisk, type RiskCategory } from "../../shared/safeguarding";

export type InterventionResult =
  | { kind: "intervention"; intervention: Intervention }
  | { kind: "support"; category?: RiskCategory };

/**
 * Ask the server for an intervention. The response is validated against the
 * shared contract. If the server can't be reached or replies with something
 * unexpected, a complete response is built from the local library instead,
 * so the user always gets a thought and an action.
 *
 * Safeguarding runs first, locally: text that suggests someone may be at risk
 * is never sent to the server or the AI provider. With `ai: false` nothing is
 * sent at all.
 */
export async function requestIntervention(
  req: CheckInRequest,
  options: { ai?: boolean; signal?: AbortSignal } = {},
): Promise<InterventionResult> {
  const risk = assessRisk(req.mood, req.note);
  if (risk.level === "high") return { kind: "support", category: risk.category };
  // AI suggestions switched off: build the response on-device; nothing is sent.
  if (options.ai === false) {
    return { kind: "intervention", intervention: buildLibraryIntervention(req, req.exclude?.length ?? 0) };
  }
  try {
    const res = await fetch("/api/intervention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: options.signal,
    });
    if (res.ok) {
      const body = await res.json();
      if (body?.kind === "support") return { kind: "support", category: body.category };
      if (body?.kind === "intervention") {
        const parsed = InterventionSchema.safeParse(body.intervention);
        if (parsed.success) return { kind: "intervention", intervention: parsed.data };
      }
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
  }
  return { kind: "intervention", intervention: buildLibraryIntervention(req, req.exclude?.length ?? 0) };
}
