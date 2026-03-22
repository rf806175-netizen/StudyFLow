import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, subjectsApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useActionGate } from "../hooks/useActionGate";
import LoginModal from "../components/LoginModal";
import PricingModal from "../components/PricingModal";

const UNIVERSITY_SUBJECTS = [
  "Cálculo I", "Cálculo II", "Álgebra Linear", "Física I", "Física II",
  "Química Geral", "Biologia Celular", "Programação", "Banco de Dados",
  "Estrutura de Dados", "Sistemas Operacionais", "Redes de Computadores",
  "Engenharia de Software", "Direito Civil", "Direito Constitucional",
  "Administração", "Economia", "Contabilidade", "Matemática Financeira",
  "Estatística", "Português", "Matemática", "Raciocínio Lógico",
  "Informática", "História", "Geografia", "Filosofia", "Inglês Técnico",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtHMS(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function fmtHM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m estudadas`;
  return m === 0 ? `${h}h ${pad(0)}m estudadas` : `${h}h ${pad(m)}m estudadas`;
}

export default function SessaoPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const gate = useActionGate();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", { limit: 50 }],
    queryFn: () => sessionsApi.list({ limit: 50 }),
    enabled: !!user,
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [localSubject, setLocalSubject] = useState(UNIVERSITY_SUBJECTS[0]);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  useEffect(() => {
    if (subjects.length > 0 && selectedSubjectId === 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const startMutation = useMutation({
    mutationFn: async () => {
      const s = await sessionsApi.create({
        subjectId: selectedSubjectId,
        type: "focus",
        plannedStart: new Date().toISOString(),
        plannedDurationMinutes: 60,
      });
      const started = await sessionsApi.start(s.id);
      return started;
    },
    onSuccess: (s) => {
      setActiveSessionId(s.id);
      setRunning(true);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) =>
      sessionsApi.complete(id, { focusScore: 5 }),
    onSuccess: () => {
      setRunning(false);
      setElapsedSecs(0);
      setActiveSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const handleIniciar = () => {
    gate.gateAction(
      "organize",
      () => {
        if (subjects.length === 0) {
          // Local timer mode (university subjects without API)
          setRunning(true);
          return;
        }
        if (!selectedSubjectId) return;
        startMutation.mutate();
      },
      "Sessão de estudo"
    );
  };

  const handleConcluir = () => {
    if (!activeSessionId) return;
    completeMutation.mutate(activeSessionId);
  };

  const handleZerar = () => {
    setRunning(false);
    setElapsedSecs(0);
  };

  // Today's completed sessions
  const today = new Date();
  const todaySessions = sessions.filter((s) => {
    if (s.status !== "completed") return false;
    const d = new Date(s.actualStart || s.plannedStart);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);
  const dailyGoal = 240;
  const goalPct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const subjectColor = selectedSubject?.colorHex || "#2563eb";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Sessão de Estudo</h1>
      </div>

      <div className="flex gap-4">
        {/* Left – timer */}
        <div className="card flex-1">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Sessão de estudo</h2>
          <p className="text-xs text-gray-400 mb-4">Cronômetro em tempo real</p>

          {/* Subject selector */}
          {subjects.length > 0 ? (
            <select
              className="input mb-4 text-sm"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(parseInt(e.target.value))}
              disabled={running}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : (
            <select
              className="input mb-4 text-sm"
              value={localSubject}
              onChange={(e) => setLocalSubject(e.target.value)}
              disabled={running}
            >
              <optgroup label="Matérias da Faculdade">
                {UNIVERSITY_SUBJECTS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </optgroup>
            </select>
          )}

          {/* Timer area */}
          <div className="rounded-xl overflow-hidden border border-gray-100">
            {/* Progress line */}
            <div
              className="h-1 transition-all"
              style={{
                backgroundColor: subjectColor,
                width: running ? "100%" : "0%",
                transition: running ? "none" : "width 0.5s",
              }}
            />
            <div className="p-8 text-center bg-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                {selectedSubject?.name || localSubject || "—"}
              </p>
              <p
                className="text-6xl font-extrabold tracking-tight text-gray-900 font-mono"
              >
                {fmtHMS(elapsedSecs)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-4 justify-center">
            <button
              onClick={handleIniciar}
              disabled={running || startMutation.isPending}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl"
            >
              <span>▶</span> Iniciar
            </button>
            <button
              onClick={handleConcluir}
              disabled={!running || !activeSessionId}
              className="flex items-center gap-2 border-2 border-green-400 text-green-600 px-5 py-2.5 rounded-xl font-medium hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <span>✓</span> Concluir
            </button>
            <button
              onClick={handleZerar}
              className="flex items-center gap-2 border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              <span>↺</span> Zerar
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4 w-72">
          {/* Sessões de hoje */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Sessões de hoje</h3>
            {todaySessions.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma sessão concluída ainda.</p>
            ) : (
              <ul className="space-y-2">
                {todaySessions.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.subject?.colorHex || "#2563eb" }}
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {s.subject?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {s.actualDurationMinutes}min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Meta do dia */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 text-sm">Meta do dia</h3>
              <span className="text-sm font-bold text-gray-700">
                {Math.floor(dailyGoal / 60)}h {pad(dailyGoal % 60)}m
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{fmtHM(todayMinutes)}</span>
              <span className="font-semibold text-gray-600">{goalPct}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Faltam {Math.floor((dailyGoal - todayMinutes) / 60)}h{" "}
              {pad(Math.max(0, dailyGoal - todayMinutes) % 60)}m
            </p>
          </div>
        </div>
      </div>

      {gate.showLogin && (
        <LoginModal onClose={() => gate.setShowLogin(false)} />
      )}
      {gate.showPricing && (
        <PricingModal
          onClose={() => gate.setShowPricing(false)}
          feature={gate.pricingFeature}
        />
      )}
    </div>
  );
}
