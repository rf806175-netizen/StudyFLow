import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tutoringApi, subjectsApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import PremiumGate from "../components/PremiumGate";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS = {
  pending: "Pendente",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

function TutoringContent() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subjectId: 0,
    description: "",
    preferredDate: "",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["tutoring"],
    queryFn: tutoringApi.list,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: tutoringApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutoring"] });
      setShowForm(false);
      setForm({ subjectId: 0, description: "", preferredDate: "" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: tutoringApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tutoring"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      preferredDate: form.preferredDate
        ? new Date(form.preferredDate).toISOString()
        : undefined,
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Solicite uma sessão de tutoria para tirar dúvidas com um tutor.
        </p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Nova solicitação
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Solicitar tutoria</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matéria *
                </label>
                <select
                  className="input"
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: parseInt(e.target.value) })}
                  required
                >
                  <option value={0} disabled>Selecionar...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data preferida
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição das dúvidas *
              </label>
              <textarea
                className="input h-28 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                minLength={10}
                maxLength={1000}
                required
                placeholder="Descreva quais tópicos você quer trabalhar na tutoria..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                Solicitar
              </button>
            </div>
          </form>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-gray-500">Nenhuma solicitação de tutoria ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: req.subject?.colorHex || "#6366f1" }}
                    />
                    <span className="font-medium text-gray-900">
                      {req.subject?.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{req.description}</p>
                  {req.preferredDate && (
                    <p className="text-xs text-gray-400 mt-2">
                      Preferência:{" "}
                      {new Date(req.preferredDate).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                {req.status === "pending" && (
                  <button
                    onClick={() => {
                      if (confirm("Cancelar esta solicitação?"))
                        cancelMutation.mutate(req.id);
                    }}
                    className="text-gray-400 hover:text-red-500 text-sm ml-4"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tutoring() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tutorias</h1>
      <PremiumGate feature="Tutorias">
        <TutoringContent />
      </PremiumGate>
    </div>
  );
}
