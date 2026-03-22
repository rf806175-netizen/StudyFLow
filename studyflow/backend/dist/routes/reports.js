"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const premium_1 = require("../middleware/premium");
const reports_1 = require("../services/reports");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, premium_1.requirePremium);
// GET /api/reports
router.get("/", async (req, res) => {
    const data = await (0, reports_1.getPerformanceOverview)(req.userId);
    res.json(data);
});
// GET /api/reports/subject/:id
router.get("/subject/:id", async (req, res) => {
    const subject = await db_1.db.query.subjects.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.subjects.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(db_1.schema.subjects.userId, req.userId)),
    });
    if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
    }
    const data = await (0, reports_1.getSubjectReport)(req.userId, subject.id);
    res.json({ subject, ...data });
});
exports.default = router;
//# sourceMappingURL=reports.js.map