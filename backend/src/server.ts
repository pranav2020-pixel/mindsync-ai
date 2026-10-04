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

    // Ensure feedbacks table exists in PostgreSQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "feedbacks" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT,
        "userName" TEXT,
        "userEmail" TEXT,
        "type" TEXT NOT NULL DEFAULT 'SUGGESTION',
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((err) => console.warn("Feedback table auto-init:", err));
    
    // Auto-seed assessments
    await ensureAssessmentsSeeded(prisma);

    // Auto-seed or update demo user
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 12);
    await prisma.user.upsert({
      where: { email: "demo@mindsync.ai" },
      update: { password: hashedPassword, isEmailVerified: true },
      create: {
        email: "demo@mindsync.ai",
        password: hashedPassword,
        name: "Alex Chen",
        role: "USER" as any,
        isEmailVerified: true,
        wellnessGoals: ["Reduce stress", "Improve sleep", "Mindful journaling"],
        productivityGoals: ["Consistent morning routine"],
      },
    });
    console.log("✅ Demo user verified / seeded!");

    // Clean up any bogus test accounts created without valid email format (e.g. vasu@12)
    try {
      const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      for (const u of allUsers) {
        if (!emailRegex.test(u.email) && u.email !== "demo@mindsync.ai") {
          await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
          console.log(`Cleaned up invalid user account: ${u.email}`);
        }
      }
    } catch (cleanErr) {
      console.warn("Cleanup check skipped:", cleanErr);
    }
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
