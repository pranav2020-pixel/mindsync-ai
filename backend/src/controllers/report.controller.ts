import { Request, Response } from "express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ReportService } from "../services/report.service";

export const ReportController = {
  getAll: asyncHandler(async (req: any, res: Response) => {
    const reports = await prisma.report.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: reports });
  }),

  generate: asyncHandler(async (req: any, res: Response) => {
    const { type, format, month, year } = req.body;
    const now = new Date();
    const targetMonth = month ? Number(month) : (now.getMonth() + 1);
    const targetYear = year ? Number(year) : now.getFullYear();

    let reportData;
    if (type === "MONTHLY_WELLNESS") {
      reportData = await ReportService.generateMonthlyWellnessReport(req.user.id, targetMonth, targetYear);
    }
    let fileBuffer;
    let fileUrl;
    if (format === "PDF" && reportData) {
      fileBuffer = await ReportService.generatePDFReport(req.user.id, reportData);
      fileUrl = "generated-pdf-url";
    } else if (format === "CSV") {
      const moodLogs = await prisma.moodLog.findMany({ where: { userId: req.user.id }, orderBy: { date: "desc" } });
      fileBuffer = Buffer.from(ReportService.generateCSVReport(moodLogs));
      fileUrl = "generated-csv-url";
    }
    const formattedMonth = String(targetMonth).padStart(2, "0");
    const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
    const report = await prisma.report.create({
      data: {
        userId: req.user.id,
        type,
        format,
        title: `${type} Report - ${formattedMonth}/${targetYear}`,
        fileUrl,
        content: reportData || {},
        dateRange: { from: `${targetYear}-${formattedMonth}-01`, to: `${targetYear}-${formattedMonth}-${lastDayOfMonth}` }
      },
    });

    // Create report download notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: "SYSTEM",
        title: "Report Downloaded",
        message: `Your ${type.replace(/_/g, " ")} (${format}) for ${formattedMonth}/${targetYear} was successfully generated and downloaded.`,
      },
    });

    res.status(201).json({ success: true, data: report, ...(fileBuffer && { download: fileBuffer.toString("base64") }) });
  }),
};
