import React, { useMemo } from "react";
import { BarChart3, TrendingUp, Target, Clock } from "lucide-react";
import { ProdutoEncontrado, ProdutoNaoEncontrado } from "../types";

interface StatsPanelProps {
  encontrados: ProdutoEncontrado[];
  naoEncontrados: ProdutoNaoEncontrado[];
  totalEncontrados?: number;
  totalNaoEncontrados?: number;
  todayEncontrados?: number; // opcional
  todayNaoEncontrados?: number; // opcional
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  encontrados,
  naoEncontrados,
  totalEncontrados,
  totalNaoEncontrados,
  todayEncontrados,
  todayNaoEncontrados,
}) => {
  // usa total do back se vier; senão, usa length (fallback)
  const encCount =
    typeof totalEncontrados === "number"
      ? totalEncontrados
      : encontrados.length;
  const naoCount =
    typeof totalNaoEncontrados === "number"
      ? totalNaoEncontrados
      : naoEncontrados.length;
  const totalItems = encCount + naoCount;
  const successRate = totalItems > 0 ? (encCount / totalItems) * 100 : 0;

  // hoje (se não vier pronto, calcula com base no que está carregado — PARCIAL)
  const { todayFound, todayNotFound } = useMemo(() => {
    if (
      typeof todayEncontrados === "number" &&
      typeof todayNaoEncontrados === "number"
    ) {
      return {
        todayFound: todayEncontrados,
        todayNotFound: todayNaoEncontrados,
      };
    }
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return {
      todayFound: encontrados.filter((i) => new Date(i.datahora) >= start)
        .length,
      todayNotFound: naoEncontrados.filter((i) => new Date(i.datahora) >= start)
        .length,
    };
  }, [encontrados, naoEncontrados, todayEncontrados, todayNaoEncontrados]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <BarChart3 className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{totalItems}</span>
        </div>
        <div className="text-sm opacity-90">Total de Buscas</div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Target className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{encCount}</span>
        </div>
        <div className="text-sm opacity-90">Encontrados</div>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Clock className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{naoCount}</span>
        </div>
        <div className="text-sm opacity-90">Não Encontrados</div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{successRate.toFixed(1)}%</span>
        </div>
        <div className="text-sm opacity-90">Taxa de Sucesso</div>
      </div>
    </div>
  );
};
