interface PricingModalProps {
  onClose: () => void;
  feature?: string;
}

export default function PricingModal({ onClose, feature }: PricingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="p-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
              Acesso Premium
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Continue evoluindo nos estudos
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {feature
              ? `"${feature}" exige um plano pago.`
              : "Você já usou seu acesso gratuito."}{" "}
            Escolha o plano que combina com você e continue sem limites.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Mensal */}
            <div className="border-2 border-primary-600 rounded-xl p-5 relative bg-primary-50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                MAIS POPULAR
              </div>
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-gray-900">Mensal</div>
                <div className="text-3xl font-extrabold text-primary-600 mt-1">
                  R$25
                  <span className="text-sm font-normal text-gray-500">/mês</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-primary-600">✓</span> Organização ilimitada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-600">✓</span> Pesquisa Wikipedia ilimitada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-600">✓</span> Upload de materiais
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-600">✓</span> Relatórios de progresso
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-600">✓</span> 1 usuário
                </li>
              </ul>
              <button className="btn-primary w-full">Assinar Mensal</button>
            </div>

            {/* Anual */}
            <div className="border-2 border-primary-500 rounded-xl p-5 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Melhor custo
              </span>
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-gray-900">Anual</div>
                <div className="text-3xl font-extrabold text-gray-800 mt-1">
                  R$250
                  <span className="text-sm font-normal text-gray-500">/ano</span>
                </div>
                <div className="text-xs text-green-600 font-semibold mt-1">Economize 87% vs mensal</div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Tudo do plano Mensal
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 12 meses de acesso
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Relatórios completos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Novidades antecipadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Suporte prioritário
                </li>
              </ul>
              <button className="btn-primary w-full">
                Assinar Anual
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Cancele quando quiser · Sem fidelidade · Pagamento seguro
          </p>
        </div>
      </div>
    </div>
  );
}
