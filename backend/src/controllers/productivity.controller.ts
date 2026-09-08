import { Request, Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const ProductivityController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const { startDate, endDate } = req.query;
    const where: any = { userId: req.user.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    const logs = await prisma.productivityLog.findMany({ where, orderBy: { date: "desc" } });
    res.json({ success: true, data: logs });
  }),

  createOrUpdate: asyncHandler(async (req: any, res: Response) => {
    const { pomodoroSessions, tasksCompleted, focusTimeMinutes, interruptions, workHours, learningHours, screenTimeMinutes, deepWorkScore } = req.body;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const existing = await prisma.productivityLog.findFirst({ where: { userId: req.user.id, date: { gte: today, lt: tomorrow } } });
    let log;
    if (existing) {
      log = await prisma.productivityLog.update({
        where: { id: existing.id },
        data: { pomodoroSessions: existing.pomodoroSessions + (pomodoroSessions || 0), tasksCompleted: existing.tasksCompleted + (tasksCompleted || 0), focusTimeMinutes: existing.focusTimeMinutes + (focusTimeMinutes || 0), interruptions: existing.interruptions + (interruptions || 0), workHours, learningHours, screenTimeMinutes, deepWorkScore },
      });
    } else {
      log = await prisma.productivityLog.create({ data: { userId: req.user.id, pomodoroSessions: pomodoroSessions || 0, tasksCompleted: tasksCompleted || 0, focusTimeMinutes: focusTimeMinutes || 0, interruptions: interruptions || 0, workHours, learningHours, screenTimeMinutes, deepWorkScore } });
    }
    res.status(201).json({ success: true, data: log });
  }),

  getStats: asyncHandler(async (req: any, res: Response) => {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await prisma.productivityLog.findMany({ where: { userId: req.user.id, date: { gte: thirtyDaysAgo } }, orderBy: { date: "asc" } });
    if (logs.length === 0) return res.json({ success: true, data: null });
    const totalPomodoro = logs.reduce((s, l) => s + l.pomodoroSessions, 0);
    const totalTasks = logs.reduce((s, l) => s + l.tasksCompleted, 0);
    const totalFocusTime = logs.reduce((s, l) => s + l.focusTimeMinutes, 0);
    const avgDeepWork = logs.filter((l) => l.deepWorkScore).reduce((s, l) => s + (l.deepWorkScore || 0), 0) / logs.filter((l) => l.deepWorkScore).length || 0;
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekLogs = logs.filter((l) => l.date >= weekStart && l.date < weekEnd);
      if (weekLogs.length > 0) weeklyData.unshift({ week: `Week ${4 - i}`, pomodoro: weekLogs.reduce((s, l) => s + l.pomodoroSessions, 0), tasks: weekLogs.reduce((s, l) => s + l.tasksCompleted, 0), focusTime: weekLogs.reduce((s, l) => s + l.focusTimeMinutes, 0) });
    }
    const recentStress = await prisma.moodLog.findMany({ where: { userId: req.user.id, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
    const avgRecentStress = recentStress.length > 0 ? recentStress.reduce((s, l) => s + l.stress, 0) / recentStress.length : 5;
    const avgRecentSleep = recentStress.filter((l) => l.sleepHours).length > 0 ? recentStress.filter((l) => l.sleepHours).reduce((s, l) => s + (l.sleepHours || 0), 0) / recentStress.filter((l) => l.sleepHours).length : 7;
    let burnoutRisk = "low";
    if (avgRecentStress > 7 && avgRecentSleep < 6) burnoutRisk = "high";
    else if (avgRecentStress > 5 || avgRecentSleep < 6) burnoutRisk = "moderate";
    res.json({ success: true, data: { totalPomodoro, totalTasks, totalFocusTime, avgDeepWork: avgDeepWork.toFixed(1), weeklyData, burnoutRisk, focusSuggestions: ProductivityController.generateFocusSuggestions(burnoutRisk, avgRecentStress) } });
  }),

  generateFocusSuggestions(burnoutRisk: string, avgStress: number): string[] {
    const suggestions = [];
    if (burnoutRisk === "high") { suggestions.push("Your stress levels are elevated. Consider taking a full day off."); suggestions.push("Try the 4-7-8 breathing technique before starting work."); }
    else if (burnoutRisk === "moderate") { suggestions.push("Take a 10-minute walk between work sessions."); suggestions.push("Consider reducing your daily task list by 20%."); }
    if (avgStress > 6) suggestions.push("Schedule a 5-minute meditation before your most challenging task.");
    if (suggestions.length === 0) { suggestions.push("Your productivity patterns look healthy! Keep up the good work."); suggestions.push("Try increasing your deep work blocks by 5 minutes."); }
    return suggestions;
  },
};
