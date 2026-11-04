// Client wrapper: Gemini is called by the Express server (server/gemini.ts) so the API key stays server-side.
export async function getIntervention(mood: string) {
  const res = await fetch("/api/intervention", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mood }),
  });
  if (!res.ok) throw new Error(`Intervention request failed: ${res.status}`);
  return res.json();
}
