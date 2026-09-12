import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", NotificationController.getAll);
router.patch("/read-all", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/clear", NotificationController.clearAll);

export default router;
