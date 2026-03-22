"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
async function requireAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(db_1.schema.users.id, payload.userId),
        });
        if (!user || !user.isActive) {
            res.status(401).json({ error: "User not found or inactive" });
            return;
        }
        req.userId = user.id;
        req.user = user;
        next();
    }
    catch {
        res.clearCookie("token");
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
//# sourceMappingURL=auth.js.map