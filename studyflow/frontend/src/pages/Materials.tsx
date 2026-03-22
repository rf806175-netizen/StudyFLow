import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "../store/auth";
import { useActionGate } from "../hooks/useActionGate";
import LoginModal from "../components/LoginModal";
import PricingModal from "../components/PricingModal";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  subject: string;
  url: string;
  addedAt: string;
}

const SUBJECTS = [
  { name: "Sem categoria", color: "#6b7280" },
  // Concursos Públicos
  { name: "Matemática", color: "#2563eb" },
  { name: "Português", color: "#16a34a" },
  { name: "Raciocínio Lógico", color: "#d97706" },
  { name: "Direito Constitucional", color: "#7c3aed" },
  { name: "Direito Administrativo", color: "#6d28d9" },
  { name: "Informática", color: "#0891b2" },
  // Matérias da Faculdade
  { name: "Cálculo I", color: "#1d4ed8" },
  { name: "Cálculo II", color: "#1e40af" },
  { name: "Álgebra Linear", color: "#7c3aed" },
  { name: "Física I", color: "#dc2626" },
  { name: "Física II", color: "#b91c1c" },
  { name: "Química Geral", color: "#7c2d12" },
  { name: "Biologia Celular", color: "#14532d" },
  { name: "Programação", color: "#16a34a" },
  { name: "Banco de Dados", color: "#0891b2" },
  { name: "Estrutura de Dados", color: "#0e7490" },
  { name: "Sistemas Operacionais", color: "#6d28d9" },
  { name: "Redes de Computadores", color: "#d97706" },
  { name: "Engenharia de Software", color: "#059669" },
  { name: "Direito Civil", color: "#4338ca" },
  { name: "Administração", color: "#0369a1" },
  { name: "Economia", color: "#15803d" },
  { name: "Contabilidade", color: "#b45309" },
  { name: "Matemática Financeira", color: "#4338ca" },
  { name: "Estatística", color: "#be185d" },
  { name: "História", color: "#713f12" },
  { name: "Geografia", color: "#064e3b" },
  { name: "Filosofia", color: "#1e3a5f" },
  { name: "Sociologia", color: "#4a1942" },
  { name: "Inglês Técnico", color: "#1e40af" },
];

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.includes("pdf")) return <span className="text-red-500 text-lg">📄</span>;
  if (type.includes("image")) return <span className="text-blue-500 text-lg">🖼️</span>;
  if (type.includes("word") || type.includes("docx")) return <span className="text-blue-700 text-lg">📝</span>;
  if (type.includes("sheet") || type.includes("csv")) return <span className="text-green-600 text-lg">📊</span>;
  return <span className="text-gray-500 text-lg">📎</span>;
}

export default function MaterialsPage() {
  const { user } = useAuthStore();
  const gate = useActionGate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("Sem categoria");
  const [filterSubject, setFilterSubject] = useState("Todos os arquivos");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (rawFiles: FileList) => {
    gate.gateAction(
      "organize",
      () => {
        const newItems: FileItem[] = Array.from(rawFiles).map((f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          type: f.type,
          subject: selectedSubject,
          url: URL.createObjectURL(f),
          addedAt: new Date().toISOString(),
        }));
        setFiles((prev) => [...prev, ...newItems]);
      },
      "Upload de materiais"
    );
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [selectedSubject, gate]
  );

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const displayed =
    filterSubject === "Todos os arquivos"
      ? files
      : files.filter((f) => f.subject === filterSubject);

  const countBySubject = (name: string) =>
    name === "Todos os arquivos"
      ? files.length
      : files.filter((f) => f.subject === name).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Materiais de Estudo</h1>
      </div>

      <div className="flex gap-4">
        {/* Upload area */}
        <div className="card flex-1">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Upload de materiais</h2>
          <p className="text-xs text-gray-400 mb-4">Selecione a matéria e envie seus arquivos</p>

          {/* Subject select */}
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Matéria:
            </label>
            <select
              className="input text-sm"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-4
              ${dragging
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-primary-400 hover:bg-gray-50"}
            `}
          >
            <div className="text-4xl mb-3 text-gray-300">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-600 text-sm">Arraste ou clique para enviar</p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOCX, TXT, imagens, planilhas — qualquer formato
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* Files list */}
          {displayed.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum arquivo ainda.</p>
          ) : (
            <ul className="space-y-2">
              {displayed.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <FileIcon type={f.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">
                      {fmtSize(f.size)} · {f.subject}
                    </p>
                  </div>
                  <a
                    href={f.url}
                    download={f.name}
                    className="text-primary-500 hover:text-primary-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Baixar
                  </a>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right – organize by subject */}
        <div className="card w-64">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Organizar por matéria</h2>
          <p className="text-xs text-gray-400 mb-4">Filtrar por categoria</p>

          <ul className="space-y-1">
            {[...SUBJECTS.slice(1), { name: "Todos os arquivos", color: "#2563eb" }].map((s) => (
              <li key={s.name}>
                <button
                  onClick={() => setFilterSubject(s.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    filterSubject === s.name
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span
                    className={`flex-1 text-left font-medium ${
                      filterSubject === s.name ? "text-primary-700" : "text-gray-700"
                    }`}
                  >
                    {s.name}
                  </span>
                  <span className="text-xs text-gray-400">{countBySubject(s.name)} arquivos</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
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
