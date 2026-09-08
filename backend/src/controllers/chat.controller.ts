import { Request, Response } from "express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { AIService } from "../services/ai.service";

export const ChatController = {
  getHistory: asyncHandler(async (req: any, res: Response) => {
    const messages = await prisma.chatMessage.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" }, take: 50 });
    res.json({ success: true, data: messages });
  }),

  sendMessage: asyncHandler(async (req: any, res: Response) => {
    const { content } = req.body;
    await prisma.chatMessage.create({ data: { userId: req.user.id, role: "USER", content } });
    const history = await prisma.chatMessage.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" }, take: 20 });
    const formattedHistory = history.map((msg) => ({ role: msg.role.toLowerCase() as "user" | "assistant" | "system", content: msg.content }));
    const aiResponse = await AIService.generateChatResponse(formattedHistory, req.user);
    const savedMessage = await prisma.chatMessage.create({
      data: { userId: req.user.id, role: "ASSISTANT", content: aiResponse.content, metadata: { crisisDetected: aiResponse.crisisDetected } },
    });
    res.json({ success: true, data: savedMessage, crisisDetected: aiResponse.crisisDetected });
  }),

  clearHistory: asyncHandler(async (req: any, res: Response) => {
    await prisma.chatMessage.deleteMany({ where: { userId: req.user.id } });
    res.json({ success: true, message: "Chat history cleared" });
  }),
};
