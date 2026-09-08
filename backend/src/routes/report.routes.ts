import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/", authenticate, ReportController.getAll);
router.post("/", authenticate, ReportController.generate);
export default router;
