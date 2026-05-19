import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);
  const { default: recommendHandler } = await import("./api/recommend.js");

  return {
    plugins: [
      react(),
      {
        name: "api-dev-middleware",
        configureServer(server) {
          server.middlewares.use("/api/recommend", async (req, res, next) => {
            if (req.method !== "POST") return next();
            try {
              let raw = "";
              for await (const chunk of req) raw += chunk;
              req.body = raw ? JSON.parse(raw) : {};
              await recommendHandler(req, res);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        },
      },
    ],
  };
});
