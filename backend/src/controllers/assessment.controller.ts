import { Request, Response } from "express";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { AIService } from "../services/ai.service";

import { ensureAssessmentsSeeded } from "../utils/seedData";

export const AssessmentController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    let assessments = await prisma.assessment.findMany({
      where: { isActive: true },
      include: { _count: { select: { questions: true } }, results: { where: { userId: req.user.id }, orderBy: { takenAt: "desc" }, take: 1 } },
    });

    if (assessments.length === 0) {
      await ensureAssessmentsSeeded(prisma);
      assessments = await prisma.assessment.findMany({
        where: { isActive: true },
        include: { _count: { select: { questions: true } }, results: { where: { userId: req.user.id }, orderBy: { takenAt: "desc" }, take: 1 } },
      });
    }

    res.json({ success: true, data: assessments });
  }),

  getQuestions: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const assessment = await prisma.assessment.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } } } });
    if (!assessment) throw new AppError("Assessment not found", 404);
    res.json({ success: true, data: assessment });
  }),

  submit: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { answers } = req.body;
    const assessment = await prisma.assessment.findUnique({ where: { id }, include: { questions: true } });
    if (!assessment) throw new AppError("Assessment not found", 404);
    const scores: any = {}; let totalScore = 0;
    assessment.questions.forEach((q) => {
      const answer = answers.find((a: any) => a.questionId === q.id);
      if (!answer) return;
      let value = answer.value;
      if (q.reverseScored) { const maxOption = Math.max(...(q.options as any[]).map((o: any) => o.value)); value = maxOption + 1 - value; }
      totalScore += value;
      if (q.category) { if (!scores[q.category]) scores[q.category] = { sum: 0, count: 0 }; scores[q.category].sum += value; scores[q.category].count += 1; }
    });
    const finalScores: any = {};
    Object.keys(scores).forEach((key) => { finalScores[key] = scores[key].sum / scores[key].count; });
    const interpretationPrompt = `Interpret these ${assessment.type} assessment results for a user. Provide a supportive, non-diagnostic summary. Scores: ${JSON.stringify(finalScores)}, Total: ${totalScore}. Keep it to 3-4 sentences.`;
    const aiResponse = await AIService.generateChatResponse([{ role: "user", content: interpretationPrompt }]);
    const result = await prisma.assessmentResult.create({
      data: { userId: req.user.id, assessmentId: id, answers, scores: finalScores, totalScore, aiInterpretation: aiResponse.content },
    });
    res.status(201).json({ success: true, data: result });
  }),

  getHistory: asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const results = await prisma.assessmentResult.findMany({ where: { userId: req.user.id, assessmentId: id }, orderBy: { takenAt: "desc" } });
    res.json({ success: true, data: results });
  }),
};
