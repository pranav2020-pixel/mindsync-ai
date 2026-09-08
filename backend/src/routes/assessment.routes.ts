import { Router } from "express";
import { AssessmentController } from "../controllers/assessment.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/", authenticate, AssessmentController.getAll);
router.get("/:id/questions", authenticate, AssessmentController.getQuestions);
router.get("/:id/history", authenticate, AssessmentController.getHistory);
router.post("/:id/submit", authenticate, AssessmentController.submit);
export default router;
