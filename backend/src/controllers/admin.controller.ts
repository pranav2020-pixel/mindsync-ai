import { Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const getAdminEmail = () => (process.env.ADMIN_EMAIL || "pranavmsc2020@gmail.com").trim().toLowerCase();

export const AdminController = {
  getAnalytics: asyncHandler(async (req: any, res: Response) => {
    const adminEmail = getAdminEmail();
    const userEmail = (req.user?.email || "").trim().toLowerCase();

    // Verify admin access
    if (req.user?.role !== "ADMIN" && userEmail !== adminEmail) {
      throw new AppError("Access denied. Administrator privileges required.", 403);
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Total User Metrics
    const [totalUsers, verifiedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isEmailVerified: true } }),
    ]);

    // 2. Active User Calculations (DAU, WAU, MAU)
    // A user is considered active if they have logged in (Session) or created a log (mood, journal, habit, chat)
    const [
      dauSessions, dauMoods, dauJournals, dauHabits, dauChats,
      wauSessions, wauMoods, wauJournals, wauHabits,
      mauSessions, mauMoods, mauJournals, mauHabits,
    ] = await Promise.all([
      prisma.session.findMany({ where: { createdAt: { gte: oneDayAgo } }, select: { userId: true } }),
      prisma.moodLog.findMany({ where: { date: { gte: oneDayAgo } }, select: { userId: true } }),
      prisma.journalEntry.findMany({ where: { createdAt: { gte: oneDayAgo } }, select: { userId: true } }),
      prisma.habitLog.findMany({ where: { date: { gte: oneDayAgo } }, select: { userId: true } }),
      prisma.chatMessage.findMany({ where: { createdAt: { gte: oneDayAgo }, role: "USER" }, select: { userId: true } }),

      prisma.session.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { userId: true } }),
      prisma.moodLog.findMany({ where: { date: { gte: sevenDaysAgo } }, select: { userId: true } }),
      prisma.journalEntry.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { userId: true } }),
      prisma.habitLog.findMany({ where: { date: { gte: sevenDaysAgo } }, select: { userId: true } }),

      prisma.session.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { userId: true } }),
      prisma.moodLog.findMany({ where: { date: { gte: thirtyDaysAgo } }, select: { userId: true } }),
      prisma.journalEntry.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { userId: true } }),
      prisma.habitLog.findMany({ where: { date: { gte: thirtyDaysAgo } }, select: { userId: true } }),
    ]);

    const dauUserIds = new Set<string>([
      ...dauSessions.map((s) => s.userId),
      ...dauMoods.map((m) => m.userId),
      ...dauJournals.map((j) => j.userId),
      ...dauHabits.map((h) => h.userId),
      ...dauChats.map((c) => c.userId),
    ]);

    const wauUserIds = new Set<string>([
      ...wauSessions.map((s) => s.userId),
      ...wauMoods.map((m) => m.userId),
      ...wauJournals.map((j) => j.userId),
      ...wauHabits.map((h) => h.userId),
    ]);

    const mauUserIds = new Set<string>([
      ...mauSessions.map((s) => s.userId),
      ...mauMoods.map((m) => m.userId),
      ...mauJournals.map((j) => j.userId),
      ...mauHabits.map((h) => h.userId),
    ]);

    // 3. Overall Content & Engagement Numbers
    const [totalJournals, totalMoodLogs, totalHabitsCompleted, totalChatMessages, totalAssessments] = await Promise.all([
      prisma.journalEntry.count(),
      prisma.moodLog.count(),
      prisma.habitLog.count({ where: { completed: true } }),
      prisma.chatMessage.count({ where: { role: "USER" } }),
      prisma.assessmentResult.count(),
    ]);

    // 4. Daily Signups & Activity for the past 14 days (Timeline Chart)
    const recentSignupsRaw = await prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    });

    const dayFormatter = (d: Date) => d.toISOString().split("T")[0];
    const timeline: Array<{ date: string; label: string; newUsers: number }> = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = dayFormatter(d);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
      const count = recentSignupsRaw.filter((u) => dayFormatter(new Date(u.createdAt)) === dateKey).length;
      timeline.push({
        date: dateKey,
        label: dayName,
        newUsers: count,
      });
    }

    // 5. Recent Registered Users List (up to 30)
    const recentUsers = await prisma.user.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        authProvider: true,
        createdAt: true,
        _count: {
          select: {
            journals: true,
            moodLogs: true,
            habits: true,
            chatMessages: true,
          },
        },
      },
    });

    const [totalFeedbacks, openFeedbacks] = await Promise.all([
      (prisma as any).feedback.count().catch(() => 0),
      (prisma as any).feedback.count({ where: { status: "OPEN" } }).catch(() => 0),
    ]);

    res.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers: Math.max(0, totalUsers - verifiedUsers),
          dailyActiveUsers: dauUserIds.size,
          weeklyActiveUsers: wauUserIds.size,
          monthlyActiveUsers: mauUserIds.size,
          totalJournals,
          totalMoodLogs,
          totalHabitsCompleted,
          totalChatMessages,
          totalAssessments,
          totalFeedbacks,
          openFeedbacks,
        },
        timeline,
        recentUsers,
      },
    });
  }),

  getFeedbacks: asyncHandler(async (req: any, res: Response) => {
    const adminEmail = getAdminEmail();
    const userEmail = (req.user?.email || "").trim().toLowerCase();
    if (req.user?.role !== "ADMIN" && userEmail !== adminEmail) {
      throw new AppError("Access denied. Administrator privileges required.", 403);
    }

    const feedbacks = await (prisma as any).feedback.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    res.json({ success: true, data: feedbacks });
  }),

  updateFeedbackStatus: asyncHandler(async (req: any, res: Response) => {
    const adminEmail = getAdminEmail();
    const userEmail = (req.user?.email || "").trim().toLowerCase();
    if (req.user?.role !== "ADMIN" && userEmail !== adminEmail) {
      throw new AppError("Access denied. Administrator privileges required.", 403);
    }

    const { id } = req.params;
    const { status } = req.body;
    const updated = await (prisma as any).feedback.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: updated });
  }),

  deleteFeedback: asyncHandler(async (req: any, res: Response) => {
    const adminEmail = getAdminEmail();
    const userEmail = (req.user?.email || "").trim().toLowerCase();
    if (req.user?.role !== "ADMIN" && userEmail !== adminEmail) {
      throw new AppError("Access denied. Administrator privileges required.", 403);
    }

    const { id } = req.params;
    await (prisma as any).feedback.delete({ where: { id } });

    res.json({ success: true, message: "Feedback deleted successfully" });
  }),
};
