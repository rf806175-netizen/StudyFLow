import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
}

export default function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium } = useAuthStore();
  const navigate = useNavigate();

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
      <button
        onClick={() => navigate("/payments")}
        className="btn-primary text-base px-6 py-3"
      >
        Ver planos Premium
      </button>
    </div>
  );
}
