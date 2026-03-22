"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const subjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    colorHex: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .default("#6366f1"),
    difficulty: zod_1.z.enum(["easy", "medium", "hard"]).default("medium"),
    examDate: zod_1.z.string().datetime({ offset: true }).optional(),
    weeklyGoalHours: zod_1.z.number().min(0).max(168).default(2),
});
// GET /api/subjects
router.get("/", async (req, res) => {
    const items = await db_1.db.query.subjects.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId), (0, drizzle_orm_1.eq)(db_1.schema.subjects.isActive, true)),
        orderBy: (s, { asc }) => [asc(s.name)],
    });
    res.json(items);
});
// POST /api/subjects
router.post("/", async (req, res) => {
    // Free tier: max 5 subjects
    if (req.user.subscriptionTier === "free") {
        const count = await db_1.db.query.subjects.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId), (0, drizzle_orm_1.eq)(db_1.schema.subjects.isActive, true)),
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
    const [subject] = await db_1.db
        .insert(db_1.schema.subjects)
        .values({ ...result.data, userId: req.userId })
        .returning();
    res.status(201).json(subject);
});
// GET /api/subjects/:id
router.get("/:id", async (req, res) => {
    const subject = await db_1.db.query.subjects.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId)),
    });
    if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
    }
    res.json(subject);
});
// PUT /api/subjects/:id
router.put("/:id", async (req, res) => {
    const subject = await db_1.db.query.subjects.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId)),
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
    const [updated] = await db_1.db
        .update(db_1.schema.subjects)
        .set(result.data)
        .where((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, subject.id))
        .returning();
    res.json(updated);
});
// DELETE /api/subjects/:id  (soft delete)
router.delete("/:id", async (req, res) => {
    const subject = await db_1.db.query.subjects.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId)),
    });
    if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
    }
    await db_1.db
        .update(db_1.schema.subjects)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, subject.id));
    res.status(204).end();
});
exports.default = router;
//# sourceMappingURL=subjects.js.map