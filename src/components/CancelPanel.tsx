// src/components/CancelPanel.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  Calendar,
  Check,
  Loader2,
  Package,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { apiService, BaseName, RegistroLog } from "../utils/api";

interface CancelPanelProps {
  base: BaseName;
  /** chamado depois de remover, para o App recarregar histórico e totais */
  onCancelled?: () => void | Promise<void>;
}

type Pendente = {
  codauxiliar: string;
  items: RegistroLog[];
  /** escopo devolvido pelo backend; é o mesmo que vai no delete */
  baseFiltro: BaseName | null;
};

type Feedback =
  | { kind: "vazio"; codauxiliar: string }
  | { kind: "removido"; codauxiliar: string; removidos: number }
  | { kind: "erro"; mensagem: string };

type Removido = {
  codauxiliar: string;
  descricao: string | null;
  quantidade: number;
  quando: string;
};

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export const CancelPanel: React.FC<CancelPanelProps> = ({
  base,
  onCancelled,
}) => {
  const [code, setCode] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [removidos, setRemovidos] = useState<Removido[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const focarInput = () => inputRef.current?.focus();

  // foco inicial e sempre que a tela volta a aceitar leitura
  useEffect(() => {
    if (!pendente && !buscando) focarInput();
  }, [pendente, buscando]);

  // Esc fecha o modal sem remover nada
  useEffect(() => {
    if (!pendente) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !removendo) fecharModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendente, removendo]);

  const fecharModal = () => {
    setPendente(null);
    setTimeout(focarInput, 0);
  };

  const procurar = async () => {
    const codaux = code.trim();
    if (!codaux || buscando || pendente) return;

    setBuscando(true);
    setFeedback(null);
    setCode("");

    try {
      const { data } = await apiService.buscarRegistros(codaux, base);
      if (!data.count) {
        setFeedback({ kind: "vazio", codauxiliar: codaux });
        return;
      }
      setPendente({
        codauxiliar: data.codauxiliar || codaux,
        items: data.items,
        baseFiltro: data.base_filtro,
      });
    } catch (e: any) {
      console.error("Erro ao procurar registro:", e);
      setFeedback({
        kind: "erro",
        mensagem:
          e?.response?.data?.detail ||
          "Falha ao consultar o histórico. Verifique a conexão.",
      });
    } finally {
      setBuscando(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!pendente || removendo) return;
    setRemovendo(true);

    try {
      const { data } = await apiService.cancelarRegistros(
        pendente.codauxiliar,
        pendente.baseFiltro
      );

      setRemovidos((prev) =>
        [
          {
            codauxiliar: pendente.codauxiliar,
            descricao: pendente.items[0]?.descricao ?? null,
            quantidade: data.removidos,
            quando: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20)
      );
      setFeedback({
        kind: "removido",
        codauxiliar: pendente.codauxiliar,
        removidos: data.removidos,
      });
      setPendente(null);
      await onCancelled?.();
    } catch (e: any) {
      console.error("Erro ao cancelar:", e);
      setFeedback({
        kind: "erro",
        mensagem:
          e?.response?.data?.detail ||
          "Falha ao remover. O item continua no histórico.",
      });
      setPendente(null);
    } finally {
      setRemovendo(false);
      setTimeout(focarInput, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") procurar();
  };

  const bloqueado = buscando || !!pendente;

  return (
    <>
      {/* leitor */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-red-500">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-700">Modo cancelamento</h3>
            <p className="text-sm text-red-600">
              Bipe o código do item que foi registrado por engano. Você vai
              confirmar antes de remover.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Bipe o código para cancelar..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              readOnly={bloqueado}
              className="w-full px-4 py-3 text-lg border border-red-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-red-500
                         focus:border-transparent read-only:bg-gray-100"
            />
          </div>

          <button
            onClick={procurar}
            disabled={bloqueado || !code.trim()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg
                       hover:bg-red-700 focus:outline-none focus:ring-2
                       focus:ring-red-500 focus:ring-offset-2
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       flex items-center gap-2 min-w-[120px] justify-center"
          >
            {buscando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span>Procurar</span>
          </button>
        </div>

        {/* feedback da última ação */}
        {feedback && (
          <div className="mt-4">
            {feedback.kind === "vazio" && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Nada registrado com o código{" "}
                  <strong>{feedback.codauxiliar}</strong> — não há o que
                  cancelar.
                </span>
              </div>
            )}
            {feedback.kind === "removido" && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>{feedback.codauxiliar}</strong> removido do histórico
                  {feedback.removidos > 1
                    ? ` (${feedback.removidos} registros).`
                    : "."}
                </span>
              </div>
            )}
            {feedback.kind === "erro" && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span>{feedback.mensagem}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* cancelados nesta sessão */}
      {removidos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm text-slate-600">Cancelados nesta sessão</div>
            <div className="text-xs text-slate-500">{removidos.length}</div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-200">
            {removidos.map((r, i) => (
              <div
                key={`${r.codauxiliar}-${i}`}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-600">
                      {r.codauxiliar}
                    </span>
                    {r.quantidade > 1 && (
                      <span className="text-xs text-slate-500">
                        {r.quantidade} registros
                      </span>
                    )}
                  </div>
                  {r.descricao && (
                    <div className="text-sm text-gray-700 truncate">
                      {r.descricao}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatDateTime(r.quando)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* modal de confirmação */}
      {pendente && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-start gap-3 p-6 pb-4">
              <div className="rounded-full bg-red-100 p-2 flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3
                  id="cancel-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Tem certeza que deseja remover?
                </h3>
                <p className="text-sm text-gray-600">
                  {pendente.items.length === 1
                    ? "Este registro sai do histórico e não aparece mais no relatório."
                    : `${pendente.items.length} registros saem do histórico e não aparecem mais no relatório.`}
                </p>
              </div>
            </div>

            <div className="px-6 max-h-64 overflow-y-auto">
              <div className="divide-y divide-gray-200 border rounded-lg">
                {pendente.items.map((item) => (
                  <div key={`${item.tipo}-${item.id}`} className="p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Barcode className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-blue-600">
                        {item.codauxiliar}
                      </span>
                      {item.codprod && (
                        <>
                          <span className="text-gray-400">•</span>
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-purple-600">
                            {item.codprod}
                          </span>
                        </>
                      )}
                      <span
                        className={[
                          "ml-auto text-xs px-2 py-0.5 rounded-full",
                          item.tipo === "encontrados"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {item.tipo === "encontrados"
                          ? "Encontrado"
                          : "Não encontrado"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {item.descricao || "Sem descrição"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDateTime(item.datahora)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="capitalize">{item.base}</span>
                    </div>
                  </div>
                ))}
              </div>

              {pendente.baseFiltro === null && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Este código não estava em <strong>{base}</strong>. Os
                  registros acima vieram das demais bases.
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end p-6 pt-4">
              <button
                autoFocus
                onClick={fecharModal}
                disabled={removendo}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                           hover:bg-gray-50 disabled:opacity-60"
              >
                Não, manter
              </button>
              <button
                onClick={confirmarRemocao}
                disabled={removendo}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-60 inline-flex items-center gap-2"
              >
                {removendo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
