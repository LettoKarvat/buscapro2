// src/components/ProductList.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Trash2,
  Package,
  Calendar,
  Barcode,
  Copy,
  Check,
  Edit2,
} from "lucide-react";

type BaseItem = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  descricao: string | null;
  datahora: string;
};

type Encontrado = BaseItem & { codprod: string };
type NaoEncontrado = BaseItem;

interface ProductListProps {
  items: (Encontrado | NaoEncontrado)[];
  type: "encontrados" | "nao-encontrados";
  total?: number; // << NOVO: total vindo do App
  onDelete: (id: number) => void;
  onUpdateDescription?: (id: number, description: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  items,
  type,
  total,
  onDelete,
  onUpdateDescription,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const isFound = (item: Encontrado | NaoEncontrado): item is Encontrado =>
    (item as any).codprod != null;

  const handleCopy = async (id: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const startEditing = (id: number) => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setEditingId(id);
  };

  const saveDescription = (id: number, newText: string) => {
    onUpdateDescription?.(id, newText);
    setEditingId(null);
  };

  // --------- INFINITE SCROLL (IntersectionObserver) ----------
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "1200px 0px 0px 0px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, onLoadMore, loadingMore, items.length]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header pequeno com total */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="text-sm text-slate-600">
          {type === "encontrados"
            ? "Produtos Encontrados"
            : "Produtos Não Encontrados"}
        </div>
        {typeof total === "number" && (
          <div className="text-xs text-slate-500">
            {items.length} de {total}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-[480px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {type === "encontrados"
              ? "Nada encontrado ainda."
              : "Nenhum item registrado."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Código + copiar */}
                    <div className="flex items-center gap-2 mb-2">
                      <Barcode className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-blue-600">
                        {item.codauxiliar}
                      </span>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCopy(item.id, item.codauxiliar)}
                        title="Copiar código"
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      {isFound(item) && (
                        <>
                          <span className="text-gray-400">•</span>
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-purple-600">
                            {(item as Encontrado).codprod}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Descrição / edição (apenas no não encontrado) */}
                    <div className="mb-1">
                      {isFound(item) ? (
                        <h4 className="font-semibold text-gray-800">
                          {item.descricao}
                        </h4>
                      ) : (
                        <div className="flex items-center gap-2">
                          {editingId === item.id ? (
                            <input
                              autoFocus
                              defaultValue={item.descricao || ""}
                              onBlur={(e) =>
                                saveDescription(item.id, e.currentTarget.value)
                              }
                              className="border rounded px-2 py-1"
                              placeholder="Adicionar descrição"
                            />
                          ) : (
                            <>
                              <span className="font-semibold text-gray-800">
                                {item.descricao || "Sem descrição"}
                              </span>
                              <button
                                onClick={() => startEditing(item.id)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                title="Editar descrição"
                              >
                                <Edit2 className="h-4 w-4 text-gray-600" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Data/hora */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(item.datahora)}</span>
                    </div>
                  </div>

                  {/* Deletar */}
                  <button
                    onClick={() => onDelete(item.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Deletar item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Sentinela para infinite scroll */}
            {hasMore && <div ref={sentinelRef} className="h-6" />}
          </div>
        )}

        {/* Fallback: botão carregar mais */}
        {hasMore && (
          <div className="p-3 text-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-60"
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
