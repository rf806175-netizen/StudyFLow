export declare function getPerformanceOverview(userId: number): Promise<{
    totalHours: number;
    totalSessions: number;
    avgFocusScore: number;
    bySubject: {
        name: string;
        colorHex: string;
        minutes: number;
        sessions: number;
    }[];
    dailyHours: {
        date: string;
        hours: number;
    }[];
}>;
export declare function getSubjectReport(userId: number, subjectId: number): Promise<{
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    totalHours: number;
    recentSessions: {
        id: number;
        createdAt: string;
        userId: number;
        subjectId: number;
        type: "focus" | "exam_review" | "tutoring" | "practice";
        status: "planned" | "in_progress" | "completed" | "abandoned";
        plannedStart: string;
        plannedDurationMinutes: number;
        actualStart: string | null;
        actualEnd: string | null;
        actualDurationMinutes: number | null;
        notes: string | null;
        focusScore: number | null;
    }[];
}>;
//# sourceMappingURL=reports.d.ts.map