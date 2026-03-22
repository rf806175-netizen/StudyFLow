import { Router, Response } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requirePremium } from "../middleware/premium";

const router = Router();
router.use(requireAuth, requirePremium);

const tutoringSchema = z.object({
  subjectId: z.number().int().positive(),
  description: z.string().min(10).max(1000),
  preferredDate: z.string().datetime({ offset: true }).optional(),
});

// GET /api/tutoring
router.get("/", async (req: AuthRequest, res: Response) => {
  const items = await db.query.tutoringRequests.findMany({
    where: eq(schema.tutoringRequests.userId, req.userId!),
    with: { subject: true },
    orderBy: [desc(schema.tutoringRequests.createdAt)],
  });
  res.json(items);
});

// POST /api/tutoring
router.post("/", async (req: AuthRequest, res: Response) => {
  const result = tutoringSchema.safeParse(req.body);
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

  const [request] = await db
    .insert(schema.tutoringRequests)
    .values({ ...result.data, userId: req.userId! })
    .returning();

  res.status(201).json(request);
});

// GET /api/tutoring/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const item = await db.query.tutoringRequests.findFirst({
    where: and(
      eq(schema.tutoringRequests.id, parseInt(req.params.id)),
      eq(schema.tutoringRequests.userId, req.userId!)
    ),
    with: { subject: true },
  });
  if (!item) {
    res.status(404).json({ error: "Tutoring request not found" });
    return;
  }
  res.json(item);
});

// DELETE /api/tutoring/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const item = await db.query.tutoringRequests.findFirst({
    where: and(
      eq(schema.tutoringRequests.id, parseInt(req.params.id)),
      eq(schema.tutoringRequests.userId, req.userId!)
    ),
  });
  if (!item) {
    res.status(404).json({ error: "Tutoring request not found" });
    return;
  }
  if (item.status !== "pending") {
    res.status(409).json({ error: "Can only cancel pending requests" });
    return;
  }

  await db
    .update(schema.tutoringRequests)
    .set({ status: "cancelled" })
    .where(eq(schema.tutoringRequests.id, item.id));

  res.status(204).end();
});

export default router;
