import { Router } from "express";
import { InsightController } from "../controllers/insight.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/", authenticate, InsightController.getAll);
router.post("/generate", authenticate, InsightController.generate);
router.patch("/:id/read", authenticate, InsightController.markAsRead);
router.patch("/:id/pin", authenticate, InsightController.togglePin);
export default router;
