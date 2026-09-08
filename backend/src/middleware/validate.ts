import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      throw new AppError(`Validation failed: ${errors.map(e => e.message).join(", ")}`, 400);
    }
    req.body = result.data;
    next();
  };
};
