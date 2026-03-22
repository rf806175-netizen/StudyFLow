import type { Subject } from "../api/client";

interface SubjectCardProps {
  subject: Subject;
  onEdit?: () => void;
  onDelete?: () => void;
}

const difficultyLabel = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export default function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const examDate = subject.examDate
    ? new Date(subject.examDate).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: subject.colorHex }}
          />
          <div>
            <h3 className="font-semibold text-gray-900">{subject.name}</h3>
            {subject.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                {subject.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          Dificuldade:{" "}
          <span className="font-medium text-gray-700">
            {difficultyLabel[subject.difficulty]}
          </span>
        </span>
        <span>
          Meta:{" "}
          <span className="font-medium text-gray-700">
            {subject.weeklyGoalHours}h/semana
          </span>
        </span>
      </div>

      {examDate && (
        <div className="text-sm text-amber-600 font-medium">
          📅 Prova: {examDate}
        </div>
      )}
    </div>
  );
}
