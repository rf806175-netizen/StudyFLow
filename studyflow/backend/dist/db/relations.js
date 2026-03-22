"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutoringRequestsRelations = exports.paymentsRelations = exports.schedulesRelations = exports.studySessionsRelations = exports.subjectsRelations = exports.usersRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("./schema");
exports.usersRelations = (0, drizzle_orm_1.relations)(schema_1.users, ({ many }) => ({
    subjects: many(schema_1.subjects),
    studySessions: many(schema_1.studySessions),
    schedules: many(schema_1.schedules),
    payments: many(schema_1.payments),
    tutoringRequests: many(schema_1.tutoringRequests),
}));
exports.subjectsRelations = (0, drizzle_orm_1.relations)(schema_1.subjects, ({ one, many }) => ({
    user: one(schema_1.users, { fields: [schema_1.subjects.userId], references: [schema_1.users.id] }),
    studySessions: many(schema_1.studySessions),
    schedules: many(schema_1.schedules),
    tutoringRequests: many(schema_1.tutoringRequests),
}));
exports.studySessionsRelations = (0, drizzle_orm_1.relations)(schema_1.studySessions, ({ one }) => ({
    user: one(schema_1.users, { fields: [schema_1.studySessions.userId], references: [schema_1.users.id] }),
    subject: one(schema_1.subjects, { fields: [schema_1.studySessions.subjectId], references: [schema_1.subjects.id] }),
}));
exports.schedulesRelations = (0, drizzle_orm_1.relations)(schema_1.schedules, ({ one }) => ({
    user: one(schema_1.users, { fields: [schema_1.schedules.userId], references: [schema_1.users.id] }),
    subject: one(schema_1.subjects, { fields: [schema_1.schedules.subjectId], references: [schema_1.subjects.id] }),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(schema_1.payments, ({ one }) => ({
    user: one(schema_1.users, { fields: [schema_1.payments.userId], references: [schema_1.users.id] }),
}));
exports.tutoringRequestsRelations = (0, drizzle_orm_1.relations)(schema_1.tutoringRequests, ({ one }) => ({
    user: one(schema_1.users, { fields: [schema_1.tutoringRequests.userId], references: [schema_1.users.id] }),
    subject: one(schema_1.subjects, { fields: [schema_1.tutoringRequests.subjectId], references: [schema_1.subjects.id] }),
}));
//# sourceMappingURL=relations.js.map