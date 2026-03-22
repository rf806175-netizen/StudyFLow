"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const sessionSchema = zod_1.z.object({
    subjectId: zod_1.z.number().int().positive(),
    type: zod_1.z.enum(["focus", "exam_review", "tutoring", "practice"]).default("focus"),
    plannedStart: zod_1.z.string().datetime({ offset: true }),
    plannedDurationMinutes: zod_1.z.number().int().min(1).max(480).default(25),
    notes: zod_1.z.string().max(1000).optional(),
});
// GET /api/sessions
router.get("/", async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit) || "50"), 100);
    const offset = parseInt(String(req.query.offset) || "0");
    const items = await db_1.db.query.studySessions.findMany({
        where: (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId),
        with: { subject: true },
        orderBy: [(0, drizzle_orm_1.desc)(db_1.schema.studySessions.plannedStart)],
        limit,
        offset,
    });
    res.json(items);
});
// POST /api/sessions
router.post("/", async (req, res) => {
    const result = sessionSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    // Validate subject belongs to user
    const subject = await db_1.db.query.subjects.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, result.data.subjectId), (0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId)),
    });
    if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
    }
    const [session] = await db_1.db
        .insert(db_1.schema.studySessions)
        .values({ ...result.data, userId: req.userId })
        .returning();
    res.status(201).json(session);
});
// GET /api/sessions/:id
router.get("/:id", async (req, res) => {
    const session = await db_1.db.query.studySessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId)),
        with: { subject: true },
    });
    if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    res.json(session);
});
// PUT /api/sessions/:id
router.put("/:id", async (req, res) => {
    const session = await db_1.db.query.studySessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId)),
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
    const [updated] = await db_1.db
        .update(db_1.schema.studySessions)
        .set(result.data)
        .where((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, session.id))
        .returning();
    res.json(updated);
});
// DELETE /api/sessions/:id
router.delete("/:id", async (req, res) => {
    const session = await db_1.db.query.studySessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId)),
    });
    if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    await db_1.db
        .delete(db_1.schema.studySessions)
        .where((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, session.id));
    res.status(204).end();
});
// POST /api/sessions/:id/start
router.post("/:id/start", async (req, res) => {
    const session = await db_1.db.query.studySessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId)),
    });
    if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    if (session.status !== "planned") {
        res.status(409).json({ error: "Session already started or completed" });
        return;
    }
    const [updated] = await db_1.db
        .update(db_1.schema.studySessions)
        .set({ status: "in_progress", actualStart: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, session.id))
        .returning();
    res.json(updated);
});
// POST /api/sessions/:id/complete
router.post("/:id/complete", async (req, res) => {
    const { focusScore, notes } = req.body;
    const session = await db_1.db.query.studySessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId)),
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
    const actualDurationMinutes = Math.round((new Date(actualEnd).getTime() - actualStart.getTime()) / 60000);
    const [updated] = await db_1.db
        .update(db_1.schema.studySessions)
        .set({
        status: "completed",
        actualEnd,
        actualDurationMinutes,
        focusScore: focusScore ?? null,
        notes: notes ?? session.notes,
    })
        .where((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, session.id))
        .returning();
    res.json(updated);
});
// POST /api/sessions/:id/abandon
router.post("/:id/abandon", async (req, res) => {
    const session = await db_1.db.query.studySessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.studySessions.userId, req.userId)),
    });
    if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    const [updated] = await db_1.db
        .update(db_1.schema.studySessions)
        .set({
        status: "abandoned",
        actualEnd: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(db_1.schema.studySessions.id, session.id))
        .returning();
    res.json(updated);
});
exports.default = router;
//# sourceMappingURL=sessions.js.map