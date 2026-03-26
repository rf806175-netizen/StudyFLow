import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  user?: typeof schema.users.$inferSelect;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: number };
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, payload.userId),
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch {
    res.clearCookie("token");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
