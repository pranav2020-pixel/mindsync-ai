import { Router } from "express";
import authRoutes from "./auth.routes";
import journalRoutes from "./journal.routes";
import moodRoutes from "./mood.routes";
import habitRoutes from "./habit.routes";
import productivityRoutes from "./productivity.routes";
import assessmentRoutes from "./assessment.routes";
import chatRoutes from "./chat.routes";
import insightRoutes from "./insight.routes";
import reportRoutes from "./report.routes";
import notificationRoutes from "./notification.routes";

import { prisma } from "../server";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: "ok",
      database: "connected",
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: err.message,
      stack: err.stack,
    });
  }
});

router.use("/auth", authRoutes);
router.use("/journals", journalRoutes);
router.use("/moods", moodRoutes);
router.use("/habits", habitRoutes);
router.use("/productivity", productivityRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/chat", chatRoutes);
router.use("/insights", insightRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
export default router;
