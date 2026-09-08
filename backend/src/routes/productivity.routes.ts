import { Router } from "express";
import { ProductivityController } from "../controllers/productivity.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/", authenticate, ProductivityController.getAll);
router.get("/stats", authenticate, ProductivityController.getStats);
router.post("/", authenticate, ProductivityController.createOrUpdate);
export default router;
