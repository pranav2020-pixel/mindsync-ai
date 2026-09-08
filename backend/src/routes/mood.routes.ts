import { Router } from "express";
import { MoodController } from "../controllers/mood.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/", authenticate, MoodController.getAll);
router.get("/today", authenticate, MoodController.getToday);
router.get("/stats", authenticate, MoodController.getStats);
router.post("/", authenticate, MoodController.create);
export default router;
