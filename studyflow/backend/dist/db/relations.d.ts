export declare const usersRelations: import("drizzle-orm").Relations<"users", {
    subjects: import("drizzle-orm").Many<"subjects">;
    studySessions: import("drizzle-orm").Many<"study_sessions">;
    schedules: import("drizzle-orm").Many<"schedules">;
    payments: import("drizzle-orm").Many<"payments">;
    tutoringRequests: import("drizzle-orm").Many<"tutoring_requests">;
}>;
export declare const subjectsRelations: import("drizzle-orm").Relations<"subjects", {
    user: import("drizzle-orm").One<"users", true>;
    studySessions: import("drizzle-orm").Many<"study_sessions">;
    schedules: import("drizzle-orm").Many<"schedules">;
    tutoringRequests: import("drizzle-orm").Many<"tutoring_requests">;
}>;
export declare const studySessionsRelations: import("drizzle-orm").Relations<"study_sessions", {
    user: import("drizzle-orm").One<"users", true>;
    subject: import("drizzle-orm").One<"subjects", true>;
}>;
export declare const schedulesRelations: import("drizzle-orm").Relations<"schedules", {
    user: import("drizzle-orm").One<"users", true>;
    subject: import("drizzle-orm").One<"subjects", true>;
}>;
export declare const paymentsRelations: import("drizzle-orm").Relations<"payments", {
    user: import("drizzle-orm").One<"users", true>;
}>;
export declare const tutoringRequestsRelations: import("drizzle-orm").Relations<"tutoring_requests", {
    user: import("drizzle-orm").One<"users", true>;
    subject: import("drizzle-orm").One<"subjects", true>;
}>;
//# sourceMappingURL=relations.d.ts.map