import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  hashedPassword: text("hashed_password").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  subscriptionTier: text("subscription_tier", { enum: ["free", "premium"] })
    .notNull()
    .default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionExpiresAt: text("subscription_expires_at"), // ISO 8601
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  colorHex: text("color_hex").notNull().default("#6366f1"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] })
    .notNull()
    .default("medium"),
  examDate: text("exam_date"), // ISO 8601
  weeklyGoalHours: real("weekly_goal_hours").notNull().default(2.0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Study Sessions ───────────────────────────────────────────────────────────

export const studySessions = sqliteTable("study_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["focus", "exam_review", "tutoring", "practice"],
  })
    .notNull()
    .default("focus"),
  status: text("status", {
    enum: ["planned", "in_progress", "completed", "abandoned"],
  })
    .notNull()
    .default("planned"),
  plannedStart: text("planned_start").notNull(), // ISO 8601
  plannedDurationMinutes: integer("planned_duration_minutes")
    .notNull()
    .default(25),
  actualStart: text("actual_start"),
  actualEnd: text("actual_end"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  notes: text("notes"),
  focusScore: integer("focus_score"), // 1-5
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Schedules ────────────────────────────────────────────────────────────────

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dayOfWeek: integer("day_of_week"), // 0=Mon … 6=Sun; null = specific date
  specificDate: text("specific_date"), // ISO 8601 date only
  startTime: text("start_time").notNull(), // "HH:MM"
  endTime: text("end_time").notNull(), // "HH:MM"
  recurrence: text("recurrence", { enum: ["once", "weekly", "daily"] })
    .notNull()
    .default("weekly"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status", {
    enum: ["pending", "succeeded", "failed", "refunded"],
  })
    .notNull()
    .default("pending"),
  description: text("description").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Tutoring Requests ────────────────────────────────────────────────────────

export const tutoringRequests = sqliteTable("tutoring_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  preferredDate: text("preferred_date"), // ISO 8601
  status: text("status", {
    enum: ["pending", "confirmed", "completed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type TutoringRequest = typeof tutoringRequests.$inferSelect;
export type NewTutoringRequest = typeof tutoringRequests.$inferInsert;
