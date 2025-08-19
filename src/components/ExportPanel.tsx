import React from "react";
import { Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import { ProdutoEncontrado, ProdutoNaoEncontrado } from "../types";
import { exportToExcel } from "../utils/excel";

interface ExportPanelProps {
  encontrados: ProdutoEncontrado[];
  naoEncontrados: ProdutoNaoEncontrado[];
  /** Totais reais vindos do App (opcional). Se não vier, usa .length como fallback. */
  totalEncontrados?: number;
  totalNaoEncontrados?: number;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  encontrados,
  naoEncontrados,
  totalEncontrados,
  totalNaoEncontrados,
}) => {
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  // usa total do back se vier; caso contrário, usa length dos arrays
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

  const handleExport = () => {
    exportToExcel(encontrados, naoEncontrados);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Estatísticas e Exportação
          </h3>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Total de Buscas
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {fmt(totalItems)}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-green-800">
              Encontrados
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {fmt(encCount)}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-red-800">
              Não Encontrados
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600">{fmt(naoCount)}</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-purple-800">
              Taxa de Sucesso
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {successRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
