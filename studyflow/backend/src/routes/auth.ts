import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { config } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { email, fullName, password } = result.data;

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(schema.users)
    .values({ email: email.toLowerCase(), fullName, hashedPassword })
    .returning();

 const token = jwt.sign(
  { userId: user.id },
  String(config.jwtSecret),
  { expiresIn: String(config.jwtExpiresIn) }
);

  res.cookie("token", token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: config.cookieMaxAge,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    subscriptionTier: user.subscriptionTier,
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { email, password } = result.data;

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  });

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

 const token = jwt.sign(
  { userId: user.id },
  String(config.jwtSecret),
  { expiresIn: String(config.jwtExpiresIn) }
);

  res.cookie("token", token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: config.cookieMaxAge,
  });

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    subscriptionTier: user.subscriptionTier,
  });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    subscriptionTier: user.subscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  });
});

export default router;
