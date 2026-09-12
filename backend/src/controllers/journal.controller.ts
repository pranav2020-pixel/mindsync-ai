import { Request, Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { encrypt, decrypt } from "../utils/encryption";
import { AIService } from "../services/ai.service";

export const JournalController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const { page = 1, limit = 10, tag, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId: req.user.id };
    if (tag) where.tags = { has: tag as string };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({ where, include: { aiAnalysis: true }, orderBy: { date: "desc" }, skip, take: Number(limit) }),
      prisma.journalEntry.count({ where }),
    ]);
    const decrypted = entries.map((entry) => ({ ...entry, content: entry.contentIv ? decrypt(entry.content, entry.contentIv) : entry.content }));
    res.json({ success: true, data: decrypted, meta: { page: Number(page), limit: Number(limit), total } });
  }),

  getById: asyncHandler(async (req: any, res: Response) => {
    const entry = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: { aiAnalysis: true } });
    if (!entry) throw new AppError("Journal entry not found", 404);
    res.json({ success: true, data: { ...entry, content: entry.contentIv ? decrypt(entry.content, entry.contentIv) : entry.content } });
  }),

  create: asyncHandler(async (req: any, res: Response) => {
    const { title, content, tags, mood, energy, stress, sleepHours, productivityRating } = req.body;
    const cleanContent = (content || title || "").trim();
    if (!cleanContent) {
      throw new AppError("Journal content cannot be empty", 400);
    }
    const cleanTitle = (title || "").trim() || cleanContent.slice(0, 40).replace(/[\r\n]+/g, " ") + (cleanContent.length > 40 ? "..." : "");
    const { encrypted, iv } = encrypt(cleanContent);
    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.user.id,
        title: cleanTitle,
        content: encrypted,
        contentIv: iv,
        tags: Array.isArray(tags) ? tags : [],
        mood: Number(mood) || 7,
        energy: Number(energy) || 6,
        stress: Number(stress) || 4,
        sleepHours: sleepHours !== undefined && sleepHours !== null ? Number(sleepHours) : null,
        productivityRating: productivityRating ? Number(productivityRating) : null,
      },
    });
    const aiAnalysis = await AIService.analyzeJournal(cleanContent);
    await prisma.journalAIAnalysis.create({
      data: {
        journalId: entry.id, sentiment: aiAnalysis.sentiment, sentimentScore: aiAnalysis.sentimentScore,
        emotions: aiAnalysis.emotions, stressLevel: aiAnalysis.stressLevel, optimismScore: aiAnalysis.optimismScore,
        anxietyIndicators: aiAnalysis.anxietyIndicators, burnoutRisk: aiAnalysis.burnoutRisk,
        suggestedActivities: aiAnalysis.suggestedActivities, motivationalSummary: aiAnalysis.motivationalSummary,
        aiReflection: aiAnalysis.aiReflection,
      },
    });
    const recommendations = await AIService.generateRecommendations({ mood, energy, stress });
    const validRecTypes = new Set([
      "MEDITATION", "STRETCHING", "WALKING", "READING", "MUSIC", "BREATHING",
      "HYDRATION", "CREATIVE", "DIGITAL_DETOX", "GRATITUDE", "SLEEP_HYGIENE", "SOCIAL"
    ]);
    const validDifficulties = new Set(["easy", "medium", "hard"]);

    await Promise.all(recommendations.map((rec: any) => {
      const typeKey = (rec.type || "BREATHING").toUpperCase().replace(/[\s-]/g, "_");
      const safeType = validRecTypes.has(typeKey) ? typeKey : "BREATHING";
      const diffKey = (rec.difficulty || "easy").toLowerCase();
      const safeDiff = validDifficulties.has(diffKey) ? diffKey : "easy";

      return prisma.recommendation.create({
        data: {
          userId: req.user.id,
          type: safeType as any,
          title: rec.title || "Wellness Practice",
          description: rec.description || "A mindful wellness moment.",
          why: rec.why || "Supports your current mental state.",
          duration: rec.duration || "5 min",
          benefits: Array.isArray(rec.benefits) ? rec.benefits : ["Promotes well-being"],
          difficulty: safeDiff,
        },
      });
    }));
    res.status(201).json({ success: true, data: { ...entry, content, aiAnalysis } });
  }),

  update: asyncHandler(async (req: any, res: Response) => {
    const { title, content, tags, mood, energy, stress, sleepHours, productivityRating } = req.body;
    const existing = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) throw new AppError("Journal entry not found", 404);
    const updateData: any = { title, tags, mood, energy, stress, sleepHours, productivityRating };
    if (content) { const { encrypted, iv } = encrypt(content); updateData.content = encrypted; updateData.contentIv = iv; }
    const entry = await prisma.journalEntry.update({ where: { id: req.params.id }, data: updateData, include: { aiAnalysis: true } });
    res.json({ success: true, data: { ...entry, content: content || (entry.contentIv ? decrypt(entry.content, entry.contentIv) : entry.content) } });
  }),

  delete: asyncHandler(async (req: any, res: Response) => {
    const existing = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) throw new AppError("Journal entry not found", 404);
    await prisma.journalEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Journal entry deleted" });
  }),

  getStats: asyncHandler(async (req: any, res: Response) => {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [totalEntries, recentEntries, streak] = await Promise.all([
      prisma.journalEntry.count({ where: { userId: req.user.id } }),
      prisma.journalEntry.count({ where: { userId: req.user.id, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.journalEntry.findMany({ where: { userId: req.user.id }, orderBy: { date: "desc" }, take: 30, select: { date: true } }),
    ]);
    let currentStreak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dates = [...new Set(streak.map((e) => new Date(e.date).toDateString()))].map((d) => new Date(d));
    dates.sort((a, b) => b.getTime() - a.getTime());
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today); expectedDate.setDate(expectedDate.getDate() - i);
      if (dates[i].toDateString() === expectedDate.toDateString()) currentStreak++;
      else break;
    }
    res.json({ success: true, data: { totalEntries, recentEntries, currentStreak } });
  }),
};
