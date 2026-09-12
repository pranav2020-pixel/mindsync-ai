import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const isDev = process.env.NODE_ENV === "development";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

const router = Router();
router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", authLimiter, AuthController.resetPassword);
router.post("/refresh", AuthController.refresh);
router.get("/me", authenticate, AuthController.me);
router.get("/streak", authenticate, AuthController.getStreak);
router.patch("/profile", authenticate, AuthController.updateProfile);
router.post("/change-password", authenticate, AuthController.changePassword);
router.post("/delete-account/request", authenticate, AuthController.requestDeleteAccount);
router.post("/delete-account/confirm", authenticate, AuthController.confirmDeleteAccount);
router.post("/logout", authenticate, AuthController.logout);
export default router;
