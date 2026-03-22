import { Router, Response } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#6366f1"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  examDate: z.string().datetime({ offset: true }).optional(),
  weeklyGoalHours: z.number().min(0).max(168).default(2),
});

// GET /api/subjects
router.get("/", async (req: AuthRequest, res: Response) => {
  const items = await db.query.subjects.findMany({
    where: and(
      eq(schema.subjects.userId, req.userId!),
      eq(schema.subjects.isActive, true)
    ),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
  res.json(items);
});

// POST /api/subjects
router.post("/", async (req: AuthRequest, res: Response) => {
  // Free tier: max 5 subjects
  if (req.user!.subscriptionTier === "free") {
    const count = await db.query.subjects.findMany({
      where: and(
        eq(schema.subjects.userId, req.userId!),
        eq(schema.subjects.isActive, true)
      ),
    });
    if (count.length >= 5) {
      res.status(402).json({
        error: "Free plan limited to 5 subjects. Upgrade to Premium.",
        upgradeUrl: "/payments",
      });
      return;
    }
  }

  const result = subjectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const [subject] = await db
    .insert(schema.subjects)
    .values({ ...result.data, userId: req.userId! })
    .returning();

  res.status(201).json(subject);
});

// GET /api/subjects/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const subject = await db.query.subjects.findFirst({
    where: and(
      eq(schema.subjects.id, parseInt(req.params.id)),
      eq(schema.subjects.userId, req.userId!)
    ),
  });
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(subject);
});

// PUT /api/subjects/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const subject = await db.query.subjects.findFirst({
    where: and(
      eq(schema.subjects.id, parseInt(req.params.id)),
      eq(schema.subjects.userId, req.userId!)
    ),
  });
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const result = subjectSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const [updated] = await db
    .update(schema.subjects)
    .set(result.data)
    .where(eq(schema.subjects.id, subject.id))
    .returning();

  res.json(updated);
});

// DELETE /api/subjects/:id  (soft delete)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const subject = await db.query.subjects.findFirst({
    where: and(
      eq(schema.subjects.id, parseInt(req.params.id)),
      eq(schema.subjects.userId, req.userId!)
    ),
  });
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  await db
    .update(schema.subjects)
    .set({ isActive: false })
    .where(eq(schema.subjects.id, subject.id));

  res.status(204).end();
});

export default router;
