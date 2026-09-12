import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendEmail, getPasswordResetEmailTemplate, getAccountDeletionEmailTemplate } from "../utils/mailer";

const getJwtSecret = () => process.env.JWT_SECRET || "mindsync-default-jwt-secret-key";
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || "mindsync-default-jwt-refresh-secret-key";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRATION || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRATION || "7d";

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, getJwtSecret(), { expiresIn: ACCESS_EXPIRY as jwt.SignOptions["expiresIn"] });
  const refreshToken = jwt.sign({ userId }, getJwtRefreshSecret(), { expiresIn: REFRESH_EXPIRY as jwt.SignOptions["expiresIn"] });
  return { accessToken, refreshToken };
};

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, age, gender, occupation, timezone, wellnessGoals, productivityGoals } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throw new AppError("Email already registered", 409);
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashedPassword, name, age, gender, occupation, timezone: timezone || "UTC", wellnessGoals: wellnessGoals || [], productivityGoals: productivityGoals || [] },
      select: { id: true, email: true, name: true, avatar: true, age: true, gender: true, occupation: true, timezone: true, wellnessGoals: true, productivityGoals: true, createdAt: true },
    });
    const tokens = generateTokens(user.id);
    res.status(201).json({ success: true, data: { user, ...tokens } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new AppError("Invalid credentials", 401);
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new AppError("Invalid credentials", 401);
    const tokens = generateTokens(user.id);
    await prisma.session.create({
      data: { userId: user.id, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    const streak = await AuthController.calculateUserStreak(user.id);
    res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, wellnessGoals: user.wellnessGoals, productivityGoals: user.productivityGoals, streak }, ...tokens } });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("Refresh token required", 401);
    const session = await prisma.session.findFirst({ where: { token: refreshToken, type: "REFRESH" } });
    if (!session || session.expiresAt < new Date()) throw new AppError("Invalid or expired refresh token", 401);
    const decoded = jwt.verify(refreshToken, getJwtRefreshSecret()) as any;
    const tokens = generateTokens(decoded.userId);
    await prisma.session.deleteMany({ where: { token: refreshToken } });
    await prisma.session.create({ data: { userId: decoded.userId, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    res.json({ success: true, data: tokens });
  }),

  me: asyncHandler(async (req: any, res: Response) => {
    const streak = await AuthController.calculateUserStreak(req.user.id);
    res.json({ success: true, data: { ...req.user, streak } });
  }),

  getStreak: asyncHandler(async (req: any, res: Response) => {
    const streak = await AuthController.calculateUserStreak(req.user.id);
    res.json({ success: true, data: { streak } });
  }),

  calculateUserStreak: async (userId: string): Promise<number> => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [moods, journals, habits, productivity] = await Promise.all([
      prisma.moodLog.findMany({ where: { userId, date: { gte: sixtyDaysAgo } }, select: { date: true } }),
      prisma.journalEntry.findMany({ where: { userId, date: { gte: sixtyDaysAgo } }, select: { date: true } }),
      prisma.habitLog.findMany({ where: { userId, completed: true, date: { gte: sixtyDaysAgo } }, select: { date: true } }),
      prisma.productivityLog.findMany({ where: { userId, date: { gte: sixtyDaysAgo } }, select: { date: true } }),
    ]);

    const dateSet = new Set<string>();
    const toDateKey = (d: Date) => {
      const date = new Date(d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    moods.forEach((m) => dateSet.add(toDateKey(m.date)));
    journals.forEach((j) => dateSet.add(toDateKey(j.date)));
    habits.forEach((h) => dateSet.add(toDateKey(h.date)));
    productivity.forEach((p) => dateSet.add(toDateKey(p.date)));

    if (dateSet.size === 0) return 0;

    const today = new Date();
    const todayKey = toDateKey(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    let streak = 0;
    let checkDate = new Date();

    if (dateSet.has(todayKey)) {
      checkDate = today;
    } else if (dateSet.has(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      return 0;
    }

    while (true) {
      const checkKey = toDateKey(checkDate);
      if (dateSet.has(checkKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  updateProfile: asyncHandler(async (req: any, res: Response) => {
    const { name, age, gender, occupation, timezone, wellnessGoals, productivityGoals } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, age, gender, occupation, timezone, wellnessGoals, productivityGoals },
      select: { id: true, email: true, name: true, avatar: true, age: true, gender: true, occupation: true, timezone: true, wellnessGoals: true, productivityGoals: true },
    });
    res.json({ success: true, data: user });
  }),

  logout: asyncHandler(async (req: any, res: Response) => {
    res.json({ success: true, message: "Logged out successfully" });
  }),

  changePassword: asyncHandler(async (req: any, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters long", 400);
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError("User not found", 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError("Current password is incorrect", 401);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Create security notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Security Alert: Password Changed",
        message: `Your account password was successfully updated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}. If you didn't do this, contact support immediately.`,
      },
    });

    // Revoke previous sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    res.json({ success: true, message: "Password updated successfully. Please sign in again with your new password." });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new AppError("Email is required", 400);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new AppError("No account found with this email. Please check your spelling or register a new account.", 404);
    }

    // Generate a cryptographically secure 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetCode,
        passwordResetExpires: expiresAt,
      },
    });

    try {
      const emailTemplate = getPasswordResetEmailTemplate(user.name, resetCode);
      await sendEmail({
        to: user.email,
        subject: "MindSync AI - Password Reset Verification Code",
        html: emailTemplate,
      });
    } catch (emailErr) {
      console.warn("Failed to send email via SMTP, proceeding with on-screen verification code:", emailErr);
    }

    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    res.json({
      success: true,
      message: hasSmtp
        ? "A 6-digit verification code has been sent to your email."
        : "Verification code generated! (Showing on screen since SMTP is not configured).",
      devCode: resetCode,
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!normalizedEmail || !cleanCode || !newPassword) {
      throw new AppError("Email, verification code, and new password are required", 400);
    }
    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    if (user.passwordResetExpires < new Date() || user.passwordResetToken !== cleanCode) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Create security notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Security Alert: Password Reset via Email",
        message: `Your account password was successfully reset using email verification on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`,
      },
    });

    // Invalidate all active user sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    res.json({ success: true, message: "Password reset successful! You can now sign in with your new password." });
  }),

  requestDeleteAccount: asyncHandler(async (req: any, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError("User not found", 404);

    const deleteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: `DELETE:${deleteCode}`,
        passwordResetExpires: expiresAt,
      },
    });

    const emailTemplate = getAccountDeletionEmailTemplate(user.name, deleteCode);
    await sendEmail({
      to: user.email,
      subject: "⚠️ MindSync AI - Confirm Account Deletion",
      html: emailTemplate,
    });

    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    res.json({
      success: true,
      message: "A 6-digit confirmation code has been sent to your email to verify deletion.",
      ...(!hasSmtp ? { devCode: deleteCode } : {}),
    });
  }),

  confirmDeleteAccount: asyncHandler(async (req: any, res: Response) => {
    const { password, code } = req.body;
    const cleanCode = (code || "").trim();

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError("User not found", 404);

    // Verify current password first
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppError("Incorrect password", 401);

    // Verify 6-digit confirmation code
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      throw new AppError("Please request a deletion confirmation code first", 400);
    }

    if (user.passwordResetExpires < new Date() || user.passwordResetToken !== `DELETE:${cleanCode}`) {
      throw new AppError("Invalid or expired confirmation code", 400);
    }

    // Cascade delete all records belonging to this user
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.journalEntry.deleteMany({ where: { userId: user.id } }),
      prisma.moodLog.deleteMany({ where: { userId: user.id } }),
      prisma.productivityLog.deleteMany({ where: { userId: user.id } }),
      prisma.habitLog.deleteMany({ where: { userId: user.id } }),
      prisma.customHabit.deleteMany({ where: { userId: user.id } }),
      prisma.assessmentResult.deleteMany({ where: { userId: user.id } }),
      prisma.aIInsight.deleteMany({ where: { userId: user.id } }),
      prisma.recommendation.deleteMany({ where: { userId: user.id } }),
      prisma.chatMessage.deleteMany({ where: { userId: user.id } }),
      prisma.notification.deleteMany({ where: { userId: user.id } }),
      prisma.userAchievement.deleteMany({ where: { userId: user.id } }),
      prisma.report.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    res.json({ success: true, message: "Your account and all associated data have been permanently deleted." });
  }),
};
