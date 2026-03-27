import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/auth";
import { ApiError } from "../api/client";

const FEATURES = [
  "Cronômetro de sessões em tempo real",
  "Calendário e agenda integrados",
  "Upload e gestão de materiais",
  "Pesquisa rápida na Wikipédia",
  "Relatórios detalhados de progresso",
  "Treino de apresentação de TCC com cronômetro",
];

export default function Login() {
  const { login } = useAuth();
  const { setGuestMode } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Email ou senha incorretos");
    }
  };

  const handleExplore = () => {
    setGuestMode(true);
    navigate("/dashboard");
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  return (
    <>
    {showForgot && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
          {forgotSent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">E-mail enviado!</h3>
              <p className="text-sm text-gray-500 mb-6">
                Se o endereço <strong>{forgotEmail}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
              </p>
              <button
                onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                className="btn-primary w-full py-2.5 rounded-xl"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Recuperar senha</h3>
              <p className="text-sm text-gray-400 mb-6">Informe seu e-mail para receber o link de recuperação.</p>
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">E-mail</label>
                  <input
                    type="email"
                    className="input py-3 text-base"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3 rounded-xl">
                  Enviar link de recuperação
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-1"
                >
                  Cancelar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )}
    <div className="min-h-screen flex">
      {/* Left panel – dark navy */}
      <div
        className="hidden lg:flex flex-col justify-center px-16 w-[45%] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0b1426 0%, #0f1e3d 60%, #0d2460 100%)" }}
      >
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        <div className="relative z-10">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold">
              <span className="text-white">Study</span>
              <span className="text-blue-400">Flow</span>
            </h1>
            <p className="text-blue-200 mt-3 text-base leading-relaxed max-w-xs">
              Organize seus estudos, acompanhe seu progresso e alcance seus objetivos.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white leading-tight mb-3">
              Quem estuda com método,
              <br />
              <span className="text-blue-400">chega primeiro.</span>
            </h2>
            <p className="text-blue-200/80 text-sm leading-relaxed max-w-sm">
              Milhares de estudantes transformam horas de estudo em aprovação e em
              apresentações de TCC impecáveis usando o StudyFlow. Você também pode.
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-blue-100/90 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* TCC highlight card */}
          <div
            className="mb-10 rounded-2xl p-4 border border-blue-400/30"
            style={{ background: "rgba(37,99,235,0.18)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold text-sm">TCC sem travar na apresentação</p>
                  <span className="text-[10px] font-bold bg-blue-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Novo</span>
                </div>
                <p className="text-blue-200/80 text-xs leading-relaxed">
                  Simule sua defesa com cronômetro por slide, anotações e feedback automático. Chegue na banca preparado e confiante.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleExplore}
            className="flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors text-sm w-fit"
          >
            <span>▷</span> Explorar a plataforma
          </button>
          <p className="text-blue-300/50 text-xs mt-2">
            Sem precisar fazer login — apenas visualização
          </p>
        </div>
      </div>

      {/* Right panel – white */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 bg-white">
        <div className="lg:hidden mb-8 text-center">
          <h1 className="text-3xl font-extrabold">
            <span className="text-gray-900">Study</span>
            <span className="text-primary-600">Flow</span>
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Bem-vindo ao StudyFlow</h2>
            <p className="text-gray-400 mt-1 text-sm">
              Entre na plataforma para continuar estudando
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
                Email
              </label>
              <input
                type="email"
                className="input py-3 text-base"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary-600 hover:underline font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                className="input py-3 text-base"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="btn-primary w-full py-3.5 text-base rounded-xl"
            >
              {login.isPending ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Não tem conta?{" "}
            <Link to="/register" className="text-primary-600 hover:underline font-semibold">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
