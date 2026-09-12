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

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

const isDev = process.env.NODE_ENV === "development";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", routes);
app.use((req, res) => { res.status(404).json({ error: "Endpoint not found" }); });
app.use(errorHandler);

import { ensureAssessmentsSeeded } from "./utils/seedData";

const initApp = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    // Auto-seed assessments
    await ensureAssessmentsSeeded(prisma);

    // Auto-seed or update demo user
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 12);
    await prisma.user.upsert({
      where: { email: "demo@mindsync.ai" },
      update: { password: hashedPassword },
      create: {
        email: "demo@mindsync.ai",
        password: hashedPassword,
        name: "Alex Chen",
        role: "USER" as any,
        wellnessGoals: ["Reduce stress", "Improve sleep", "Mindful journaling"],
        productivityGoals: ["Consistent morning routine"],
      },
    });
    console.log("✅ Demo user verified / seeded!");
  } catch (e) {
    console.error("⚠️ Database connection / init error:", e);
  }
};
initApp();

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  if (redis) await redis.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`MindSync API running on port ${PORT}`);
});

export default app;
