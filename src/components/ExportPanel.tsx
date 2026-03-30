import React, { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { apiService, BaseName } from "../utils/api";
import { exportToExcel } from "../utils/excel";

interface ExportPanelProps {
  base: BaseName;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ base }) => {
  const today = new Date().toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    enc: number;
    nao: number;
  } | null>(null);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    setLastResult(null);

    try {
      const { data } = await apiService.exportData({
        base,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const enc = data.encontrados ?? [];
      const nao = data.nao_encontrados ?? [];

      if (enc.length === 0 && nao.length === 0) {
        setLastResult({ enc: 0, nao: 0 });
        alert("Nenhum registro encontrado no período selecionado.");
        return;
      }

      exportToExcel(enc, nao, dateFrom, dateTo);
      setLastResult({ enc: enc.length, nao: nao.length });
    } catch (err) {
      console.error("Erro ao exportar:", err);
      alert("Falha ao exportar dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(to.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-4">
      {/* Atalhos */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPreset(0)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          Hoje
        </button>
        <button
          onClick={() => setPreset(7)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          Últimos 7 dias
        </button>
        <button
          onClick={() => setPreset(30)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          Últimos 30 dias
        </button>
        <button
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          Tudo
        </button>
      </div>

      {/* Date pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1">
            <CalendarDays className="h-4 w-4" />
            De
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1">
            <CalendarDays className="h-4 w-4" />
            Até
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Botão exportar */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                   bg-emerald-600 text-white font-medium text-sm
                   hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                   disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando planilha…
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Planilha
          </>
        )}
      </button>

      {/* Resultado da última exportação */}
      {lastResult && (lastResult.enc > 0 || lastResult.nao > 0) && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          <Download className="h-4 w-4 flex-shrink-0" />
          <span>
            Exportados <strong>{lastResult.enc}</strong> encontrados e{" "}
            <strong>{lastResult.nao}</strong> não encontrados.
          </span>
        </div>
      )}
    </div>
  );
};
