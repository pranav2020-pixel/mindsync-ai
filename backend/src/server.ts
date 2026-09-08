import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: "Too many authentication attempts. Please try again later." },
});
app.use("/api/v1/auth/", authLimiter);

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", routes);
app.use((req, res) => { res.status(404).json({ error: "Endpoint not found" }); });
app.use(errorHandler);

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`MindSync API running on port ${PORT}`);
});

export default app;
