import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  sendEmail,
  verifyMailTransporter,
  getPasswordResetEmailTemplate,
  getPasswordResetEmailText,
  getAccountDeletionEmailTemplate,
  getAccountDeletionEmailText,
  getEmailOtpTemplate,
  getEmailOtpText,
} from "../utils/mailer";

const getJwtSecret = () => process.env.JWT_SECRET || "mindsync-default-jwt-secret-key";
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || "mindsync-default-jwt-refresh-secret-key";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRATION || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRATION || "90d";

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, getJwtSecret(), { expiresIn: ACCESS_EXPIRY as jwt.SignOptions["expiresIn"] });
  const refreshToken = jwt.sign({ userId }, getJwtRefreshSecret(), { expiresIn: REFRESH_EXPIRY as jwt.SignOptions["expiresIn"] });
  return { accessToken, refreshToken };
};

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
};

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, age, gender, occupation, timezone, wellnessGoals, productivityGoals, code } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    // 1. Strict RFC email format validation (rejects invalid emails like vasu@12)
    if (!isValidEmail(normalizedEmail)) {
      throw new AppError("Please provide a valid email address with a domain (e.g. name@gmail.com)", 400);
    }

    if (!name || !name.trim()) {
      throw new AppError("Full name is required", 400);
    }

    if (!password || password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // If the user already exists and their email is verified, reject registration
    if (existingUser && existingUser.isEmailVerified) {
      throw new AppError("This email is already registered. Please sign in instead.", 409);
    }

    // Step 1: Verification code is not provided -> Generate OTP and email it
    if (!code) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const hashedPassword = await bcrypt.hash(password, 12);

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name.trim(),
            password: hashedPassword,
            age: age ? Number(age) : null,
            gender: gender || null,
            occupation: occupation || null,
            timezone: timezone || "UTC",
            wellnessGoals: wellnessGoals || [],
            productivityGoals: productivityGoals || [],
            emailOtp: otp,
            emailOtpExpires: expiresAt,
            isEmailVerified: false,
          }
        });
      } else {
        await prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: name.trim(),
            age: age ? Number(age) : null,
            gender: gender || null,
            occupation: occupation || null,
            timezone: timezone || "UTC",
            wellnessGoals: wellnessGoals || [],
            productivityGoals: productivityGoals || [],
            emailOtp: otp,
            emailOtpExpires: expiresAt,
            isEmailVerified: false,
          }
        });
      }

      const html = getEmailOtpTemplate(otp, "Account Verification");
      const text = getEmailOtpText(otp, "Account Verification");
      sendEmail({
        to: normalizedEmail,
        subject: `MindSync AI Verification Code: ${otp}`,
        html,
        text,
      }).catch((emailErr) => {
        console.error("[MindSync Auth] Registration verification email dispatch failed:", emailErr);
      });

      const hasSmtp = Boolean((process.env.SMTP_HOST && process.env.SMTP_USER) || (process.env.SMTP_SERVICE === "gmail" && process.env.SMTP_USER));
      const isLocalDev = process.env.NODE_ENV !== "production" && !hasSmtp;

      return res.status(200).json({
        success: true,
        requireVerification: true,
        message: "A 6-digit verification code has been sent to your email inbox.",
        email: normalizedEmail,
        ...(isLocalDev ? { devCode: otp } : {}),
      });
    }

    // Step 2: Verification code is provided -> Verify code and activate account
    const cleanCode = (code || "").trim();
    if (!existingUser || !existingUser.emailOtp || !existingUser.emailOtpExpires) {
      throw new AppError("No pending registration found for this email. Please request a new verification code.", 400);
    }

    if (existingUser.emailOtpExpires < new Date() || existingUser.emailOtp !== cleanCode) {
      throw new AppError("Invalid or expired verification code. Please check and try again.", 400);
    }

    const verifiedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isEmailVerified: true,
        emailOtp: null,
        emailOtpExpires: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        age: true,
        gender: true,
        occupation: true,
        timezone: true,
        wellnessGoals: true,
        productivityGoals: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens(verifiedUser.id);
    await prisma.session.create({
      data: { userId: verifiedUser.id, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });

    res.status(201).json({
      success: true,
      message: "Account successfully verified and created!",
      data: {
        user: { ...verifiedUser, streak: 0 },
        ...tokens,
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new AppError("Please provide a valid email address (e.g. name@gmail.com)", 400);
    }
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new AppError("Invalid credentials", 401);
    const isValid = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isValid) throw new AppError("Invalid credentials", 401);

    if (!user.isEmailVerified) {
      throw new AppError("Please verify your email address to sign in. You can also sign in directly using Email OTP.", 403);
    }

    const tokens = generateTokens(user.id);
    await prisma.session.create({
      data: { userId: user.id, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });
    const streak = await AuthController.calculateUserStreak(user.id);
    res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, wellnessGoals: user.wellnessGoals, productivityGoals: user.productivityGoals, streak }, ...tokens } });
  }),

  googleAuth: asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) throw new AppError("Google credential token is required", 400);

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    let payload: any = null;

    try {
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      try {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (resp.ok) {
          payload = await resp.json();
        } else {
          throw new AppError("Invalid or expired Google authentication token", 401);
        }
      } catch (fallbackErr) {
        throw new AppError("Google token verification failed", 401);
      }
    }

    if (!payload || !payload.email) {
      throw new AppError("Failed to obtain verified Google account profile", 400);
    }

    const normalizedEmail = (payload.email || "").trim().toLowerCase();
    const googleId = payload.sub || payload.user_id;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleId },
          { email: normalizedEmail }
        ]
      }
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId,
          avatar: user.avatar || payload.picture || null,
          isEmailVerified: true,
          authProvider: user.authProvider === "LOCAL" ? "LOCAL" : "GOOGLE",
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: payload.name || normalizedEmail.split("@")[0],
          avatar: payload.picture || null,
          googleId: googleId,
          authProvider: "GOOGLE",
          isEmailVerified: true,
          timezone: "UTC",
          wellnessGoals: [],
          productivityGoals: [],
        }
      });
    }

    const tokens = generateTokens(user.id);
    await prisma.session.create({
      data: { userId: user.id, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });
    const streak = await AuthController.calculateUserStreak(user.id);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          wellnessGoals: user.wellnessGoals,
          productivityGoals: user.productivityGoals,
          streak,
        },
        ...tokens,
      },
    });
  }),

  sendEmailOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email, purpose } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new AppError("Please provide a valid email address with a domain (e.g. name@gmail.com)", 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailOtp: otp,
          emailOtpExpires: expiresAt,
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          authProvider: "OTP",
          emailOtp: otp,
          emailOtpExpires: expiresAt,
          timezone: "UTC",
          wellnessGoals: [],
          productivityGoals: [],
        }
      });
    }

    const html = getEmailOtpTemplate(otp, purpose || "Sign In");
    const text = getEmailOtpText(otp, purpose || "Sign In");
    // Dispatch email asynchronously so SMTP handshake latency never hangs or times out the user's request
    sendEmail({
      to: normalizedEmail,
      subject: `MindSync AI Verification Code: ${otp}`,
      html,
      text,
    }).catch((emailErr) => {
      console.error("[MindSync Auth] Background email dispatch failed:", emailErr);
    });

    const hasSmtp = Boolean((process.env.SMTP_HOST && process.env.SMTP_USER) || (process.env.SMTP_SERVICE === "gmail" && process.env.SMTP_USER));
    const isLocalDev = process.env.NODE_ENV !== "production" && !hasSmtp;

    res.json({
      success: true,
      message: "A 6-digit verification code has been sent to your Gmail inbox.",
      ...(isLocalDev ? { devCode: otp } : {}),
    });
  }),

  verifyEmailOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!isValidEmail(normalizedEmail) || !cleanCode) {
      throw new AppError("Valid email and 6-digit verification code are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.emailOtp || !user.emailOtpExpires) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    if (user.emailOtpExpires < new Date() || user.emailOtp !== cleanCode) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: null,
        emailOtpExpires: null,
        isEmailVerified: true,
      }
    });

    const tokens = generateTokens(updatedUser.id);
    await prisma.session.create({
      data: { userId: updatedUser.id, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });
    const streak = await AuthController.calculateUserStreak(updatedUser.id);
    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
          wellnessGoals: updatedUser.wellnessGoals,
          productivityGoals: updatedUser.productivityGoals,
          streak,
        },
        ...tokens,
      },
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("Refresh token required", 401);
    const session = await prisma.session.findFirst({ where: { token: refreshToken, type: "REFRESH" } });
    if (!session || session.expiresAt < new Date()) throw new AppError("Invalid or expired refresh token", 401);
    
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokens = generateTokens(decoded.userId);
    await prisma.session.deleteMany({ where: { token: refreshToken } });
    await prisma.session.create({
      data: { userId: decoded.userId, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });
    res.json({ success: true, data: tokens });
  }),

  me: asyncHandler(async (req: any, res: Response) => {
    const adminEmail = (process.env.ADMIN_EMAIL || "pranavmsc2020@gmail.com").trim().toLowerCase();
    if (req.user?.email && req.user.email.toLowerCase() === adminEmail && req.user.role !== "ADMIN") {
      await prisma.user.update({ where: { id: req.user.id }, data: { role: "ADMIN" } });
      req.user.role = "ADMIN";
    }
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

    if (user.password) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) throw new AppError("Current password is incorrect", 401);
    }

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
    if (!isValidEmail(normalizedEmail)) {
      throw new AppError("Please provide a valid email address (e.g. name@gmail.com)", 400);
    }

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
      const emailText = getPasswordResetEmailText(user.name, resetCode);
      await sendEmail({
        to: user.email,
        subject: "MindSync AI: Password Reset Verification Code",
        html: emailTemplate,
        text: emailText,
      });
    } catch (emailErr) {
      console.warn("Failed to send email via SMTP, proceeding with on-screen verification code:", emailErr);
    }

    const hasSmtp = Boolean((process.env.SMTP_HOST && process.env.SMTP_USER) || (process.env.SMTP_SERVICE === "gmail" && process.env.SMTP_USER));
    const isLocalDev = process.env.NODE_ENV !== "production" && !hasSmtp;

    res.json({
      success: true,
      message: "If that email is registered, a 6-digit verification code has been sent to your email.",
      ...(isLocalDev ? { devCode: resetCode } : {}),
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!isValidEmail(normalizedEmail) || !cleanCode || !newPassword) {
      throw new AppError("Valid email, verification code, and new password are required", 400);
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

    const adminEmail = (process.env.ADMIN_EMAIL || "pranavmsc2020@gmail.com").trim().toLowerCase();
    if (user.role === "ADMIN" || user.email.toLowerCase() === adminEmail) {
      throw new AppError("Primary Administrator accounts cannot be deleted to prevent permanent system lockouts and administrative data disruption.", 403);
    }

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
    const emailText = getAccountDeletionEmailText(user.name, deleteCode);
    await sendEmail({
      to: user.email,
      subject: "MindSync AI: Confirm Account Deletion",
      html: emailTemplate,
      text: emailText,
    });

    const hasSmtp = Boolean((process.env.SMTP_HOST && process.env.SMTP_USER) || (process.env.SMTP_SERVICE === "gmail" && process.env.SMTP_USER));
    const isLocalDev = process.env.NODE_ENV !== "production" && !hasSmtp;

    res.json({
      success: true,
      message: "A 6-digit confirmation code has been sent to your email to verify deletion.",
      ...(isLocalDev ? { devCode: deleteCode } : {}),
    });
  }),

  confirmDeleteAccount: asyncHandler(async (req: any, res: Response) => {
    const { password, code } = req.body;
    const cleanCode = (code || "").trim();

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError("User not found", 404);

    const adminEmail = (process.env.ADMIN_EMAIL || "pranavmsc2020@gmail.com").trim().toLowerCase();
    if (user.role === "ADMIN" || user.email.toLowerCase() === adminEmail) {
      throw new AppError("Primary Administrator accounts cannot be deleted to prevent permanent system lockouts and administrative data disruption.", 403);
    }

    // Verify current password if user has one
    if (user.password) {
      if (!password) throw new AppError("Password is required to confirm account deletion", 400);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new AppError("Incorrect password", 401);
    }

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

  emailDiagnostics: asyncHandler(async (req: Request, res: Response) => {
    const to = (req.query.to as string) || "pranavmsc2020@gmail.com";
    const resendKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;
    const testSend = req.query.testSend === "true";

    const report: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasResendKey: Boolean(resendKey),
        resendKeyPrefix: resendKey ? resendKey.slice(0, 7) + "..." : null,
        hasSmtpUser: Boolean(process.env.SMTP_USER),
        smtpUser: process.env.SMTP_USER || null,
        hasSmtpPass: Boolean(smtpPass),
        smtpPort: process.env.SMTP_PORT || "587",
      },
    };

    // Test Nodemailer SMTP Connection
    try {
      const verifyRes = await verifyMailTransporter();
      report.smtpVerification = verifyRes;
    } catch (vErr: any) {
      report.smtpVerification = { success: false, error: vErr.message || String(vErr) };
    }

    if (resendKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "MindSync AI <onboarding@resend.dev>",
            to: [to],
            subject: "MindSync AI - Live Email Diagnostics Test",
            html: "<p>This is a live test from MindSync AI diagnostics.</p>",
          }),
        });

        report.resendTest = {
          status: resendRes.status,
          statusText: resendRes.statusText,
          response: await resendRes.text(),
        };
      } catch (e: any) {
        report.resendTest = { error: e.message };
      }
    }

    if (testSend) {
      try {
        const result = await sendEmail({
          to,
          subject: "MindSync AI - Live Delivery Test",
          html: `<p>MindSync AI live delivery test dispatched at ${new Date().toISOString()}</p>`,
          text: `MindSync AI live delivery test dispatched at ${new Date().toISOString()}`,
        });
        report.sendEmailTest = result;
      } catch (sendErr: any) {
        report.sendEmailTest = { success: false, error: sendErr.message || String(sendErr) };
      }
    }

    res.json(report);
  }),
};
