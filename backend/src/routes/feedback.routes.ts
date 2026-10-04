import { Router } from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Users can submit issues and suggestions (authenticated)
router.post("/", authenticate, FeedbackController.create);

export default router;
