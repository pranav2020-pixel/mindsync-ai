import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../server";
import { AppError } from "../utils/AppError";

export interface AuthRequest extends Request { user?: any; }

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new AppError("Authentication required", 401);
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mindsync-default-jwt-secret-key") as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, avatar: true, role: true, wellnessGoals: true, productivityGoals: true },
    });
    if (!user) throw new AppError("User not found", 401);
    req.user = user;
    next();
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError("Invalid or expired token", 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) return next(new AppError("Insufficient permissions", 403));
    next();
  };
};
