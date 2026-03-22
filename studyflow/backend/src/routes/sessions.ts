import { Router, Response } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const sessionSchema = z.object({
  subjectId: z.number().int().positive(),
  type: z.enum(["focus", "exam_review", "tutoring", "practice"]).default("focus"),
  plannedStart: z.string().datetime({ offset: true }),
  plannedDurationMinutes: z.number().int().min(1).max(480).default(25),
  notes: z.string().max(1000).optional(),
});

// GET /api/sessions
router.get("/", async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit) || "50"), 100);
  const offset = parseInt(String(req.query.offset) || "0");

  const items = await db.query.studySessions.findMany({
    where: eq(schema.studySessions.userId, req.userId!),
    with: { subject: true },
    orderBy: [desc(schema.studySessions.plannedStart)],
    limit,
    offset,
  });
  res.json(items);
});

// POST /api/sessions
router.post("/", async (req: AuthRequest, res: Response) => {
  const result = sessionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  // Validate subject belongs to user
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

  const [session] = await db
    .insert(schema.studySessions)
    .values({ ...result.data, userId: req.userId! })
    .returning();

  res.status(201).json(session);
});

// GET /api/sessions/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const session = await db.query.studySessions.findFirst({
    where: and(
      eq(schema.studySessions.id, parseInt(req.params.id)),
      eq(schema.studySessions.userId, req.userId!)
    ),
    with: { subject: true },
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

// PUT /api/sessions/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const session = await db.query.studySessions.findFirst({
    where: and(
      eq(schema.studySessions.id, parseInt(req.params.id)),
      eq(schema.studySessions.userId, req.userId!)
    ),
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const result = sessionSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const [updated] = await db
    .update(schema.studySessions)
    .set(result.data)
    .where(eq(schema.studySessions.id, session.id))
    .returning();

  res.json(updated);
});

// DELETE /api/sessions/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const session = await db.query.studySessions.findFirst({
    where: and(
      eq(schema.studySessions.id, parseInt(req.params.id)),
      eq(schema.studySessions.userId, req.userId!)
    ),
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await db
    .delete(schema.studySessions)
    .where(eq(schema.studySessions.id, session.id));

  res.status(204).end();
});

// POST /api/sessions/:id/start
router.post("/:id/start", async (req: AuthRequest, res: Response) => {
  const session = await db.query.studySessions.findFirst({
    where: and(
      eq(schema.studySessions.id, parseInt(req.params.id)),
      eq(schema.studySessions.userId, req.userId!)
    ),
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status !== "planned") {
    res.status(409).json({ error: "Session already started or completed" });
    return;
  }

  const [updated] = await db
    .update(schema.studySessions)
    .set({ status: "in_progress", actualStart: new Date().toISOString() })
    .where(eq(schema.studySessions.id, session.id))
    .returning();

  res.json(updated);
});

// POST /api/sessions/:id/complete
router.post("/:id/complete", async (req: AuthRequest, res: Response) => {
  const { focusScore, notes } = req.body;

  const session = await db.query.studySessions.findFirst({
    where: and(
      eq(schema.studySessions.id, parseInt(req.params.id)),
      eq(schema.studySessions.userId, req.userId!)
    ),
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status !== "in_progress") {
    res.status(409).json({ error: "Session not in progress" });
    return;
  }

  const actualEnd = new Date().toISOString();
  const actualStart = session.actualStart
    ? new Date(session.actualStart)
    : new Date();
  const actualDurationMinutes = Math.round(
    (new Date(actualEnd).getTime() - actualStart.getTime()) / 60000
  );

  const [updated] = await db
    .update(schema.studySessions)
    .set({
      status: "completed",
      actualEnd,
      actualDurationMinutes,
      focusScore: focusScore ?? null,
      notes: notes ?? session.notes,
    })
    .where(eq(schema.studySessions.id, session.id))
    .returning();

  res.json(updated);
});

// POST /api/sessions/:id/abandon
router.post("/:id/abandon", async (req: AuthRequest, res: Response) => {
  const session = await db.query.studySessions.findFirst({
    where: and(
      eq(schema.studySessions.id, parseInt(req.params.id)),
      eq(schema.studySessions.userId, req.userId!)
    ),
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const [updated] = await db
    .update(schema.studySessions)
    .set({
      status: "abandoned",
      actualEnd: new Date().toISOString(),
    })
    .where(eq(schema.studySessions.id, session.id))
    .returning();

  res.json(updated);
});

export default router;
