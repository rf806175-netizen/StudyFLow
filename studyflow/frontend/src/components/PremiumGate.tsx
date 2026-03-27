import { useAuthStore } from "../store/auth";
import { useCheckout } from "../hooks/useCheckout";

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
}

export default function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium } = useAuthStore();
  const { checkoutMonthly, checkoutYearly, isPending } = useCheckout();

  if (isPremium()) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="mb-4 text-5xl">⭐</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Funcionalidade Premium
      </h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        {feature
          ? `${feature} está disponível apenas no plano Premium.`
          : "Este recurso está disponível apenas no plano Premium."}
        {" "}Faça upgrade para desbloquear relatórios, tutorias e muito mais.
      </p>
      <div className="flex gap-3">
        <button
          onClick={checkoutMonthly}
          disabled={isPending}
          className="btn-primary text-base px-6 py-3 disabled:opacity-60"
        >
          {isPending ? "Redirecionando..." : "Assinar R$ 25/mês"}
        </button>
        <button
          onClick={checkoutYearly}
          disabled={isPending}
          className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold text-base px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {isPending ? "Redirecionando..." : "R$ 250/ano ⭐"}
        </button>
      </div>
    </div>
  );
}
