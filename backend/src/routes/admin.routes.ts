import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Only authenticated admins can fetch system analytics
router.get("/analytics", authenticate, AdminController.getAnalytics);

export default router;
