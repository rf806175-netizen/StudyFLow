import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../api/client";

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login.mutateAsync({ email: form.email, password: form.password });
      } else {
        await register.mutateAsync({ email: form.email, password: form.password, fullName: form.fullName });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao entrar");
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "login" ? "Bem-vindo de volta" : "Criar conta grátis"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === "login"
                  ? "Entre para continuar usando a plataforma"
                  : "Comece agora, é 100% grátis"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Seu nome"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus={mode === "login"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Senha
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={mode === "register" ? 8 : 1}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-3 text-base"
            >
              {isPending
                ? "Aguarde..."
                : mode === "login"
                ? "Entrar na plataforma"
                : "Criar conta grátis"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-primary-600 hover:underline font-medium"
            >
              {mode === "login" ? "Criar conta grátis" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
