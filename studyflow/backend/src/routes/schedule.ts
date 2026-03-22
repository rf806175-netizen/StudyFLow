import { Router, Response } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const scheduleSchema = z.object({
  subjectId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  specificDate: z.string().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  recurrence: z.enum(["once", "weekly", "daily"]).default("weekly"),
});

// GET /api/schedule
router.get("/", async (req: AuthRequest, res: Response) => {
  const items = await db.query.schedules.findMany({
    where: and(
      eq(schema.schedules.userId, req.userId!),
      eq(schema.schedules.isActive, true)
    ),
    with: { subject: true },
    orderBy: (s, { asc }) => [asc(s.dayOfWeek), asc(s.startTime)],
  });
  res.json(items);
});

// POST /api/schedule
router.post("/", async (req: AuthRequest, res: Response) => {
  const result = scheduleSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const subject = await db.query.subjects.findFirst({
    where: and(
      eq(schema.subjects.id, result.data.subjectId),
      eq(schema.subjects.userId, req.userId!)
    ),
  });
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const [block] = await db
    .insert(schema.schedules)
    .values({ ...result.data, userId: req.userId! })
    .returning();

  res.status(201).json(block);
});

// GET /api/schedule/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const block = await db.query.schedules.findFirst({
    where: and(
      eq(schema.schedules.id, parseInt(req.params.id)),
      eq(schema.schedules.userId, req.userId!)
    ),
    with: { subject: true },
  });
  if (!block) {
    res.status(404).json({ error: "Schedule block not found" });
    return;
  }
  res.json(block);
});

// PUT /api/schedule/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const block = await db.query.schedules.findFirst({
    where: and(
      eq(schema.schedules.id, parseInt(req.params.id)),
      eq(schema.schedules.userId, req.userId!)
    ),
  });
  if (!block) {
    res.status(404).json({ error: "Schedule block not found" });
    return;
  }

  const result = scheduleSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const [updated] = await db
    .update(schema.schedules)
    .set(result.data)
    .where(eq(schema.schedules.id, block.id))
    .returning();

  res.json(updated);
});

// DELETE /api/schedule/:id (soft delete)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const block = await db.query.schedules.findFirst({
    where: and(
      eq(schema.schedules.id, parseInt(req.params.id)),
      eq(schema.schedules.userId, req.userId!)
    ),
  });
  if (!block) {
    res.status(404).json({ error: "Schedule block not found" });
    return;
  }

  await db
    .update(schema.schedules)
    .set({ isActive: false })
    .where(eq(schema.schedules.id, block.id));

  res.status(204).end();
});

export default router;
