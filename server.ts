import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { getIntervention } from "./server/gemini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/intervention", async (req, res) => {
    const { mood } = req.body ?? {};
    if (typeof mood !== "string" || !mood.trim() || mood.length > 100) {
      return res.status(400).json({ error: "mood must be a non-empty string of at most 100 characters" });
    }
    res.json(await getIntervention(mood.trim()));
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
