"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const scheduleSchema = zod_1.z.object({
    subjectId: zod_1.z.number().int().positive(),
    title: zod_1.z.string().min(1).max(200),
    dayOfWeek: zod_1.z.number().int().min(0).max(6).optional().nullable(),
    specificDate: zod_1.z.string().optional().nullable(),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    recurrence: zod_1.z.enum(["once", "weekly", "daily"]).default("weekly"),
});
// GET /api/schedule
router.get("/", async (req, res) => {
    const items = await db_1.db.query.schedules.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.schedules.userId, req.userId), (0, drizzle_orm_1.eq)(db_1.schema.schedules.isActive, true)),
        with: { subject: true },
        orderBy: (s, { asc }) => [asc(s.dayOfWeek), asc(s.startTime)],
    });
    res.json(items);
});
// POST /api/schedule
router.post("/", async (req, res) => {
    const result = scheduleSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    const subject = await db_1.db.query.subjects.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, result.data.subjectId), (0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId)),
    });
    if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
    }
    const [block] = await db_1.db
        .insert(db_1.schema.schedules)
        .values({ ...result.data, userId: req.userId })
        .returning();
    res.status(201).json(block);
});
// GET /api/schedule/:id
router.get("/:id", async (req, res) => {
    const block = await db_1.db.query.schedules.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.schedules.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.schedules.userId, req.userId)),
        with: { subject: true },
    });
    if (!block) {
        res.status(404).json({ error: "Schedule block not found" });
        return;
    }
    res.json(block);
});
// PUT /api/schedule/:id
router.put("/:id", async (req, res) => {
    const block = await db_1.db.query.schedules.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.schedules.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.schedules.userId, req.userId)),
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
    const [updated] = await db_1.db
        .update(db_1.schema.schedules)
        .set(result.data)
        .where((0, drizzle_orm_1.eq)(db_1.schema.schedules.id, block.id))
        .returning();
    res.json(updated);
});
// DELETE /api/schedule/:id (soft delete)
router.delete("/:id", async (req, res) => {
    const block = await db_1.db.query.schedules.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.schedules.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.schedules.userId, req.userId)),
    });
    if (!block) {
        res.status(404).json({ error: "Schedule block not found" });
        return;
    }
    await db_1.db
        .update(db_1.schema.schedules)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.eq)(db_1.schema.schedules.id, block.id));
    res.status(204).end();
});
exports.default = router;
//# sourceMappingURL=schedule.js.map