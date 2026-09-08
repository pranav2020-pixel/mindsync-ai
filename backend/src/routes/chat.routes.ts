import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/history", authenticate, ChatController.getHistory);
router.post("/", authenticate, ChatController.sendMessage);
router.delete("/history", authenticate, ChatController.clearHistory);
export default router;
