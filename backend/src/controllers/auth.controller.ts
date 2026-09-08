import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

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
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError("Email already registered", 409);
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, age, gender, occupation, timezone: timezone || "UTC", wellnessGoals: wellnessGoals || [], productivityGoals: productivityGoals || [] },
      select: { id: true, email: true, name: true, avatar: true, age: true, gender: true, occupation: true, timezone: true, wellnessGoals: true, productivityGoals: true, createdAt: true },
    });
    const tokens = generateTokens(user.id);
    res.status(201).json({ success: true, data: { user, ...tokens } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid credentials", 401);
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new AppError("Invalid credentials", 401);
    const tokens = generateTokens(user.id);
    await prisma.session.create({
      data: { userId: user.id, token: tokens.refreshToken, type: "REFRESH", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, wellnessGoals: user.wellnessGoals, productivityGoals: user.productivityGoals }, ...tokens } });
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
    res.json({ success: true, data: req.user });
  }),

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
};
