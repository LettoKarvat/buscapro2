import * as XLSX from "xlsx";

type EncontradoRow = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  codprod: string;
  descricao: string | null;
  datahora: string;
};

type NaoEncontradoRow = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  descricao: string | null;
  datahora: string;
};

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
  const parts: string[] = [];
  if (from) {
    const [y, m, d] = from.split("-");
    parts.push(`${d}/${m}/${y}`);
  }
  if (to) {
    const [y, m, d] = to.split("-");
    parts.push(`${d}/${m}/${y}`);
  }
  if (parts.length === 2) return `${parts[0]} até ${parts[1]}`;
  if (parts.length === 1) return from ? `A partir de ${parts[0]}` : `Até ${parts[0]}`;
  return "Todos os registros";
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

export function exportToExcel(
  encontrados: EncontradoRow[],
  naoEncontrados: NaoEncontradoRow[],
  dateFrom?: string,
  dateTo?: string
) {
  const wb = XLSX.utils.book_new();
  const periodo = fmtPeriod(dateFrom ?? "", dateTo ?? "");

  // ── Aba: Encontrados ──
  const encData = encontrados.map((item) => ({
    "Código Auxiliar": item.codauxiliar,
    "Código Produto": item.codprod,
    Descrição: item.descricao ?? "",
    Base: item.base,
    "Data/Hora": fmtDate(item.datahora),
  }));

  const wsEnc = XLSX.utils.json_to_sheet(encData);
  setColWidths(wsEnc, [20, 18, 45, 14, 22]);
  XLSX.utils.book_append_sheet(wb, wsEnc, "Encontrados");

  // ── Aba: Não Encontrados ──
  const naoData = naoEncontrados.map((item) => ({
    "Código Auxiliar": item.codauxiliar,
    Descrição: item.descricao ?? "Sem descrição",
    Base: item.base,
    "Data/Hora": fmtDate(item.datahora),
  }));

  const wsNao = XLSX.utils.json_to_sheet(naoData);
  setColWidths(wsNao, [20, 45, 14, 22]);
  XLSX.utils.book_append_sheet(wb, wsNao, "Não Encontrados");

  // ── Aba: Resumo ──
  const total = encontrados.length + naoEncontrados.length;
  const taxa = total > 0 ? ((encontrados.length / total) * 100).toFixed(1) + "%" : "—";

  const resumoData = [
    { Indicador: "Período", Valor: periodo },
    { Indicador: "Total de buscas", Valor: String(total) },
    { Indicador: "Encontrados", Valor: String(encontrados.length) },
    { Indicador: "Não encontrados", Valor: String(naoEncontrados.length) },
    { Indicador: "Taxa de sucesso", Valor: taxa },
    { Indicador: "Data de exportação", Valor: fmtDate(new Date().toISOString()) },
  ];

  const wsRes = XLSX.utils.json_to_sheet(resumoData);
  setColWidths(wsRes, [22, 30]);
  XLSX.utils.book_append_sheet(wb, wsRes, "Resumo");

  // ── Salvar ──
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `buscapro_${dateStr}.xlsx`);
}
