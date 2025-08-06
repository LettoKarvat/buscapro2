import React, { useState } from "react";
import {
  Trash2,
  Package,
  Calendar,
  Barcode,
  Copy,
  Check,
  Edit2,
} from "lucide-react";
import { ProdutoEncontrado, ProdutoNaoEncontrado } from "../types";
import { EditableText } from "./EditableText";

interface ProductListProps {
  title: string;
  items: (ProdutoEncontrado | ProdutoNaoEncontrado)[];
  onDelete: (id: number) => void;
  onUpdateDescription?: (id: number, description: string) => void;
  icon: React.ReactNode;
  emptyMessage: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  title,
  items,
  onDelete,
  onUpdateDescription,
  icon,
  emptyMessage,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const isFound = (
    item: ProdutoEncontrado | ProdutoNaoEncontrado
  ): item is ProdutoEncontrado => "codprod" in item;

  const handleCopy = async (id: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      alert("Erro ao copiar para a área de transferência");
    }
  };

  const startEditing = (id: number) => {
    // Se houver algum input focado (como a SearchBar), remove o foco
    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
    ) {
      active.blur();
    }
    setEditingId(id);
  };

  const saveDescription = (id: number, newText: string) => {
    onUpdateDescription?.(id, newText);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Código e copiar */}
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
                            {item.codprod}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Descrição com ícone de edição */}
                    <div className="mb-1">
                      {isFound(item) ? (
                        <h4 className="font-semibold text-gray-800">
                          {item.descricao}
                        </h4>
                      ) : (
                        <div className="flex items-center gap-2">
                          {editingId === item.id ? (
                            <EditableText
                              text={item.descricao || ""}
                              onSave={(newText) =>
                                saveDescription(item.id, newText)
                              }
                              placeholder="Clique para adicionar descrição"
                              className="font-semibold"
                              inputId={`editable-${item.id}`}
                              editing={true}
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
          </div>
        )}
      </div>
    </div>
  );
};
