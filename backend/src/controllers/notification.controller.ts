import { Response } from "express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const NotificationController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ success: true, data: notifications });
  }),

  markAsRead: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!notification) throw new AppError("Notification not found", 404);

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true, data: updated });
  }),

  markAllAsRead: asyncHandler(async (req: any, res: Response) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: "All notifications marked as read" });
  }),

  clearAll: asyncHandler(async (req: any, res: Response) => {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ success: true, message: "Notifications cleared" });
  }),
};
