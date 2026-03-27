import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";

const UNIVERSITY_SUBJECTS = [
  "Cálculo I", "Cálculo II", "Álgebra Linear", "Física I", "Física II",
  "Química Geral", "Biologia Celular", "Programação", "Banco de Dados",
  "Estrutura de Dados", "Sistemas Operacionais", "Redes de Computadores",
  "Engenharia de Software", "Direito Civil", "Direito Constitucional",
  "Administração", "Economia", "Contabilidade", "Matemática Financeira",
  "Estatística", "Português", "Matemática", "Raciocínio Lógico",
  "Informática", "História", "Geografia", "Filosofia", "Inglês Técnico",
  "Psicologia", "Pedagogia", "Arquitetura", "Medicina", "Enfermagem",
  "Nutrição", "Farmácia", "Odontologia", "Veterinária", "Educação Física",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

interface Slide {
  id: string;
  title: string;
  notes: string;
  duration: number; // target seconds
  fileName?: string;
  fileUrl?: string;
}

export default function TCCPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(UNIVERSITY_SUBJECTS[0]);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [slides, setSlides] = useState<Slide[]>([
    { id: crypto.randomUUID(), title: "Introdução", notes: "", duration: 120 },
    { id: crypto.randomUUID(), title: "Desenvolvimento", notes: "", duration: 300 },
    { id: crypto.randomUUID(), title: "Conclusão", notes: "", duration: 120 },
  ]);
  const [mode, setMode] = useState<"edit" | "present">("edit");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const totalPlanned = slides.reduce((sum, s) => sum + s.duration, 0);

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: `Slide ${prev.length + 1}`, notes: "", duration: 120 },
    ]);
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlide = (id: string, field: keyof Slide, value: string | number) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleFileUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      setSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, fileName: file.name, fileUrl } : s))
      );
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, fileName: undefined, fileUrl: undefined } : s))
    );
  };

  const startPresentation = () => {
    setCurrentSlide(0);
    setElapsedSecs(0);
    setRunning(true);
    setMode("present");
    setFeedback("");
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((c) => c + 1);
    } else {
      finishPresentation();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide((c) => c - 1);
  };

  const finishPresentation = () => {
    setRunning(false);
    const diff = elapsedSecs - totalPlanned;
    if (Math.abs(diff) <= 30) {
      setFeedback("Excelente! Você terminou dentro do tempo planejado.");
    } else if (diff > 0) {
      setFeedback(`Atenção: você passou ${fmtTime(diff)} do tempo planejado. Tente ser mais conciso.`);
    } else {
      setFeedback(`Você terminou ${fmtTime(Math.abs(diff))} antes do planejado. Você pode explorar mais os tópicos.`);
    }
    setMode("edit");
  };

  const slide = slides[currentSlide];
  const slideTimeLimit = slide?.duration || 0;
  const overTime = elapsedSecs > totalPlanned;

  if (!user) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">TCC — Treino de Apresentação</h1>
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">Faça login para usar este recurso.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">TCC — Treino de Apresentação</h1>
          <p className="text-sm text-gray-400 mt-0.5">Organize seu TCC e pratique a apresentação com cronômetro</p>
        </div>
        {mode === "edit" && slides.length > 0 && title && (
          <button
            onClick={startPresentation}
            className="btn-primary flex items-center gap-2 text-sm rounded-xl py-2.5 px-5"
          >
            <span>▶</span> Iniciar apresentação
          </button>
        )}
      </div>

      {/* Presentation Mode */}
      {mode === "present" && slide && (
        <div className="card border-2 border-primary-200 bg-primary-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                Slide {currentSlide + 1} de {slides.length}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{slide.title}</h2>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-mono font-extrabold ${overTime ? "text-red-600" : "text-primary-700"}`}>
                {fmtTime(elapsedSecs)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Planejado: {fmtTime(totalPlanned)}
              </p>
            </div>
          </div>

          {slide.fileUrl && slide.fileUrl.startsWith("data:image") && (
            <div className="bg-white rounded-xl p-3 mb-4 border border-primary-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Arquivo do slide</p>
              <img src={slide.fileUrl} alt={slide.fileName} className="max-h-48 rounded-lg object-contain mx-auto" />
            </div>
          )}
          {slide.fileName && !slide.fileUrl?.startsWith("data:image") && (
            <div className="bg-white rounded-xl p-3 mb-4 border border-primary-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-xs text-primary-700 font-medium">{slide.fileName}</span>
            </div>
          )}
          {slide.notes && (
            <div className="bg-white rounded-xl p-4 mb-4 border border-primary-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Anotações deste slide</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{slide.notes}</p>
            </div>
          )}

          {/* Progress bar for this slide */}
          <div className="mb-4">
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < currentSlide
                      ? "bg-primary-600"
                      : i === currentSlide
                      ? "bg-primary-400"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-medium hover:bg-white disabled:opacity-40 text-sm transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={nextSlide}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm flex-1"
            >
              {currentSlide < slides.length - 1 ? "Próximo →" : "Finalizar apresentação"}
            </button>
            <button
              onClick={finishPresentation}
              className="border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              Encerrar
            </button>
          </div>
        </div>
      )}

      {/* Feedback after presentation */}
      {feedback && (
        <div className="card border border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <p className="font-semibold text-green-800 text-sm">Resultado da apresentação</p>
              <p className="text-sm text-green-700 mt-1">{feedback}</p>
            </div>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="flex gap-5">
          {/* Left – TCC info */}
          <div className="flex flex-col gap-5 flex-1">
            {/* Info do TCC */}
            <div className="card">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Informações do TCC</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Matéria / Área
                  </label>
                  <select
                    className="input text-sm"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    {UNIVERSITY_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Título do TCC
                  </label>
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder="Ex: Impacto da IA no mercado de trabalho"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Resumo / Introdução
                  </label>
                  <textarea
                    className="input text-sm resize-none"
                    rows={3}
                    placeholder="Descreva brevemente o tema e objetivo do seu TCC..."
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Slides */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Slides da Apresentação
                </p>
                <button
                  onClick={addSlide}
                  className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
                >
                  + Adicionar slide
                </button>
              </div>

              <div className="space-y-3">
                {slides.map((slide, i) => (
                  <div key={slide.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                        placeholder="Título do slide"
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, "title", e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Tempo:</span>
                        <input
                          type="number"
                          min={10}
                          className="w-16 text-xs text-center border border-gray-200 rounded-lg py-1 px-1"
                          value={Math.floor(slide.duration / 60)}
                          onChange={(e) =>
                            updateSlide(slide.id, "duration", Math.max(10, parseInt(e.target.value || "0") * 60))
                          }
                        />
                        <span className="text-xs text-gray-400">min</span>
                      </div>
                      {slides.length > 1 && (
                        <button
                          onClick={() => removeSlide(slide.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <textarea
                      className="w-full text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 border-none resize-none focus:outline-none focus:ring-1 focus:ring-primary-300"
                      rows={2}
                      placeholder="Anotações para este slide (pontos-chave, falas importantes...)"
                      value={slide.notes}
                      onChange={(e) => updateSlide(slide.id, "notes", e.target.value)}
                    />

                    {/* Upload de arquivo */}
                    <div className="mt-2">
                      {slide.fileName ? (
                        <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-xs text-primary-700 font-medium flex-1 truncate">{slide.fileName}</span>
                          <button
                            onClick={() => removeFile(slide.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 cursor-pointer transition-colors px-3 py-1.5 rounded-lg">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          📎 Anexar arquivo
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(slide.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right – summary */}
          <div className="w-64 flex flex-col gap-4">
            <div className="card">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Resumo</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Matéria</span>
                  <span className="font-semibold text-gray-800 text-right max-w-32 truncate">{subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Slides</span>
                  <span className="font-semibold text-gray-800">{slides.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tempo total</span>
                  <span className="font-semibold text-gray-800">{fmtTime(totalPlanned)}</span>
                </div>
              </div>

              {title && (
                <button
                  onClick={startPresentation}
                  className="btn-primary w-full mt-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <span>▶</span> Praticar apresentação
                </button>
              )}
              {!title && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  Preencha o título para iniciar a prática
                </p>
              )}
            </div>

            <div className="card">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Dicas de Apresentação</p>
              <ul className="space-y-2">
                {[
                  "Fale devagar e com clareza",
                  "Mantenha contato visual com a banca",
                  "Domine bem o seu tema",
                  "Pratique em voz alta antes",
                  "Respeite o tempo de cada slide",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
