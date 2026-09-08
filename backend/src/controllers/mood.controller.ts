import { Request, Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const MoodController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const { startDate, endDate, limit = 100 } = req.query;
    const where: any = { userId: req.user.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    const logs = await prisma.moodLog.findMany({ where, orderBy: { date: "desc" }, take: Number(limit) });
    res.json({ success: true, data: logs });
  }),

  getToday: asyncHandler(async (req: any, res: Response) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const log = await prisma.moodLog.findFirst({ where: { userId: req.user.id, date: { gte: today, lt: tomorrow } } });
    res.json({ success: true, data: log });
  }),

  create: asyncHandler(async (req: any, res: Response) => {
    const { mood, energy, stress, focus, sleepHours, exercise, exerciseMinutes, waterIntake, socialInteraction, notes } = req.body;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const existing = await prisma.moodLog.findFirst({ where: { userId: req.user.id, date: { gte: today, lt: tomorrow } } });
    let log;
    if (existing) {
      log = await prisma.moodLog.update({ where: { id: existing.id }, data: { mood, energy, stress, focus, sleepHours, exercise, exerciseMinutes, waterIntake, socialInteraction, notes } });
    } else {
      log = await prisma.moodLog.create({ data: { userId: req.user.id, mood, energy, stress, focus, sleepHours, exercise, exerciseMinutes, waterIntake, socialInteraction, notes } });
    }
    res.status(201).json({ success: true, data: log });
  }),

  getStats: asyncHandler(async (req: any, res: Response) => {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await prisma.moodLog.findMany({ where: { userId: req.user.id, date: { gte: thirtyDaysAgo } }, orderBy: { date: "asc" } });
    if (logs.length === 0) return res.json({ success: true, data: null });
    const avgMood = logs.reduce((s, l) => s + l.mood, 0) / logs.length;
    const avgEnergy = logs.reduce((s, l) => s + l.energy, 0) / logs.length;
    const avgStress = logs.reduce((s, l) => s + l.stress, 0) / logs.length;
    const avgSleep = logs.filter((l) => l.sleepHours).reduce((s, l) => s + (l.sleepHours || 0), 0) / logs.filter((l) => l.sleepHours).length || 0;
    const exerciseDays = logs.filter((l) => l.exercise).length;
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekLogs = logs.filter((l) => l.date >= weekStart && l.date < weekEnd);
      if (weekLogs.length > 0) {
        weeklyData.unshift({ week: `Week ${4 - i}`, mood: weekLogs.reduce((s, l) => s + l.mood, 0) / weekLogs.length, energy: weekLogs.reduce((s, l) => s + l.energy, 0) / weekLogs.length, stress: weekLogs.reduce((s, l) => s + l.stress, 0) / weekLogs.length });
      }
    }
    res.json({ success: true, data: { avgMood: avgMood.toFixed(1), avgEnergy: avgEnergy.toFixed(1), avgStress: avgStress.toFixed(1), avgSleep: avgSleep.toFixed(1), exerciseDays, totalEntries: logs.length, weeklyData, timeline: logs.map((l) => ({ date: l.date, mood: l.mood, energy: l.energy, stress: l.stress })) } });
  }),
};
