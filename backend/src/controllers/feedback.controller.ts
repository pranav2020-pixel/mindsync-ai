import { Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const FeedbackController = {
  create: asyncHandler(async (req: any, res: Response) => {
    const { type, title, description } = req.body;

    if (!title || !title.trim()) {
      throw new AppError("Please provide a short title for your issue or suggestion", 400);
    }
    if (!description || !description.trim()) {
      throw new AppError("Please provide a description with details", 400);
    }

    const cleanType = (type || "SUGGESTION").toUpperCase();
    const validTypes = ["BUG", "SUGGESTION", "FEEDBACK", "OTHER"];
    const finalType = validTypes.includes(cleanType) ? cleanType : "SUGGESTION";

    const feedback = await (prisma as any).feedback.create({
      data: {
        userId: req.user?.id || null,
        userName: req.user?.name || "MindSync User",
        userEmail: req.user?.email || null,
        type: finalType,
        title: title.trim(),
        description: description.trim(),
        status: "OPEN",
      },
    });

    res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been sent directly to the creator.",
      data: feedback,
    });
  }),
};
