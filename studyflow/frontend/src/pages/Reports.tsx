import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import PremiumGate from "../components/PremiumGate";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function ReportsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "overview"],
    queryFn: reportsApi.overview,
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Carregando relatório...</div>;
  }

  if (!data) return null;

  const barData = {
    labels: data.dailyHours.map((d) =>
      new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Horas estudadas",
        data: data.dailyHours.map((d) => d.hours),
        backgroundColor: "#6366f1",
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: data.bySubject.map((s) => s.name),
    datasets: [
      {
        data: data.bySubject.map((s) => s.minutes),
        backgroundColor: data.bySubject.map((s) => s.colorHex),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{data.totalHours}h</div>
          <div className="text-sm text-gray-500 mt-1">Total (30 dias)</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{data.totalSessions}</div>
          <div className="text-sm text-gray-500 mt-1">Sessões concluídas</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">
            {data.avgFocusScore > 0 ? `${data.avgFocusScore}/5` : "—"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Foco médio</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Horas por dia (últimas 2 semanas)</h2>
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>

        {/* Doughnut */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Por matéria</h2>
          {data.bySubject.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-8">Sem dados ainda.</p>
          ) : (
            <>
              <Doughnut
                data={doughnutData}
                options={{ plugins: { legend: { position: "bottom" } } }}
              />
              <ul className="mt-4 space-y-1">
                {data.bySubject.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.colorHex }}
                    />
                    <span className="flex-1 truncate text-gray-700">{s.name}</span>
                    <span className="text-gray-500">
                      {Math.round(s.minutes / 60 * 10) / 10}h
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { isPremium } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios de Desempenho</h1>
      <PremiumGate feature="Relatórios de desempenho">
        <ReportsContent />
      </PremiumGate>
    </div>
  );
}
