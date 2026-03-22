"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    fullName: zod_1.z.string().min(2).max(100),
    password: zod_1.z.string().min(8).max(128),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
router.post("/register", async (req, res) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    const { email, fullName, password } = result.data;
    const existing = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.schema.users.email, email.toLowerCase()),
    });
    if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const [user] = await db_1.db
        .insert(db_1.schema.users)
        .values({ email: email.toLowerCase(), fullName, hashedPassword })
        .returning();
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, String(config_1.config.jwtSecret), {
        expiresIn: config_1.config.jwtExpiresIn,
    });
    res.cookie("token", token, {
        httpOnly: true,
        secure: config_1.config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: config_1.config.cookieMaxAge,
    });
    res.status(201).json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
    });
});
router.post("/login", async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    const { email, password } = result.data;
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.schema.users.email, email.toLowerCase()),
    });
    if (!user || !user.isActive) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const valid = await bcryptjs_1.default.compare(password, user.hashedPassword);
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, String(config_1.config.jwtSecret), {
        expiresIn: config_1.config.jwtExpiresIn,
    });
    res.cookie("token", token, {
        httpOnly: true,
        secure: config_1.config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: config_1.config.cookieMaxAge,
    });
    res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
    });
});
router.post("/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});
router.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map