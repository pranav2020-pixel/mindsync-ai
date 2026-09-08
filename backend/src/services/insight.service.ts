import { prisma } from "../server";
import { AIService } from "./ai.service";

export class InsightService {
  static async generateUserInsights(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [moodLogs, productivityLogs, journalEntries, habitLogs] = await Promise.all([
      prisma.moodLog.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, orderBy: { date: "asc" } }),
      prisma.productivityLog.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, orderBy: { date: "asc" } }),
      prisma.journalEntry.findMany({ where: { userId, createdAt: { gte: thirtyDaysAgo } }, include: { aiAnalysis: true }, orderBy: { createdAt: "asc" } }),
      prisma.habitLog.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, orderBy: { date: "asc" } }),
    ]);

    const avgMood = moodLogs.length > 0 ? moodLogs.reduce((sum, log) => sum + log.mood, 0) / moodLogs.length : 5;
    const avgSleep = moodLogs.filter((l) => l.sleepHours).length > 0 ? moodLogs.filter((l) => l.sleepHours).reduce((sum, l) => sum + (l.sleepHours || 0), 0) / moodLogs.filter((l) => l.sleepHours).length : 7;
    const exerciseDays = moodLogs.filter((l) => l.exercise).length;
    const exerciseRate = moodLogs.length > 0 ? (exerciseDays / moodLogs.length) * 100 : 0;
    const deepWorkLogs = productivityLogs.filter((l) => l.deepWorkScore != null);
    const avgProductivity = deepWorkLogs.length > 0 ? deepWorkLogs.reduce((sum, log) => sum + (log.deepWorkScore || 0), 0) / deepWorkLogs.length : 5;

    const userData = {
      avgMood: avgMood.toFixed(1), avgSleep: avgSleep.toFixed(1),
      exerciseRate: exerciseRate.toFixed(0), avgProductivity: avgProductivity.toFixed(1),
      journalCount: journalEntries.length, habitStreak: this.calculateHabitStreak(habitLogs),
      moodTrend: this.calculateTrend(moodLogs.map((l) => l.mood)),
      stressTrend: this.calculateTrend(moodLogs.map((l) => l.stress)),
    };

    const aiInsights = await AIService.generateInsights(userData);
    const validInsightTypes = new Set([
      "MOOD_PATTERN", "PRODUCTIVITY_CORRELATION", "SLEEP_IMPACT", "EXERCISE_IMPACT",
      "STRESS_PATTERN", "BURNOUT_RISK", "HABIT_STREAK", "JOURNALING_BENEFIT",
      "SOCIAL_IMPACT", "CUSTOM"
    ]);

    const savedInsights = await Promise.all(
      aiInsights.map((insight: any) => {
        const typeKey = (insight.type || "CUSTOM").toUpperCase().replace(/[\s-]/g, "_");
        const safeType = validInsightTypes.has(typeKey) ? typeKey : "CUSTOM";
        return prisma.aIInsight.create({
          data: {
            userId,
            type: safeType as any,
            title: insight.title || "Wellness Insight",
            description: insight.description || "Daily logging helps uncover personal wellness trends.",
            confidence: typeof insight.confidence === "number" ? insight.confidence : 0.8,
            dataPoints: userData,
          },
        });
      })
    );
    return savedInsights;
  }

  private static calculateHabitStreak(habitLogs: any[]): number {
    if (habitLogs.length === 0) return 0;
    const sorted = [...habitLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const log of sorted) {
      const logDate = new Date(log.date); logDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === streak && log.completed) streak++;
      else if (diffDays > streak) break;
    }
    return streak;
  }

  private static calculateTrend(values: number[]): "improving" | "declining" | "stable" {
    if (values.length < 7) return "stable";
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 0.5) return "improving";
    if (diff < -0.5) return "declining";
    return "stable";
  }
}
