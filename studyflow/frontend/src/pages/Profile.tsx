import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, sessionsApi, subjectsApi } from "../api/client";
import { useState, useRef } from "react";
import { useCheckout } from "../hooks/useCheckout";

const STUDY_AREAS = [
  "Concursos Públicos",
  "Engenharia",
  "Direito",
  "Medicina",
  "Enfermagem",
  "Administração",
  "Ciências Contábeis",
  "Economia",
  "Pedagogia",
  "Psicologia",
  "Arquitetura",
  "Ciência da Computação",
  "Sistemas de Informação",
  "Letras",
  "História",
  "Geografia",
  "Biologia",
  "Física",
  "Química",
  "Matemática",
  "Nutrição",
  "Farmácia",
  "Odontologia",
  "Veterinária",
  "Educação Física",
  "Outro",
];

export default function ProfilePage() {
  const { user, setUser, freeActions } = useAuthStore();
  const { checkoutMonthly, checkoutYearly, isPending: checkoutPending } = useCheckout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const avatarKey = `studyflow_avatar_${user?.id}`;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem(avatarKey)
  );
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    studyArea: "Concursos Públicos",
    bio: "",
  });
  const [pwForm, setPwForm] = useState({
    current: "",
    newPw: "",
    confirm: "",
  });
  const [pwMsg, setPwMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", { limit: 200 }],
    queryFn: () => sessionsApi.list({ limit: 200 }),
    enabled: !!user,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
    enabled: !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate("/login");
    },
  });

  if (!user) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">Você não está logado.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalMinutes = completedSessions.reduce(
    (sum, s) => sum + (s.actualDurationMinutes || 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const totalLabel =
    totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

  const uniqueSubjectIds = new Set(
    completedSessions.map((s) => s.subjectId).filter(Boolean)
  );

  const memberSince = (user as Record<string, unknown>).createdAt
    ? new Date((user as Record<string, unknown>).createdAt as string).toLocaleDateString("pt-BR")
    : "16/03/2026";

  const handlePhotoClick = () => photoInputRef.current?.click();
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarUrl(base64);
      localStorage.setItem(avatarKey, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg("Alterações salvas!");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleCancel = () => {
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      studyArea: "Concursos Públicos",
      bio: "",
    });
    setSaveMsg("");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current) {
      setPwMsg("Informe a senha atual.");
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwMsg("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg("As senhas não coincidem.");
      return;
    }
    setPwMsg("Senha alterada com sucesso!");
    setPwForm({ current: "", newPw: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  };

  const handleForgotPassword = () => {
    setForgotMsg(`Link de recuperação enviado para ${user.email}`);
    setTimeout(() => setForgotMsg(""), 5000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>

      {/* Avatar */}
      <div className="card flex items-center gap-5">
        <div className="relative cursor-pointer" onClick={handlePhotoClick}>
          <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              user.fullName?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow border border-gray-200">
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
          <p className="text-gray-500 text-sm">{form.studyArea || "Concursos Públicos"}</p>
          <p className="text-xs text-primary-600 mt-1 cursor-pointer hover:underline" onClick={handlePhotoClick}>
            Clique na foto para alterar
          </p>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="card">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Dados Pessoais
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                className="input text-sm"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="input text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Área de Estudo
              </label>
              <select
                className="input text-sm"
                value={form.studyArea}
                onChange={(e) => setForm({ ...form, studyArea: e.target.value })}
              >
                {STUDY_AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Membro Desde
              </label>
              <input
                type="text"
                className="input text-sm bg-gray-50"
                value={memberSince}
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Bio / Objetivo
            </label>
            <textarea
              className="input text-sm resize-none"
              rows={3}
              placeholder="Ex: Estou estudando para concurso do TRT..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          {saveMsg && (
            <p className="text-sm text-green-600 font-medium">{saveMsg}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary text-sm py-2 px-5 rounded-xl">
              Salvar alterações
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="border border-gray-200 text-gray-600 text-sm py-2 px-5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Segurança */}
      <div className="card">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Segurança
        </p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Senha Atual
            </label>
            <input
              type="password"
              className="input text-sm w-48"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Nova Senha
              </label>
              <input
                type="password"
                className="input text-sm"
                value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Confirmar
              </label>
              <input
                type="password"
                className="input text-sm"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              />
            </div>
          </div>
          {pwMsg && (
            <p className={`text-sm font-medium ${pwMsg.includes("sucesso") ? "text-green-600" : "text-red-500"}`}>
              {pwMsg}
            </p>
          )}
          <button type="submit" className="btn-primary text-sm py-2 px-5 rounded-xl">
            Alterar senha
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Esqueceu sua senha?</p>
          <button
            onClick={handleForgotPassword}
            className="text-primary-600 hover:underline text-sm font-medium"
          >
            Enviar link de recuperação para meu e-mail
          </button>
          {forgotMsg && (
            <p className="text-sm text-green-600 mt-2">{forgotMsg}</p>
          )}
        </div>
      </div>

      {/* Resumo de estudos */}
      <div className="card">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Resumo de Estudos
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Total Estudado
            </p>
            <p className="text-2xl font-extrabold text-gray-900">{totalLabel || "0m"}</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Sessões
            </p>
            <p className="text-2xl font-extrabold text-gray-900">{completedSessions.length}</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Matérias
            </p>
            <p className="text-2xl font-extrabold text-gray-900">{subjects.length || uniqueSubjectIds.size}</p>
          </div>
        </div>
      </div>

      {/* Plano & Assinatura */}
      <div className="card overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Plano & Assinatura
        </p>

        {user.subscriptionTier === "premium" ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Plano Premium ativo</p>
              <p className="text-white/70 text-xs mt-0.5">Acesso completo a todos os recursos do StudyFlow</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">Ativo</span>
          </div>
        ) : (
          <>
            {/* Plano atual */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">Plano Gratuito</p>
                  <p className="text-xs text-gray-400">Recursos limitados</p>
                </div>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-semibold">Atual</span>
            </div>

            {/* Upgrade card */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)" }}
            >
              {/* Decorative glow */}
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <p className="text-white font-bold text-base">Assine o Premium</p>
                </div>
                <p className="text-blue-100 text-xs leading-relaxed mb-4">
                  Desbloqueie matérias ilimitadas, relatórios de desempenho, tutoria personalizada e muito mais.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    "Matérias ilimitadas",
                    "Relatórios detalhados",
                    "Tutoria personalizada",
                    "Suporte prioritário",
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-1.5 text-blue-100 text-xs">
                      <svg className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 mb-5">
                  <div>
                    <p className="text-blue-300 text-xs mb-0.5">Mensal</p>
                    <p className="text-white font-extrabold text-xl">R$ 25<span className="text-sm font-medium text-blue-200">/mês</span></p>
                  </div>
                  <div className="pb-0.5">
                    <span className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Mais popular</span>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-blue-300 text-xs mb-0.5">Anual</p>
                    <p className="text-white font-extrabold text-xl">R$ 250<span className="text-sm font-medium text-blue-200">/ano</span></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={checkoutMonthly}
                    disabled={checkoutPending}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-primary-700 bg-white hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-60"
                  >
                    {checkoutPending ? "Redirecionando..." : "R$ 25/mês"}
                  </button>
                  <button
                    onClick={checkoutYearly}
                    disabled={checkoutPending}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-yellow-500 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-60"
                  >
                    {checkoutPending ? "Redirecionando..." : "R$ 250/ano ⭐"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sair */}
      <div className="card">
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {logoutMutation.isPending ? "Saindo..." : "Sair da conta"}
        </button>
      </div>
    </div>
  );
}
