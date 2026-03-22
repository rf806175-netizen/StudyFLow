import { usePomodoro } from "../hooks/useSession";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, type StudySession } from "../api/client";
import { useState } from "react";

interface PomodoroTimerProps {
  session: StudySession;
  onDone?: () => void;
}

export default function PomodoroTimer({ session, onDone }: PomodoroTimerProps) {
  const timer = usePomodoro(session.plannedDurationMinutes);
  const queryClient = useQueryClient();
  const [focusScore, setFocusScore] = useState(4);
  const [showComplete, setShowComplete] = useState(false);

  const startMutation = useMutation({
    mutationFn: () => sessionsApi.start(session.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => sessionsApi.complete(session.id, { focusScore }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onDone?.();
    },
  });

  const abandonMutation = useMutation({
    mutationFn: () => sessionsApi.abandon(session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onDone?.();
    },
  });

  // Circumference of the circular progress ring
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timer.progress / 100) * circumference;

  const handleStart = () => {
    startMutation.mutate();
    timer.start();
  };

  const handleFinish = () => {
    timer.pause();
    if (timer.isFinished) {
      completeMutation.mutate();
    } else {
      setShowComplete(true);
    }
  };

  if (showComplete) {
    return (
      <div className="card text-center max-w-sm mx-auto">
        <h3 className="text-lg font-semibold mb-4">Como foi a sessão?</h3>
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setFocusScore(n)}
              className={`w-10 h-10 rounded-full text-lg transition-colors ${
                focusScore === n
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          1 = Muito disperso · 5 = Foco total
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="btn-primary flex-1"
          >
            Concluir
          </button>
          <button
            onClick={() => abandonMutation.mutate()}
            className="btn-secondary flex-1"
          >
            Abandonar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card text-center max-w-sm mx-auto">
      <p className="text-sm text-gray-500 mb-2">
        {session.subject?.name ?? "Sessão de estudo"}
      </p>

      {/* Circular timer */}
      <div className="relative inline-flex items-center justify-center my-4">
        <svg width="200" height="200" className="-rotate-90">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#6366f1"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-4xl font-mono font-bold text-gray-900">
          {timer.display}
        </span>
      </div>

      <div className="flex gap-3 justify-center">
        {session.status === "planned" && (
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="btn-primary px-8"
          >
            Iniciar
          </button>
        )}

        {session.status === "in_progress" && (
          <>
            {timer.isRunning ? (
              <button onClick={timer.pause} className="btn-secondary">
                Pausar
              </button>
            ) : (
              <button onClick={timer.start} className="btn-primary">
                Continuar
              </button>
            )}
            <button onClick={handleFinish} className="btn-secondary">
              Finalizar
            </button>
          </>
        )}
      </div>

      {timer.isFinished && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-700 text-sm font-medium">
          ✅ Tempo esgotado! Clique em Finalizar para registrar.
        </div>
      )}
    </div>
  );
}
