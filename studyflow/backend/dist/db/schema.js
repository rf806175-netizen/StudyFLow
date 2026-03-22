"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutoringRequests = exports.payments = exports.schedules = exports.studySessions = exports.subjects = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
// ─── Users ────────────────────────────────────────────────────────────────────
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    email: (0, sqlite_core_1.text)("email").notNull().unique(),
    fullName: (0, sqlite_core_1.text)("full_name").notNull(),
    hashedPassword: (0, sqlite_core_1.text)("hashed_password").notNull(),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).notNull().default(true),
    subscriptionTier: (0, sqlite_core_1.text)("subscription_tier", { enum: ["free", "premium"] })
        .notNull()
        .default("free"),
    stripeCustomerId: (0, sqlite_core_1.text)("stripe_customer_id").unique(),
    stripeSubscriptionId: (0, sqlite_core_1.text)("stripe_subscription_id"),
    subscriptionExpiresAt: (0, sqlite_core_1.text)("subscription_expires_at"), // ISO 8601
    createdAt: (0, sqlite_core_1.text)("created_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
    updatedAt: (0, sqlite_core_1.text)("updated_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// ─── Subjects ─────────────────────────────────────────────────────────────────
exports.subjects = (0, sqlite_core_1.sqliteTable)("subjects", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    colorHex: (0, sqlite_core_1.text)("color_hex").notNull().default("#6366f1"),
    difficulty: (0, sqlite_core_1.text)("difficulty", { enum: ["easy", "medium", "hard"] })
        .notNull()
        .default("medium"),
    examDate: (0, sqlite_core_1.text)("exam_date"), // ISO 8601
    weeklyGoalHours: (0, sqlite_core_1.real)("weekly_goal_hours").notNull().default(2.0),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// ─── Study Sessions ───────────────────────────────────────────────────────────
exports.studySessions = (0, sqlite_core_1.sqliteTable)("study_sessions", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    subjectId: (0, sqlite_core_1.integer)("subject_id")
        .notNull()
        .references(() => exports.subjects.id, { onDelete: "cascade" }),
    type: (0, sqlite_core_1.text)("type", {
        enum: ["focus", "exam_review", "tutoring", "practice"],
    })
        .notNull()
        .default("focus"),
    status: (0, sqlite_core_1.text)("status", {
        enum: ["planned", "in_progress", "completed", "abandoned"],
    })
        .notNull()
        .default("planned"),
    plannedStart: (0, sqlite_core_1.text)("planned_start").notNull(), // ISO 8601
    plannedDurationMinutes: (0, sqlite_core_1.integer)("planned_duration_minutes")
        .notNull()
        .default(25),
    actualStart: (0, sqlite_core_1.text)("actual_start"),
    actualEnd: (0, sqlite_core_1.text)("actual_end"),
    actualDurationMinutes: (0, sqlite_core_1.integer)("actual_duration_minutes"),
    notes: (0, sqlite_core_1.text)("notes"),
    focusScore: (0, sqlite_core_1.integer)("focus_score"), // 1-5
    createdAt: (0, sqlite_core_1.text)("created_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// ─── Schedules ────────────────────────────────────────────────────────────────
exports.schedules = (0, sqlite_core_1.sqliteTable)("schedules", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    subjectId: (0, sqlite_core_1.integer)("subject_id")
        .notNull()
        .references(() => exports.subjects.id, { onDelete: "cascade" }),
    title: (0, sqlite_core_1.text)("title").notNull(),
    dayOfWeek: (0, sqlite_core_1.integer)("day_of_week"), // 0=Mon … 6=Sun; null = specific date
    specificDate: (0, sqlite_core_1.text)("specific_date"), // ISO 8601 date only
    startTime: (0, sqlite_core_1.text)("start_time").notNull(), // "HH:MM"
    endTime: (0, sqlite_core_1.text)("end_time").notNull(), // "HH:MM"
    recurrence: (0, sqlite_core_1.text)("recurrence", { enum: ["once", "weekly", "daily"] })
        .notNull()
        .default("weekly"),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// ─── Payments ─────────────────────────────────────────────────────────────────
exports.payments = (0, sqlite_core_1.sqliteTable)("payments", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    stripePaymentIntentId: (0, sqlite_core_1.text)("stripe_payment_intent_id").notNull().unique(),
    stripeSubscriptionId: (0, sqlite_core_1.text)("stripe_subscription_id"),
    amountCents: (0, sqlite_core_1.integer)("amount_cents").notNull(),
    currency: (0, sqlite_core_1.text)("currency").notNull().default("usd"),
    status: (0, sqlite_core_1.text)("status", {
        enum: ["pending", "succeeded", "failed", "refunded"],
    })
        .notNull()
        .default("pending"),
    description: (0, sqlite_core_1.text)("description").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// ─── Tutoring Requests ────────────────────────────────────────────────────────
exports.tutoringRequests = (0, sqlite_core_1.sqliteTable)("tutoring_requests", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    subjectId: (0, sqlite_core_1.integer)("subject_id")
        .notNull()
        .references(() => exports.subjects.id, { onDelete: "cascade" }),
    description: (0, sqlite_core_1.text)("description").notNull(),
    preferredDate: (0, sqlite_core_1.text)("preferred_date"), // ISO 8601
    status: (0, sqlite_core_1.text)("status", {
        enum: ["pending", "confirmed", "completed", "cancelled"],
    })
        .notNull()
        .default("pending"),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .notNull()
        .default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
//# sourceMappingURL=schema.js.map