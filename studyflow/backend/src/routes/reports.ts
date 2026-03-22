import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requirePremium } from "../middleware/premium";
import { getPerformanceOverview, getSubjectReport } from "../services/reports";
import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";

const router = Router();
router.use(requireAuth, requirePremium);

// GET /api/reports
router.get("/", async (req: AuthRequest, res: Response) => {
  const data = await getPerformanceOverview(req.userId!);
  res.json(data);
});

// GET /api/reports/subject/:id
router.get("/subject/:id", async (req: AuthRequest, res: Response) => {
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

  const data = await getSubjectReport(req.userId!, subject.id);
  res.json({ subject, ...data });
});

export default router;
