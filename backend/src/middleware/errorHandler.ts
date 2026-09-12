import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  console.error("Server error:", err);
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" || req.query.debug === "1" ? err.stack : undefined,
  });
};
