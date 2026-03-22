import { relations } from "drizzle-orm";
import {
  users,
  subjects,
  studySessions,
  schedules,
  payments,
  tutoringRequests,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  studySessions: many(studySessions),
  schedules: many(schedules),
  payments: many(payments),
  tutoringRequests: many(tutoringRequests),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, { fields: [subjects.userId], references: [users.id] }),
  studySessions: many(studySessions),
  schedules: many(schedules),
  tutoringRequests: many(tutoringRequests),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, { fields: [studySessions.userId], references: [users.id] }),
  subject: one(subjects, { fields: [studySessions.subjectId], references: [subjects.id] }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  user: one(users, { fields: [schedules.userId], references: [users.id] }),
  subject: one(subjects, { fields: [schedules.subjectId], references: [subjects.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const tutoringRequestsRelations = relations(tutoringRequests, ({ one }) => ({
  user: one(users, { fields: [tutoringRequests.userId], references: [users.id] }),
  subject: one(subjects, { fields: [tutoringRequests.subjectId], references: [subjects.id] }),
}));
