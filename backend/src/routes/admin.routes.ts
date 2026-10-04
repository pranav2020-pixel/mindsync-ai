import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Only authenticated admins can fetch system analytics
router.get("/analytics", authenticate, AdminController.getAnalytics);

// Feedbacks / Issues / Suggestions management (Admin only)
router.get("/feedbacks", authenticate, AdminController.getFeedbacks);
router.patch("/feedbacks/:id", authenticate, AdminController.updateFeedbackStatus);
router.delete("/feedbacks/:id", authenticate, AdminController.deleteFeedback);
// Manual User Verification (Admin only)
router.post("/users/:id/verify", authenticate, AdminController.verifyUserManually);

export default router;
