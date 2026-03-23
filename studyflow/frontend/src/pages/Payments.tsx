import { useQuery, useMutation } from "@tanstack/react-query";
import { paymentsApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useSearchParams, useNavigate } from "react-router-dom";

const FREE_FEATURES = [
  { label: "Até 5 matérias cadastradas", ok: true },
  { label: "Sessões de estudo com cronômetro", ok: true },
  { label: "Calendário e agenda semanal", ok: true },
  { label: "Upload de materiais (local)", ok: true },
  { label: "Treino de apresentação TCC", ok: true },
  { label: "Relatórios de desempenho", ok: false },
  { label: "Matérias ilimitadas", ok: false },
  { label: "Tutoria personalizada", ok: false },
  { label: "Suporte prioritário", ok: false },
];

const PREMIUM_FEATURES = [
  "Matérias ilimitadas",
  "Relatórios detalhados de desempenho",
  "Tutoria personalizada",
  "Suporte prioritário",
  "Histórico completo de sessões",
  "Novidades antecipadas",
];

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ["payments", "prices"],
    queryFn: paymentsApi.prices,
  });

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => paymentsApi.createCheckout(priceId),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: any) => { alert("Erro ao iniciar pagamento: " + (err?.message || "Tente novamente")); },
  });

  const portalMutation = useMutation({
    mutationFn: paymentsApi.createPortal,
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: any) => { alert("Erro ao abrir portal: " + (err?.message || "Tente novamente")); },
  });

  if (!user) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Minha Assinatura</h1>
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">Faça login para ver sua assinatura.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">Fazer login</button>
        </div>
      </div>
    );
  }

  const isPremium = user.subscriptionTier === "premium";
  const expiresAt = user.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Minha Assinatura</h1>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Assinatura ativada com sucesso! Bem-vindo ao Premium.
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pagamento cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      {/* Status card */}
      {isPremium && !isExpired ? (
        /* ── PREMIUM ATIVO ── */
        <div
          className="rounded-2xl p-6 relative overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #0d1b35 0%, #1e3a8a 60%, #2563eb 100%)" }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", transform: "translate(30%,-30%)" }}
          />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Plano</p>
                  <p className="text-white font-extrabold text-2xl leading-tight">Premium</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 bg-green-400/20 border border-green-400/40 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Ativo
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Titular</p>
                <p className="text-white text-sm font-semibold truncate">{user.fullName}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Válido até</p>
                <p className="text-white text-sm font-semibold">
                  {expiresAt ? expiresAt.toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Dias restantes</p>
                <p className={`text-sm font-bold ${daysLeft !== null && daysLeft <= 7 ? "text-yellow-300" : "text-white"}`}>
                  {daysLeft !== null ? `${daysLeft} dias` : "—"}
                </p>
              </div>
            </div>

            {daysLeft !== null && daysLeft <= 7 && (
              <div className="mt-4 p-3 bg-yellow-400/20 border border-yellow-400/30 rounded-xl">
                <p className="text-yellow-200 text-xs font-medium">
                  ⚠ Sua assinatura vence em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}. Renove para não perder o acesso.
                </p>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="flex items-center gap-2 bg-white text-primary-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow"
              >
                {portalMutation.isPending ? "Redirecionando..." : "Gerenciar assinatura"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── FREE / EXPIRADO ── */
        <>
          {/* Status atual */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {isExpired ? "Premium expirado" : "Plano Gratuito"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isExpired
                      ? `Expirou em ${expiresAt?.toLocaleDateString("pt-BR")}`
                      : "Recursos limitados — faça upgrade para desbloquear tudo"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                isExpired
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {isExpired ? "Expirado" : "Gratuito"}
              </span>
            </div>
          </div>

          {/* Comparativo de planos */}
          <div className="card">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
              Comparativo de Planos
            </p>
            <div className="divide-y divide-gray-50">
              {FREE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center justify-between py-2.5">
                  <span className={`text-sm ${f.ok ? "text-gray-700" : "text-gray-400"}`}>{f.label}</span>
                  <div className="flex gap-6">
                    {/* Free */}
                    <div className="w-12 flex justify-center">
                      {f.ok ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    {/* Premium */}
                    <div className="w-14 flex justify-center">
                      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              {/* Header labels */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-[10px] text-transparent">—</span>
                <div className="flex gap-6">
                  <span className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Free</span>
                  <span className="w-14 text-center text-[10px] font-bold uppercase tracking-widest text-primary-600">Premium</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de preço */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mensal */}
            <div className="card border border-gray-200 hover:border-primary-300 transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Mensal</p>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-gray-900">R$ 25</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-2 mb-5">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {pricesLoading ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <button
                  onClick={() => prices && checkoutMutation.mutate(prices.monthly.priceId)}
                  disabled={checkoutMutation.isPending}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm"
                >
                  {checkoutMutation.isPending ? "Redirecionando..." : "Assinar mensal"}
                </button>
              )}
            </div>

            {/* Anual — destaque */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden text-white"
              style={{ background: "linear-gradient(135deg, #0d1b35 0%, #1e3a8a 60%, #2563eb 100%)" }}
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", transform: "translate(30%,-30%)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Anual</p>
                  <span className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Mais popular</span>
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-extrabold text-white">R$ 250</span>
                  <span className="text-blue-300 text-sm">/ano</span>
                </div>
                <p className="text-green-300 text-xs font-bold mb-4">Economize 87% vs mensal</p>
                <ul className="space-y-2 mb-5">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-blue-100">
                      <svg className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {pricesLoading ? (
                  <div className="h-10 bg-white/20 rounded-xl animate-pulse" />
                ) : (
                  <button
                    onClick={() => prices && checkoutMutation.mutate(prices.yearly.priceId)}
                    disabled={checkoutMutation.isPending}
                    className="w-full py-2.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-blue-50 transition-colors shadow"
                  >
                    {checkoutMutation.isPending ? "Redirecionando..." : "Assinar anual — melhor custo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Benefícios premium – só mostra para premium ativo */}
      {isPremium && !isExpired && (
        <div className="card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
            Seus Benefícios Premium
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 p-3 bg-primary-50 rounded-xl">
                <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-primary-800 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
