import { Request, Response } from "express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { InsightService } from "../services/insight.service";

export const InsightController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const { unreadOnly, limit = 20 } = req.query;
    const where: any = { userId: req.user.id };
    if (unreadOnly === "true") where.isRead = false;
    const insights = await prisma.aIInsight.findMany({ where, orderBy: { generatedAt: "desc" }, take: Number(limit) });
    res.json({ success: true, data: insights });
  }),

  generate: asyncHandler(async (req: any, res: Response) => {
    const insights = await InsightService.generateUserInsights(req.user.id);
    res.json({ success: true, data: insights });
  }),

  markAsRead: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    await prisma.aIInsight.updateMany({ where: { id, userId: req.user.id }, data: { isRead: true } });
    res.json({ success: true });
  }),

  togglePin: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const insight = await prisma.aIInsight.findFirst({ where: { id, userId: req.user.id } });
    if (!insight) return res.status(404).json({ success: false, error: "Not found" });
    await prisma.aIInsight.update({ where: { id }, data: { isPinned: !insight.isPinned } });
    res.json({ success: true });
  }),
};
