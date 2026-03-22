import { useState } from "react";
import { useAuthStore } from "../store/auth";
import { useActionGate } from "../hooks/useActionGate";
import LoginModal from "../components/LoginModal";
import PricingModal from "../components/PricingModal";

const SUBJECT_GROUPS = [
  {
    label: "Concursos Públicos",
    items: [
      "Matemática",
      "Português",
      "Raciocínio Lógico",
      "Direito Constitucional",
      "Direito Administrativo",
      "Direito Civil",
      "Direito Penal",
      "Direito Processual Civil",
      "Direito Tributário",
      "Administração Pública",
      "Informática",
      "História",
      "Geografia",
      "Atualidades",
      "Economia",
      "Contabilidade Pública",
    ],
  },
  {
    label: "Exatas & Tecnologia",
    items: [
      "Cálculo I",
      "Cálculo II",
      "Álgebra Linear",
      "Cálculo Numérico",
      "Física I",
      "Física II",
      "Química Geral",
      "Estatística",
      "Matemática Financeira",
      "Programação",
      "Banco de Dados",
      "Estrutura de Dados",
      "Sistemas Operacionais",
      "Redes de Computadores",
      "Engenharia de Software",
      "Inteligência Artificial",
      "Arquitetura de Computadores",
    ],
  },
  {
    label: "Humanas & Sociais",
    items: [
      "Filosofia",
      "Sociologia",
      "Psicologia",
      "Pedagogia",
      "Ciências Políticas",
      "Relações Internacionais",
      "Antropologia",
      "Comunicação Social",
      "Inglês Técnico",
      "Literatura Brasileira",
      "Redação Acadêmica",
    ],
  },
  {
    label: "Saúde",
    items: [
      "Anatomia",
      "Fisiologia",
      "Biologia Celular",
      "Bioquímica",
      "Farmacologia",
      "Microbiologia",
      "Patologia",
      "Nutrição",
      "Enfermagem",
      "Odontologia",
      "Saúde Pública",
    ],
  },
  {
    label: "Negócios & Gestão",
    items: [
      "Administração",
      "Contabilidade",
      "Marketing",
      "Gestão de Projetos",
      "Empreendedorismo",
      "Logística",
      "Recursos Humanos",
      "Finanças Corporativas",
      "Direito Empresarial",
      "Economia",
    ],
  },
  {
    label: "Engenharia",
    items: [
      "Engenharia Civil",
      "Engenharia Mecânica",
      "Engenharia Elétrica",
      "Engenharia Química",
      "Engenharia de Produção",
      "Resistência dos Materiais",
      "Termodinâmica",
      "Mecânica dos Fluidos",
      "Eletromagnetismo",
      "Circuitos Elétricos",
      "Cálculo Diferencial",
      "Equações Diferenciais",
      "Desenho Técnico",
      "Gestão da Qualidade",
    ],
  },
  {
    label: "Educação & Licenciatura",
    items: [
      "Didática",
      "Psicologia da Educação",
      "Pedagogia",
      "Metodologia do Ensino",
      "Educação Inclusiva",
      "Gestão Escolar",
      "Currículo e Avaliação",
      "Educação Infantil",
      "Docência no Ensino Superior",
      "Tecnologia na Educação",
      "Libras",
    ],
  },
  {
    label: "Ciências Agrárias",
    items: [
      "Agronomia",
      "Zootecnia",
      "Medicina Veterinária",
      "Biologia",
      "Ecologia",
      "Botânica",
      "Zoologia",
      "Genética",
      "Microbiologia Agrícola",
      "Solos e Adubação",
    ],
  },
];

const SUBJECTS = SUBJECT_GROUPS.flatMap((g) => g.items);

interface WikiResult {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
}

export default function SearchPage() {
  const gate = useActionGate();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;

    gate.gateAction(
      "search",
      async () => {
        setLoading(true);
        setError("");
        setResults([]);
        setSearched(true);
        try {
          const term = encodeURIComponent(`${query} ${subject}`);
          const res = await fetch(
            `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${term}&format=json&origin=*&srlimit=5`
          );
          const data = await res.json();
          const titles: string[] = data.query?.search?.map((r: { title: string }) => r.title) || [];

          if (titles.length === 0) {
            setResults([]);
            setLoading(false);
            return;
          }

          const summaries = await Promise.all(
            titles.slice(0, 4).map((t) =>
              fetch(
                `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`
              ).then((r) => r.json())
            )
          );
          setResults(summaries);
        } catch {
          setError("Erro ao buscar na Wikipédia. Tente novamente.");
        } finally {
          setLoading(false);
        }
      },
      "Pesquisa na Wikipédia"
    );
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pesquisar</h1>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 text-sm mb-1">Pesquisa na Wikipédia</h2>
        <p className="text-xs text-gray-400 mb-5">
          Pesquise conteúdos relacionados às suas matérias sem sair da plataforma
        </p>

        {/* Subject + query */}
        <div className="flex gap-3 mb-4">
          <select
            className="input w-56 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="input flex-1 text-sm"
              placeholder={`Pesquisar sobre ${subject}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={doSearch}
              disabled={loading || !query.trim()}
              className="btn-primary px-5 text-sm rounded-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Buscando
                </span>
              ) : (
                "Buscar"
              )}
            </button>
            {(query || searched) && (
              <button
                onClick={handleClear}
                className="border border-gray-200 text-gray-500 px-4 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Status badge */}
        {!gate.showPricing && !gate.showLogin && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-primary-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Fonte: Wikipédia em Português
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nenhum resultado encontrado para "{query}" em {subject}.
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-5">
            {results.map((r) => (
              <div key={r.title} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <div className="flex items-start gap-4">
                  {r.thumbnail?.source && (
                    <img
                      src={r.thumbnail.source}
                      alt={r.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-primary-600 rounded-full font-medium">
                        {subject}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                      {r.extract}
                    </p>
                    {r.content_urls?.desktop?.page && (
                      <a
                        href={r.content_urls.desktop.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 text-xs mt-2 hover:underline font-medium"
                      >
                        Ver artigo completo
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-sm">Digite um termo e selecione a matéria para pesquisar</p>
          </div>
        )}
      </div>

      {gate.showLogin && (
        <LoginModal onClose={() => gate.setShowLogin(false)} />
      )}
      {gate.showPricing && (
        <PricingModal
          onClose={() => gate.setShowPricing(false)}
          feature={gate.pricingFeature}
        />
      )}
    </div>
  );
}
