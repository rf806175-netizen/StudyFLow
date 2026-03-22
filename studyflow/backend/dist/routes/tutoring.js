"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const premium_1 = require("../middleware/premium");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, premium_1.requirePremium);
const tutoringSchema = zod_1.z.object({
    subjectId: zod_1.z.number().int().positive(),
    description: zod_1.z.string().min(10).max(1000),
    preferredDate: zod_1.z.string().datetime({ offset: true }).optional(),
});
// GET /api/tutoring
router.get("/", async (req, res) => {
    const items = await db_1.db.query.tutoringRequests.findMany({
        where: (0, drizzle_orm_1.eq)(db_1.schema.tutoringRequests.userId, req.userId),
        with: { subject: true },
        orderBy: [(0, drizzle_orm_1.desc)(db_1.schema.tutoringRequests.createdAt)],
    });
    res.json(items);
});
// POST /api/tutoring
router.post("/", async (req, res) => {
    const result = tutoringSchema.safeParse(req.body);
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
    const [request] = await db_1.db
        .insert(db_1.schema.tutoringRequests)
        .values({ ...result.data, userId: req.userId })
        .returning();
    res.status(201).json(request);
});
// GET /api/tutoring/:id
router.get("/:id", async (req, res) => {
    const item = await db_1.db.query.tutoringRequests.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.tutoringRequests.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.tutoringRequests.userId, req.userId)),
        with: { subject: true },
    });
    if (!item) {
        res.status(404).json({ error: "Tutoring request not found" });
        return;
    }
    res.json(item);
});
// DELETE /api/tutoring/:id
router.delete("/:id", async (req, res) => {
    const item = await db_1.db.query.tutoringRequests.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.tutoringRequests.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.tutoringRequests.userId, req.userId)),
    });
    if (!item) {
        res.status(404).json({ error: "Tutoring request not found" });
        return;
    }
    if (item.status !== "pending") {
        res.status(409).json({ error: "Can only cancel pending requests" });
        return;
    }
    await db_1.db
        .update(db_1.schema.tutoringRequests)
        .set({ status: "cancelled" })
        .where((0, drizzle_orm_1.eq)(db_1.schema.tutoringRequests.id, item.id));
    res.status(204).end();
});
exports.default = router;
//# sourceMappingURL=tutoring.js.map