import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/auth";
import { ApiError } from "../api/client";

const BENEFITS = [
  "Organize seus estudos com calendário inteligente",
  "Cronometre cada sessão e veja seu progresso",
  "Pesquise conteúdos direto na Wikipédia",
  "Faça upload de materiais e acesse de qualquer lugar",
];

export default function Register() {
  const { register } = useAuth();
  const { setGuestMode } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", fullName: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register.mutateAsync(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar conta");
    }
  };

  const handleExplore = () => {
    setGuestMode(true);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-center px-16 w-[45%] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0b1426 0%, #0f1e3d 60%, #0d2460 100%)" }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold">
              <span className="text-white">Study</span>
              <span className="text-blue-400">Flow</span>
            </h1>
            <p className="text-blue-200/80 mt-3 text-base leading-relaxed max-w-xs">
              A plataforma que transforma a sua rotina de estudos.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white leading-tight mb-3">
              Sua aprovação começa
              <br />
              <span className="text-blue-400">com um plano.</span>
            </h2>
            <p className="text-blue-200/80 text-sm leading-relaxed max-w-sm">
              Pare de estudar sem direção. Com o StudyFlow você sabe exatamente onde está e
              para onde vai.
            </p>
          </div>

          <ul className="space-y-3 mb-12">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-blue-100/90 text-sm">
                <span className="text-blue-400 font-bold">✓</span>
                {b}
              </li>
            ))}
          </ul>

          <button
            onClick={handleExplore}
            className="flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors text-sm w-fit"
          >
            <span>▷</span> Ver a plataforma
          </button>
          <p className="text-blue-300/50 text-xs mt-2">Sem precisar se cadastrar</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 bg-white">
        <div className="lg:hidden mb-8 text-center">
          <h1 className="text-3xl font-extrabold">
            <span className="text-gray-900">Study</span>
            <span className="text-primary-600">Flow</span>
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Criar conta grátis</h2>
            <p className="text-gray-400 mt-1 text-sm">
              Comece agora e organize seus estudos do jeito certo
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Nome completo
              </label>
              <input
                type="text"
                className="input py-3 text-base"
                placeholder="Seu nome"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                className="input py-3 text-base"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Senha
              </label>
              <input
                type="password"
                className="input py-3 text-base"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="btn-primary w-full py-3.5 text-base rounded-xl"
            >
              {register.isPending ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary-600 hover:underline font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
