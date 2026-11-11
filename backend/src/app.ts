import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
import { csrfGuard } from "./middlewares/security";
import routes from "./routes";
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);
app.use(
  helmet({
    referrerPolicy: { policy: "no-referrer" },
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "https:"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
      },
    },
  }),
);
app.use(
  cors({
    origin: new URL(env.publicAppUrl).origin,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-App-Request", "Idempotency-Key"],
  }),
);
app.use(requestLogger);
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(csrfGuard);
app.use(express.json({ limit: "16kb", inflate: false }));
app.use("/api", routes);
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Recurso não encontrado." });
});
if (process.env.SERVE_FRONTEND === "true") {
  const dist = path.resolve(__dirname, "../../dist");
  app.use(express.static(dist, { index: false }));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}
app.use(errorHandler);
export default app;
