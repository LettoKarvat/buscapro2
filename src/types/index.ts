export type BaseName = "homecenter" | "mercado";

export interface ProdutoEncontrado {
  id: number;
  codauxiliar: string;
  codprod: string;
  descricao: string;
  datahora: string;
  base?: BaseName;
}

export interface ProdutoNaoEncontrado {
  id: number;
  codauxiliar: string;
  descricao: string | null;
  datahora: string;
  base?: BaseName;
}

export interface SearchResult {
  found: boolean;
  produto?: ProdutoEncontrado;
  message: string;
}

export interface FilterOptions {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "date" | "code" | "description";
  sortOrder: "asc" | "desc";
}
