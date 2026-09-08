import { Router } from "express";
import { HabitController } from "../controllers/habit.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/", authenticate, HabitController.getAll);
router.get("/stats", authenticate, HabitController.getStats);
router.post("/", authenticate, HabitController.createOrUpdate);
router.post("/custom", authenticate, HabitController.createCustomHabit);
export default router;
