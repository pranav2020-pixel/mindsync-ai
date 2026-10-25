import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, ReportController.getAll);
router.get("/monthly-wellness", authenticate, ReportController.getMonthlyWellnessPreview);
router.post("/", authenticate, ReportController.generate);
router.post("/generate", authenticate, ReportController.generate);

export default router;
