// src/components/SearchResult.tsx
import React from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Package,
  Barcode,
} from "lucide-react";
import { SearchResult as SearchResultType } from "../types";

interface SearchResultProps {
  /** Resultado retornado pelo hook/useCase; `null` → nada a mostrar */
  result: SearchResultType | null;
}

export const SearchResult: React.FC<SearchResultProps> = ({ result }) => {
  if (!result) return null; // ainda não pesquisou

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  // 409 Conflict no backend devolve message = "código já registrado"
  const isDuplicate =
    !result.found && /já\s+registrado/i.test(result.message ?? "");

  // ────── NÃO ENCONTRADO / DUPLICADO ──────
  if (!result.found) {
    const borderColor = isDuplicate ? "border-yellow-500" : "border-red-500";
    const iconColor = isDuplicate ? "text-yellow-500" : "text-red-500";
    const titleColor = isDuplicate ? "text-yellow-700" : "text-red-700";
    const textColor = isDuplicate ? "text-yellow-600" : "text-red-600";
    return (
      <div
        className={`bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 ${borderColor}`}
      >
        <div className="flex items-center gap-3">
          {isDuplicate ? (
            <AlertTriangle className={`h-6 w-6 ${iconColor}`} />
          ) : (
            <XCircle className={`h-6 w-6 ${iconColor}`} />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${titleColor}`}>
              {isDuplicate ? "Código já registrado" : "Produto não encontrado"}
            </h3>
            <p className={textColor}>{result.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // ────── PRODUTO ENCONTRADO ──────
  if (!result.produto) return null; // salvaguarda

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-green-500">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-500" />
        <div>
          <h3 className="text-lg font-semibold text-green-700">
            Produto encontrado!
          </h3>
          <p className="text-green-600">{result.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">Código Auxiliar:</span>
          <span className="font-semibold text-blue-600">
            {result.produto.codauxiliar}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">Código Produto:</span>
          <span className="font-semibold text-purple-600">
            {result.produto.codprod}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xl font-bold text-gray-800 mb-2">
          {result.produto.descricao}
        </h4>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        <span>
          Última atualização: {formatDateTime(result.produto.datahora)}
        </span>
      </div>
    </div>
  );
};
