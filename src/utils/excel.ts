import * as XLSX from "xlsx";

/* ── Tipos do response do backend ── */
type ProductDetails = {
  pcprodut: Record<string, unknown>;
  pcembalagem: Record<string, unknown>;
};

type EncontradoRow = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  codprod: string;
  descricao: string | null;
  datahora: string;
  _produto?: ProductDetails;
};

type NaoEncontradoRow = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  descricao: string | null;
  datahora: string;
};

/* ── Helpers ── */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function fmtPeriod(from: string, to: string): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };
  if (from && to) return `${fmt(from)} até ${fmt(to)}`;
  if (from) return `A partir de ${fmt(from)}`;
  if (to) return `Até ${fmt(to)}`;
  return "Todos os registros";
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

/**
 * Coleta todas as chaves únicas que aparecem em pelo menos 1 registro,
 * mantendo a ordem de primeira aparição.
 */
function collectKeys(items: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const item of items) {
    for (const k of Object.keys(item)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  return keys;
}

/* ── Colunas prioritárias (aparecem primeiro na planilha) ── */
const PRODUT_PRIORITY = [
  "CODPROD",
  "DESCRICAO",
  "EMBALAGEM",
  "UNIDADE",
  "PESOLIQ",
  "PESOBRUTO",
  "CODEPTO",
  "CODSEC",
  "CODFORNEC",
  "CODAUXILIAR",
  "CODAUXILIAR2",
  "NBM",
  "MARCA",
  "CODMARCA",
  "CODFAB",
  "CODCATEGORIA",
  "CODSUBCATEGORIA",
  "DTCADASTRO",
  "CUSTOREP",
  "PVENDA",
  "REVENDA",
  "STATUS",
];

const EMB_PRIORITY = [
  "CODAUXILIAR",
  "CODPROD",
  "EMBALAGEM",
  "UNIDADE",
  "QTUNIT",
  "PTABELA",
  "PVENDA",
  "POFERTA",
  "PESOBRUTO",
  "PESOLIQ",
  "MARGEM",
  "FATORPRECO",
  "DTULTALTPTABELA",
  "DTULTALTPVENDA",
];

function sortedKeys(allKeys: string[], priority: string[]): string[] {
  const prioSet = new Set(priority);
  const first = priority.filter((k) => allKeys.includes(k));
  const rest = allKeys.filter((k) => !prioSet.has(k)).sort();
  return [...first, ...rest];
}

/* ── Export principal ── */
export function exportToExcel(
  encontrados: EncontradoRow[],
  naoEncontrados: NaoEncontradoRow[],
  dateFrom?: string,
  dateTo?: string
) {
  const wb = XLSX.utils.book_new();
  const periodo = fmtPeriod(dateFrom ?? "", dateTo ?? "");

  // ═══════════ ABA: PCPRODUT (dados encontrados) ═══════════
  const allProdutDicts = encontrados
    .map((e) => e._produto?.pcprodut)
    .filter(Boolean) as Record<string, unknown>[];

  if (allProdutDicts.length > 0) {
    const rawKeys = collectKeys(allProdutDicts);
    const orderedKeys = sortedKeys(rawKeys, PRODUT_PRIORITY);

    const rows = encontrados.map((enc) => {
      const p = enc._produto?.pcprodut ?? {};
      const row: Record<string, unknown> = {
        "DATA_BIPAGEM": fmtDate(enc.datahora),
        "BASE": enc.base,
      };
      for (const k of orderedKeys) {
        row[k] = (p as Record<string, unknown>)[k] ?? "";
      }
      return row;
    });

    const wsProdut = XLSX.utils.json_to_sheet(rows);
    // largura auto para as primeiras colunas
    const widths = [20, 14, ...orderedKeys.map((k) => Math.min(Math.max(k.length + 2, 12), 30))];
    setColWidths(wsProdut, widths);
    XLSX.utils.book_append_sheet(wb, wsProdut, "PCPRODUT");
  }

  // ═══════════ ABA: PCEMBALAGEM (dados encontrados) ═══════════
  const allEmbDicts = encontrados
    .map((e) => e._produto?.pcembalagem)
    .filter(Boolean) as Record<string, unknown>[];

  if (allEmbDicts.length > 0) {
    const rawKeys = collectKeys(allEmbDicts);
    const orderedKeys = sortedKeys(rawKeys, EMB_PRIORITY);

    const rows = encontrados.map((enc) => {
      const e = enc._produto?.pcembalagem ?? {};
      const row: Record<string, unknown> = {
        "DATA_BIPAGEM": fmtDate(enc.datahora),
        "BASE": enc.base,
      };
      for (const k of orderedKeys) {
        row[k] = (e as Record<string, unknown>)[k] ?? "";
      }
      return row;
    });

    const wsEmb = XLSX.utils.json_to_sheet(rows);
    const widths = [20, 14, ...orderedKeys.map((k) => Math.min(Math.max(k.length + 2, 12), 30))];
    setColWidths(wsEmb, widths);
    XLSX.utils.book_append_sheet(wb, wsEmb, "PCEMBALAGEM");
  }

  // ═══════════ ABA: NÃO ENCONTRADOS ═══════════
  const naoData = naoEncontrados.map((item) => ({
    "Código Auxiliar": item.codauxiliar,
    Descrição: item.descricao ?? "Sem descrição",
    Base: item.base,
    "Data/Hora": fmtDate(item.datahora),
  }));

  const wsNao = XLSX.utils.json_to_sheet(naoData);
  setColWidths(wsNao, [20, 45, 14, 22]);
  XLSX.utils.book_append_sheet(wb, wsNao, "Não Encontrados");

  // ═══════════ ABA: RESUMO ═══════════
  const total = encontrados.length + naoEncontrados.length;
  const taxa =
    total > 0 ? ((encontrados.length / total) * 100).toFixed(1) + "%" : "—";

  const resumoData = [
    { Indicador: "Período", Valor: periodo },
    { Indicador: "Total de buscas", Valor: String(total) },
    { Indicador: "Encontrados", Valor: String(encontrados.length) },
    { Indicador: "Não encontrados", Valor: String(naoEncontrados.length) },
    { Indicador: "Taxa de sucesso", Valor: taxa },
    {
      Indicador: "Data de exportação",
      Valor: fmtDate(new Date().toISOString()),
    },
  ];

  const wsRes = XLSX.utils.json_to_sheet(resumoData);
  setColWidths(wsRes, [22, 30]);
  XLSX.utils.book_append_sheet(wb, wsRes, "Resumo");

  // ── Salvar ──
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `buscapro_${dateStr}.xlsx`);
}
