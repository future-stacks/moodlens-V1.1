import "dotenv/config";
import express from "express";
import path from "path";
import { createApp } from "./server/app";

async function startServer() {
  const production = process.env.NODE_ENV === "production";
  const app = createApp({ production });
  const PORT = Number(process.env.PORT) || 3000;

  if (!production) {
    // Vite is a dev dependency, so it is only loaded in development.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Hashed assets can be cached forever; index.html must always be revalidated.
    app.use("/assets", express.static(path.join(distPath, "assets"), { immutable: true, maxAge: "1y" }));
    app.use(express.static(distPath, { index: false, maxAge: 0 }));
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (production && !process.env.GEMINI_API_KEY) {
    console.warn(JSON.stringify({ level: "warn", msg: "GEMINI_API_KEY not set; serving built-in library suggestions only" }));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(JSON.stringify({ level: "info", msg: "server_started", port: PORT, production }));
  });
}

startServer();
