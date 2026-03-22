import { useQuery } from "@tanstack/react-query";
import { subjectsApi, sessionsApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isPremium = user?.subscriptionTier === "premium";

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", { limit: 100 }],
    queryFn: () => sessionsApi.list({ limit: 100 }),
    enabled: !!user,
  });

  const today = new Date();
  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.actualStart || s.plannedStart);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
  const completedToday = sessions.filter(
    (s) => s.status === "completed" && todaySessions.includes(s)
  );
  const totalMinutesToday = completedToday.reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);
  const totalMinutesAll = sessions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);

  const dailyGoalMinutes = 240;
  const goalPct = Math.min(100, Math.round((totalMinutesToday / dailyGoalMinutes) * 100));

  // Build weekly chart (Mon–Sun of current week)
  const weekStart = new Date(today);
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekBars = WEEK_DAYS.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const mins = sessions
      .filter((s) => {
        if (s.status !== "completed") return false;
        const sd = new Date(s.actualStart || s.plannedStart);
        return (
          sd.getFullYear() === d.getFullYear() &&
          sd.getMonth() === d.getMonth() &&
          sd.getDate() === d.getDate()
        );
      })
      .reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    return { day, mins, isToday };
  });

  const maxBar = Math.max(...weekBars.map((b) => b.mins), 60);

  // Subject totals
  const subjectTotals = subjects.map((s) => {
    const mins = sessions
      .filter((sess) => sess.status === "completed" && sess.subjectId === s.id)
      .reduce((sum, sess) => sum + (sess.actualDurationMinutes || 0), 0);
    return { ...s, mins };
  });

  const todaySubjects = new Set(
    todaySessions.map((s) => s.subjectId)
  ).size;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Horas estudadas – dark card */}
        <div
          className="rounded-xl p-5 text-white"
          style={{ background: "linear-gradient(135deg, #0d1b35 0%, #0a1628 100%)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
            Horas Estudadas
          </p>
          <p className="text-4xl font-extrabold">{fmt(totalMinutesAll)}</p>
          <p className="text-xs text-white/40 mt-1">Total acumulado</p>
        </div>

        {/* Sessões */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 mb-2">SESSÕES</p>
          <p className="text-4xl font-extrabold text-gray-900">{sessions.filter((s) => s.status === "completed").length}</p>
          <p className="text-xs text-primary-500 mt-1 font-medium">Registradas</p>
        </div>

        {/* Meta diária */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 mb-2">META DIÁRIA</p>
          <p className="text-4xl font-extrabold text-gray-900">{goalPct}%</p>
          <p className="text-xs text-amber-500 mt-1 font-medium">de 4h por dia</p>
        </div>

        {/* Matérias hoje */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 mb-2">MATÉRIAS HOJE</p>
          <p className="text-4xl font-extrabold text-gray-900">{todaySubjects}</p>
          <p className="text-xs text-gray-400 mt-1">Disciplinas ativas</p>
        </div>
      </div>

      {/* Plano banner – só para free */}
      {user && !isPremium && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden flex items-center gap-6"
          style={{ background: "linear-gradient(135deg, #0d1b35 0%, #1e3a8a 60%, #2563eb 100%)" }}
        >
          {/* glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
          />

          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <p className="text-white font-bold text-sm">Você está no Plano Gratuito</p>
            </div>
            <p className="text-blue-200/80 text-xs leading-relaxed max-w-lg">
              Desbloqueie matérias ilimitadas, relatórios de desempenho completos, tutoria personalizada e muito mais com o Premium.
            </p>
            <div className="flex gap-4 mt-3">
              {["Matérias ilimitadas", "Relatórios detalhados", "Tutoria personalizada"].map((b) => (
                <span key={b} className="flex items-center gap-1 text-blue-200 text-xs">
                  <svg className="w-3 h-3 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right mb-1">
              <p className="text-blue-300 text-[10px]">A partir de</p>
              <p className="text-white font-extrabold text-2xl leading-none">R$ 25<span className="text-sm font-medium text-blue-300">/mês</span></p>
            </div>
            <button
              onClick={() => navigate("/perfil")}
              className="bg-white text-primary-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"
            >
              Assinar Premium
            </button>
            <p className="text-blue-300/60 text-[10px]">ou R$ 250/ano — economize 17%</p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly bar chart */}
        <div className="card">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Semana atual</h2>
            <p className="text-xs text-gray-400">Horas por dia</p>
          </div>
          <div className="flex items-end gap-2 h-28">
            {weekBars.map(({ day, mins, isToday }) => {
              const heightPct = (mins / maxBar) * 100;
              return (
                <div key={day} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex items-end" style={{ height: 80 }}>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(heightPct, mins > 0 ? 6 : 0)}%`,
                        backgroundColor: isToday ? "#2563eb" : "#e2e8f0",
                        minHeight: mins > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isToday ? "text-primary-600" : "text-gray-400"
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <div className="w-full h-0.5 bg-primary-600 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject totals */}
        <div className="card">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Matérias estudadas</h2>
            <p className="text-xs text-gray-400">Horas por disciplina</p>
            {subjectTotals.length > 0 && (
              <span className="text-xs text-primary-500 font-medium float-right -mt-5">
                {subjectTotals.length} matérias
              </span>
            )}
          </div>
          {subjectTotals.filter((s) => s.mins > 0).length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-gray-400">Nenhuma sessão ainda.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {subjectTotals
                .filter((s) => s.mins > 0)
                .sort((a, b) => b.mins - a.mins)
                .slice(0, 5)
                .map((s) => {
                  const maxMins = Math.max(...subjectTotals.map((x) => x.mins));
                  return (
                    <li key={s.id} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.colorHex }}
                      />
                      <span className="text-xs text-gray-700 flex-1 truncate">{s.name}</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(s.mins / maxMins) * 100}%`,
                            backgroundColor: s.colorHex,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{fmt(s.mins)}</span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
