import { db, schema } from "../db";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getPerformanceOverview(userId: number) {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const sessions = await db.query.studySessions.findMany({
    where: and(
      eq(schema.studySessions.userId, userId),
      eq(schema.studySessions.status, "completed"),
      gte(schema.studySessions.actualEnd, thirtyDaysAgo)
    ),
    with: { subject: true },
  });

  // Total hours studied
  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.actualDurationMinutes || 0),
    0
  );

  // Average focus score
  const scoredSessions = sessions.filter((s) => s.focusScore !== null);
  const avgFocusScore =
    scoredSessions.length > 0
      ? scoredSessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) /
        scoredSessions.length
      : 0;

  // Hours by subject
  const bySubject: Record<
    number,
    { name: string; colorHex: string; minutes: number; sessions: number }
  > = {};
  for (const session of sessions) {
    const sid = session.subjectId;
    if (!bySubject[sid]) {
      bySubject[sid] = {
        name: session.subject?.name || "Unknown",
        colorHex: session.subject?.colorHex || "#6366f1",
        minutes: 0,
        sessions: 0,
      };
    }
    bySubject[sid].minutes += session.actualDurationMinutes || 0;
    bySubject[sid].sessions += 1;
  }

  // Daily hours for chart (last 14 days)
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const session of sessions) {
    const day = (session.actualEnd || session.plannedStart).slice(0, 10);
    if (day in dailyMap) {
      dailyMap[day] += (session.actualDurationMinutes || 0) / 60;
    }
  }

  return {
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    totalSessions: sessions.length,
    avgFocusScore: Math.round(avgFocusScore * 10) / 10,
    bySubject: Object.values(bySubject),
    dailyHours: Object.entries(dailyMap).map(([date, hours]) => ({
      date,
      hours: Math.round(hours * 10) / 10,
    })),
  };
}

export async function getSubjectReport(userId: number, subjectId: number) {
  const sessions = await db.query.studySessions.findMany({
    where: and(
      eq(schema.studySessions.userId, userId),
      eq(schema.studySessions.subjectId, subjectId)
    ),
    orderBy: (s, { desc }) => [desc(s.plannedStart)],
  });

  const completed = sessions.filter((s) => s.status === "completed");
  const totalMinutes = completed.reduce(
    (sum, s) => sum + (s.actualDurationMinutes || 0),
    0
  );
  const completionRate =
    sessions.length > 0
      ? Math.round((completed.length / sessions.length) * 100)
      : 0;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    completionRate,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    recentSessions: sessions.slice(0, 10),
  };
}
