import { Request, Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const HabitController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [logs, customHabits, achievements] = await Promise.all([
      prisma.habitLog.findMany({
        where: { userId: req.user.id, date: targetDate },
        include: { customHabit: true },
      }),
      prisma.customHabit.findMany({
        where: { userId: req.user.id, isActive: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId: req.user.id },
        include: { achievement: true },
      }),
    ]);

    const habitTypes = ["MEDITATION", "EXERCISE", "WATER", "SLEEP", "READING", "LEARNING", "JOURNALING"];
    const standardStreaks = await Promise.all(
      habitTypes.map(async (type) => {
        const typeLogs = await prisma.habitLog.findMany({
          where: { userId: req.user.id, habitType: type as any },
          orderBy: { date: "desc" },
          take: 30,
        });
        return { type, streak: HabitController.calculateStreak(typeLogs) };
      })
    );

    const customStreaks = await Promise.all(
      customHabits.map(async (ch) => {
        const chLogs = await prisma.habitLog.findMany({
          where: { userId: req.user.id, customHabitId: ch.id },
          orderBy: { date: "desc" },
          take: 30,
        });
        return { type: ch.id, streak: HabitController.calculateStreak(chLogs) };
      })
    );

    res.json({
      success: true,
      data: {
        logs,
        customHabits,
        streaks: [...standardStreaks, ...customStreaks],
        achievements,
      },
    });
  }),

  createOrUpdate: asyncHandler(async (req: any, res: Response) => {
    const { habitType, customHabitId, date, completed, value, notes } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const resolvedHabitType = habitType || (customHabitId ? "CUSTOM" : null);
    if (!resolvedHabitType) {
      throw new AppError("habitType or customHabitId is required", 400);
    }

    const whereClause: any = {
      userId: req.user.id,
      date: targetDate,
    };

    if (customHabitId) {
      whereClause.customHabitId = customHabitId;
    } else {
      whereClause.habitType = resolvedHabitType;
    }

    const existing = await prisma.habitLog.findFirst({ where: whereClause });
    const xpEarned = completed ? (resolvedHabitType === "EXERCISE" ? 20 : 10) : 0;

    let log;
    if (existing) {
      log = await prisma.habitLog.update({
        where: { id: existing.id },
        data: { completed, value, notes, xpEarned },
      });
    } else {
      log = await prisma.habitLog.create({
        data: {
          userId: req.user.id,
          habitType: resolvedHabitType,
          customHabitId: customHabitId || null,
          date: targetDate,
          completed,
          value,
          notes,
          xpEarned,
        },
      });
    }

    res.json({ success: true, data: log });
  }),

  createCustomHabit: asyncHandler(async (req: any, res: Response) => {
    const { name, description, icon, color, targetPerDay, unit } = req.body;
    if (!name || !name.trim()) {
      throw new AppError("Habit name is required", 400);
    }

    const habit = await prisma.customHabit.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "Target",
        color: color || "#38bdf8",
        targetPerDay: targetPerDay ? Number(targetPerDay) : 1,
        unit: unit || "times",
      },
    });

    res.status(201).json({ success: true, data: habit });
  }),

  deleteCustomHabit: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    await prisma.customHabit.deleteMany({
      where: { id, userId: req.user.id },
    });
    await prisma.habitLog.deleteMany({
      where: { customHabitId: id, userId: req.user.id },
    });
    res.json({ success: true, message: "Custom habit removed successfully" });
  }),

  getStats: asyncHandler(async (req: any, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.habitLog.findMany({
      where: { userId: req.user.id, date: { gte: thirtyDaysAgo } },
    });

    const totalXP = logs.reduce((sum, log) => sum + log.xpEarned, 0);
    const completionRate =
      logs.length > 0
        ? (logs.filter((l) => l.completed).length / logs.length) * 100
        : 0;

    res.json({
      success: true,
      data: {
        totalXP,
        completionRate: completionRate.toFixed(1),
        totalLogs: logs.length,
      },
    });
  }),

  calculateStreak(logs: any[]): number {
    if (logs.length === 0) return 0;
    const sorted = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const log of sorted) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === streak && log.completed) streak++;
      else if (diffDays > streak) break;
    }
    return streak;
  },
};
