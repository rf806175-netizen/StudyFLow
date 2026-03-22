import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { scheduleApi, subjectsApi, type ScheduleInput } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useActionGate } from "../hooks/useActionGate";
import LoginModal from "../components/LoginModal";
import PricingModal from "../components/PricingModal";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEK_HEADERS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarioPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const gate = useActionGate();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [agendaForm, setAgendaForm] = useState({ time: "09:00", materia: "", duration: "" });

  const { data: blocks = [] } = useQuery({
    queryKey: ["schedule"],
    queryFn: scheduleApi.list,
    enabled: !!user,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: ScheduleInput) => scheduleApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule"] }),
  });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  );

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(v => v - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(v => v + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (day: number) =>
    selectedDate &&
    day === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear();

  const agendaItems = blocks.filter((b) => {
    if (!selectedDate || b.specificDate == null) return false;
    const d = new Date(b.specificDate);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  const handleAddAgenda = () => {
    gate.gateAction(
      "organize",
      () => {
        if (!selectedDate || !agendaForm.materia) return;
        const subj = subjects.find((s) => s.name === agendaForm.materia);
        createMutation.mutate({
          subjectId: subj?.id || subjects[0]?.id || 0,
          title: agendaForm.materia,
          dayOfWeek: null,
          specificDate: selectedDate.toISOString().split("T")[0],
          startTime: agendaForm.time,
          endTime: agendaForm.time,
          recurrence: "once",
        } as ScheduleInput);
        setAgendaForm({ time: "09:00", materia: "", duration: "" });
      },
      "Adicionar agenda"
    );
  };

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Calendário</h1>
      </div>

      <div className="flex gap-4">
        {/* Calendar */}
        <div className="card flex-1">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-sm"
            >
              ‹
            </button>
            <h2 className="font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-sm"
            >
              ›
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEK_HEADERS.map((h) => (
              <div key={h} className="text-center text-xs font-semibold text-gray-400 py-1">
                {h}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!cell.current) return;
                  setSelectedDate(new Date(viewYear, viewMonth, cell.day));
                }}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                  ${!cell.current ? "text-gray-300 cursor-default" : "cursor-pointer"}
                  ${cell.current && isToday(cell.day)
                    ? "bg-primary-600 text-white shadow-md"
                    : cell.current && isSelected(cell.day)
                    ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                    : cell.current
                    ? "text-gray-700 hover:bg-gray-100"
                    : ""}
                `}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>

        {/* Agenda panel */}
        <div className="card w-72 flex flex-col">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">Agenda do dia</h2>
            <p className="text-xs text-gray-400">
              {selectedDate
                ? selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Selecione uma data"}
            </p>
          </div>

          {/* Items */}
          <div className="flex-1 mb-4 min-h-16">
            {!selectedDate ? (
              <p className="text-sm text-gray-400 text-center mt-4">Nenhum item agendado.</p>
            ) : agendaItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-4">Nenhum item agendado.</p>
            ) : (
              <ul className="space-y-2">
                {agendaItems.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg">
                    <span className="text-xs text-gray-500">{b.startTime}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{b.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add form */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={agendaForm.time}
                onChange={(e) => setAgendaForm({ ...agendaForm, time: e.target.value })}
                className="input w-24 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="Matéria"
                value={agendaForm.materia}
                onChange={(e) => setAgendaForm({ ...agendaForm, materia: e.target.value })}
                className="input flex-1 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Ex: 2h"
                value={agendaForm.duration}
                onChange={(e) => setAgendaForm({ ...agendaForm, duration: e.target.value })}
                className="input flex-1 py-1.5 text-sm"
              />
              <button
                onClick={handleAddAgenda}
                disabled={!selectedDate || !agendaForm.materia}
                className="btn-primary py-1.5 px-3 text-sm rounded-lg"
              >
                + Add
              </button>
            </div>
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
