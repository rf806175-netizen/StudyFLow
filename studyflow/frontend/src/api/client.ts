const BASE_URL = import.meta.env.VITE_API_URL || "https://studyflow-backend-one.vercel.app/api";

type RequestOptions = RequestInit & { json?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, ...init } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include", // send httpOnly cookie automatically
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    body: json ? JSON.stringify(json) : init.body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    const err = new ApiError(error.error || "Request failed", response.status, error);
    throw err;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type User = {
  id: number;
  email: string;
  fullName: string;
  subscriptionTier: "free" | "premium";
  subscriptionExpiresAt: string | null;
};

export const authApi = {
  register: (data: { email: string; fullName: string; password: string }) =>
    request<User>("/auth/register", { method: "POST", json: data }),
  login: (data: { email: string; password: string }) =>
    request<User>("/auth/login", { method: "POST", json: data }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

export type Subject = {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  colorHex: string;
  difficulty: "easy" | "medium" | "hard";
  examDate: string | null;
  weeklyGoalHours: number;
  isActive: boolean;
  createdAt: string;
};

export type SubjectInput = Partial<Omit<Subject, "id" | "userId" | "isActive" | "createdAt">>;

export const subjectsApi = {
  list: () => request<Subject[]>("/subjects"),
  get: (id: number) => request<Subject>(`/subjects/${id}`),
  create: (data: SubjectInput) => request<Subject>("/subjects", { method: "POST", json: data }),
  update: (id: number, data: SubjectInput) =>
    request<Subject>(`/subjects/${id}`, { method: "PUT", json: data }),
  delete: (id: number) => request<void>(`/subjects/${id}`, { method: "DELETE" }),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type StudySession = {
  id: number;
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
  createdAt: string;
  subject?: Subject;
};

export type SessionInput = {
  subjectId: number;
  type?: StudySession["type"];
  plannedStart: string;
  plannedDurationMinutes?: number;
  notes?: string;
};

export const sessionsApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return request<StudySession[]>(`/sessions?${q}`);
  },
  get: (id: number) => request<StudySession>(`/sessions/${id}`),
  create: (data: SessionInput) => request<StudySession>("/sessions", { method: "POST", json: data }),
  update: (id: number, data: Partial<SessionInput>) =>
    request<StudySession>(`/sessions/${id}`, { method: "PUT", json: data }),
  delete: (id: number) => request<void>(`/sessions/${id}`, { method: "DELETE" }),
  start: (id: number) => request<StudySession>(`/sessions/${id}/start`, { method: "POST" }),
  complete: (id: number, data: { focusScore?: number; notes?: string }) =>
    request<StudySession>(`/sessions/${id}/complete`, { method: "POST", json: data }),
  abandon: (id: number) => request<StudySession>(`/sessions/${id}/abandon`, { method: "POST" }),
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

export type ScheduleBlock = {
  id: number;
  userId: number;
  subjectId: number;
  title: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  recurrence: "once" | "weekly" | "daily";
  isActive: boolean;
  createdAt: string;
  subject?: Subject;
};

export type ScheduleInput = Omit<ScheduleBlock, "id" | "userId" | "isActive" | "createdAt" | "subject">;

export const scheduleApi = {
  list: () => request<ScheduleBlock[]>("/schedule"),
  get: (id: number) => request<ScheduleBlock>(`/schedule/${id}`),
  create: (data: ScheduleInput) => request<ScheduleBlock>("/schedule", { method: "POST", json: data }),
  update: (id: number, data: Partial<ScheduleInput>) =>
    request<ScheduleBlock>(`/schedule/${id}`, { method: "PUT", json: data }),
  delete: (id: number) => request<void>(`/schedule/${id}`, { method: "DELETE" }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export type PerformanceReport = {
  totalHours: number;
  totalSessions: number;
  avgFocusScore: number;
  bySubject: { name: string; colorHex: string; minutes: number; sessions: number }[];
  dailyHours: { date: string; hours: number }[];
};

export const reportsApi = {
  overview: () => request<PerformanceReport>("/reports"),
  subject: (id: number) => request<unknown>(`/reports/subject/${id}`),
};

// ─── Tutoring ─────────────────────────────────────────────────────────────────

export type TutoringRequest = {
  id: number;
  userId: number;
  subjectId: number;
  description: string;
  preferredDate: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  subject?: Subject;
};

export const tutoringApi = {
  list: () => request<TutoringRequest[]>("/tutoring"),
  get: (id: number) => request<TutoringRequest>(`/tutoring/${id}`),
  create: (data: { subjectId: number; description: string; preferredDate?: string }) =>
    request<TutoringRequest>("/tutoring", { method: "POST", json: data }),
  cancel: (id: number) => request<void>(`/tutoring/${id}`, { method: "DELETE" }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PricesResponse = {
  monthly: { priceId: string; amount: number; interval: string };
  yearly: { priceId: string; amount: number; interval: string };
};

export const paymentsApi = {
  prices: () => request<PricesResponse>("/payments/prices"),
  createCheckout: (priceId: string) =>
    request<{ url: string }>("/payments/checkout", { method: "POST", json: { priceId } }),
  createPortal: () =>
    request<{ url: string }>("/payments/portal", { method: "POST" }),
};
