import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
  console.error("Unexpected error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
