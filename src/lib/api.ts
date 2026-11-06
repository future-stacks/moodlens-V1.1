import { InterventionSchema, type CheckInRequest, type Intervention } from "../../shared/intervention";
import { buildLibraryIntervention } from "../../shared/library";

export type InterventionResult = { kind: "intervention"; intervention: Intervention };

/**
 * Ask the server for an intervention. The response is validated against the
 * shared contract. If the server can't be reached or replies with something
 * unexpected, a complete response is built from the local library instead,
 * so the user always gets a thought and an action.
 */
export async function requestIntervention(req: CheckInRequest, signal?: AbortSignal): Promise<InterventionResult> {
  try {
    const res = await fetch("/api/intervention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    if (res.ok) {
      const body = await res.json();
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
