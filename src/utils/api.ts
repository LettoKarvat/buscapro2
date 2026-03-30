// src/utils/api.ts
import axios, { AxiosError, AxiosResponse } from "axios";

/* -------------------- BASE URL -------------------- */
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL as
  | string
  | undefined;

const BASE_URL =
  VITE_API_URL && VITE_API_URL.trim() !== ""
    ? VITE_API_URL
    : "https://untappable-terina-heavenly.ngrok-free.dev";

// reconhece qualquer domínio do ngrok (app/dev/ngrok.io)
const isNgrok = /(\.|^)ngrok(-free)?\.(app|dev)$|(\.|^)ngrok\.io$/i.test(
  new URL(BASE_URL).host
);

/* -------------------- AXIOS INSTANCE ------------------- */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// garante header em TODAS as requisições (inclusive a 1ª)
if (isNgrok) {
  (api.defaults.headers.common as any)["ngrok-skip-browser-warning"] = "true";
}

// request interceptor
api.interceptors.request.use((config) => {
  if (isNgrok) {
    (config.headers as any)["ngrok-skip-browser-warning"] = "true";
  } else {
    if ((config.headers as any)["ngrok-skip-browser-warning"]) {
      delete (config.headers as any)["ngrok-skip-browser-warning"];
    }
  }
  return config;
});

/* -------------------- AUTH HELPERS -------------------- */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("sb_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("sb_token");
  }
};

// recarrega token salvo
const saved = localStorage.getItem("sb_token");
if (saved) setAuthToken(saved);

/* -------------------- INTERCEPTOR DE RESPOSTA -------------------- */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data }: any = error.response;
      const detail: string =
        typeof data === "object" && data?.detail ? data.detail : "erro interno";
      if (status === 401) console.error("Não autorizado – faça login.");
      else if (status === 404) console.error("Produto não encontrado");
      else console.error(detail);
    } else {
      console.error("Falha de rede ou CORS");
    }
    return Promise.reject(error);
  }
);

/* -------------------- TIPOS -------------------- */
export type BaseName = "homecenter" | "mercado";

export type EncontradoItem = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  codprod: string;
  descricao: string | null;
  datahora: string;
};

export type NaoEncontradoItem = {
  id: number;
  client_id: number;
  base: string;
  codauxiliar: string;
  descricao: string | null;
  datahora: string;
};

export type CursorPage<T> = {
  items: T[];
  per_page: number;
  next_cursor_id?: number | null;
  mode: "cursor" | "offset";
};

export type PagedOffset<T> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  mode: "offset";
};

export type MeResponse = {
  role?: "superadmin" | "admin" | "user";
  client_slug?: string | null;
};

/* -------------------- ENDPOINTS -------------------- */
export const apiService = {
  // ---------- auth ----------
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  // Nunca trava a tela: se /auth/me falhar, retorna null
  validateToken: async (): Promise<MeResponse | null> => {
    try {
      const { data } = await api.get<MeResponse>("/auth/me");
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const { data } = await api.get<MeResponse>("/auth/validate");
          return data;
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  getMe: () => api.get<MeResponse>("/auth/me"),

  // ---------- produto ----------
  searchProduct: (
    base: BaseName,
    code: string,
    opts?: { parallel?: boolean; fallback?: boolean }
  ) => {
    const parallel = opts?.parallel === false ? "0" : "1";
    const fallback = opts?.fallback === false ? "0" : "1";
    return api.get(
      `/sqlite/${base}/produto/${encodeURIComponent(
        code
      )}?parallel=${parallel}&fallback=${fallback}`
    );
  },

  // ---------- histórico via CURSOR ----------
  getEncontradosCursor: (
    base?: BaseName,
    cursorId?: number | null,
    perPage = 50,
    all?: boolean // permite superadmin ver global
  ) => {
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    if (base) params.set("base", base);
    if (cursorId) params.set("cursor_id", String(cursorId));
    if (all) params.set("all", "1");
    return api.get<CursorPage<EncontradoItem>>(
      `/sqlite/encontrados?${params.toString()}`
    );
  },

  getNaoEncontradosCursor: (
    base?: BaseName,
    cursorId?: number | null,
    perPage = 50,
    all?: boolean
  ) => {
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    if (base) params.set("base", base);
    if (cursorId) params.set("cursor_id", String(cursorId));
    if (all) params.set("all", "1");
    return api.get<CursorPage<NaoEncontradoItem>>(
      `/sqlite/nao-encontrados?${params.toString()}`
    );
  },

  // ---------- pegar TOTAL (offset) ----------
  getEncontradosTotal: async (base?: BaseName, all?: boolean) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per_page", "1");
    if (base) params.set("base", base);
    if (all) params.set("all", "1");
    const { data } = await api.get<PagedOffset<EncontradoItem>>(
      `/sqlite/encontrados?${params.toString()}`
    );
    return data.total ?? 0;
  },

  getNaoEncontradosTotal: async (base?: BaseName, all?: boolean) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per_page", "1");
    if (base) params.set("base", base);
    if (all) params.set("all", "1");
    const { data } = await api.get<PagedOffset<NaoEncontradoItem>>(
      `/sqlite/nao-encontrados?${params.toString()}`
    );
    return data.total ?? 0;
  },

  // ---------- legado sem paginação ----------
  getEncontrados: (base?: BaseName, all?: boolean) =>
    api.get(
      `/sqlite/encontrados${
        base || all
          ? `?${new URLSearchParams({
              ...(base ? { base } : {}),
              ...(all ? { all: "1" } : {}),
            }).toString()}`
          : ""
      }`
    ),

  getNaoEncontrados: (base?: BaseName, all?: boolean) =>
    api.get(
      `/sqlite/nao-encontrados${
        base || all
          ? `?${new URLSearchParams({
              ...(base ? { base } : {}),
              ...(all ? { all: "1" } : {}),
            }).toString()}`
          : ""
      }`
    ),

  // ---------- CRUD ----------
  deleteEncontrado: (id: number) => api.delete(`/sqlite/encontrados/${id}`),
  deleteNaoEncontrado: (id: number) =>
    api.delete(`/sqlite/nao-encontrados/${id}`),
  updateNaoEncontrado: (id: number, descricao: string) =>
    api.patch(`/sqlite/nao-encontrados/${id}`, { descricao }),

  // ---------- export ----------
  exportData: (opts?: { base?: BaseName; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (opts?.base) params.set("base", opts.base);
    if (opts?.dateFrom) params.set("date_from", opts.dateFrom);
    if (opts?.dateTo) params.set("date_to", opts.dateTo);
    return api.get<{
      encontrados: EncontradoItem[];
      nao_encontrados: NaoEncontradoItem[];
    }>(`/sqlite/export?${params.toString()}`);
  },

  // ---------- admin ----------
  createUser: (payload: {
    email: string;
    password: string;
    role?: "user" | "admin" | "superadmin";
    client_slug?: string;
  }) => api.post("/admin/users", payload),
};

console.log("[API] BASE_URL =", BASE_URL, "| ngrok:", isNgrok);
