import { useState, useEffect, useRef, useCallback } from "react";

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  isFinished: boolean;
}

export function usePomodoro(durationMinutes: number) {
  const totalSeconds = durationMinutes * 60;
  const [state, setState] = useState<TimerState>({
    secondsLeft: totalSeconds,
    isRunning: false,
    isFinished: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.secondsLeft <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return { secondsLeft: 0, isRunning: false, isFinished: true };
      }
      return { ...prev, secondsLeft: prev.secondsLeft - 1 };
    });
  }, []);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true, isFinished: false }));
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ secondsLeft: totalSeconds, isRunning: false, isFinished: false });
  }, [totalSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(state.secondsLeft / 60);
  const seconds = state.secondsLeft % 60;
  const progress = ((totalSeconds - state.secondsLeft) / totalSeconds) * 100;

  return {
    ...state,
    minutes,
    seconds,
    progress,
    display: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    start,
    pause,
    reset,
  };
}
