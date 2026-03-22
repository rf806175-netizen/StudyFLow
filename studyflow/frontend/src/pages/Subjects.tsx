import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi, type SubjectInput } from "../api/client";
import { useAuthStore } from "../store/auth";
import SubjectCard from "../components/SubjectCard";
import { ApiError } from "../api/client";

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4",
];

const defaultForm: SubjectInput = {
  name: "",
  description: "",
  colorHex: "#6366f1",
  difficulty: "medium",
  weeklyGoalHours: 2,
};

export default function Subjects() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<SubjectInput>(defaultForm);
  const [error, setError] = useState("");

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setShowForm(false);
      setForm(defaultForm);
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubjectInput }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setEditing(null);
      setShowForm(false);
      setForm(defaultForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subjectsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (editing !== null) {
      updateMutation.mutate({ id: editing, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (id: number) => {
    const subject = subjects.find((s) => s.id === id);
    if (subject) {
      setForm({
        name: subject.name,
        description: subject.description || "",
        colorHex: subject.colorHex,
        difficulty: subject.difficulty,
        weeklyGoalHours: subject.weeklyGoalHours,
        examDate: subject.examDate || undefined,
      });
      setEditing(id);
      setShowForm(true);
    }
  };

  const isFreeLimit = user?.subscriptionTier === "free" && subjects.length >= 5;

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matérias</h1>
          <p className="text-gray-500 text-sm mt-1">
            {subjects.length} matéria{subjects.length !== 1 ? "s" : ""} ativa
            {subjects.length !== 1 ? "s" : ""}
            {user?.subscriptionTier === "free" && ` · Plano Free: ${subjects.length}/5`}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(defaultForm);
            setEditing(null);
            setShowForm(!showForm);
          }}
          disabled={isFreeLimit}
          className="btn-primary"
          title={isFreeLimit ? "Limite do plano Free atingido" : undefined}
        >
          + Nova matéria
        </button>
      </div>

      {isFreeLimit && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Você atingiu o limite de 5 matérias do plano Free.{" "}
          <a href="/payments" className="font-medium underline">
            Faça upgrade para Premium
          </a>{" "}
          para matérias ilimitadas.
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editing !== null ? "Editar matéria" : "Nova matéria"}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dificuldade
                </label>
                <select
                  className="input"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      difficulty: e.target.value as SubjectInput["difficulty"],
                    })
                  }
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                className="input h-20 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta semanal (horas)
                </label>
                <input
                  type="number"
                  className="input"
                  value={form.weeklyGoalHours}
                  onChange={(e) =>
                    setForm({ ...form, weeklyGoalHours: parseFloat(e.target.value) })
                  }
                  min={0.5}
                  max={168}
                  step={0.5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da prova
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.examDate?.slice(0, 16) || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      examDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, colorHex: color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      form.colorHex === color ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {editing !== null ? "Salvar" : "Criar matéria"}
              </button>
            </div>
          </form>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-gray-500">
            Nenhuma matéria ainda. Clique em "+ Nova matéria" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={() => handleEdit(subject.id)}
              onDelete={() => {
                if (confirm(`Remover "${subject.name}"?`))
                  deleteMutation.mutate(subject.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
