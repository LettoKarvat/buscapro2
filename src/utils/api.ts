// src/utils/api.ts
import axios, { AxiosError, AxiosResponse } from "axios";

/* -------------------- BASE URL -------------------- */
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL as
  | string
  | undefined;

// Se não tiver .env, usa ngrok como padrão
const BASE_URL =
  VITE_API_URL && VITE_API_URL.trim() !== ""
    ? VITE_API_URL
    : "https://091afa330598.ngrok-free.app";

const isNgrok = /ngrok(-free)?\.app/i.test(BASE_URL);

/* -------------------- AXIOS INSTANCE -------------------- */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // timeout opcional para evitar pendurar
  timeout: 30000,
});

// ---- request interceptor (ngrok header dinâmico) ----
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
  email?: string;
  role?: "superadmin" | "admin" | "user";
  client_slug?: string | null;
};

/* -------------------- ENDPOINTS -------------------- */
export const apiService = {
  // ---------- auth ----------
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  // Endpoint para validar token e obter dados do usuário.
  // Tenta primeiro /auth/me; se não existir (404), tenta /auth/validate.
  validateToken: async () => {
    try {
      return await api.get<MeResponse>("/auth/me");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // fallback em APIs que usam outro caminho
        return api.get<MeResponse>("/auth/validate");
      }
      throw err;
    }
  },

  // (opcional) alias direto
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
    perPage = 50
  ) => {
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    if (base) params.set("base", base);
    if (cursorId) params.set("cursor_id", String(cursorId));
    return api.get<CursorPage<EncontradoItem>>(
      `/sqlite/encontrados?${params.toString()}`
    );
    // esperado: { items, per_page, next_cursor_id, mode: "cursor" }
  },

  getNaoEncontradosCursor: (
    base?: BaseName,
    cursorId?: number | null,
    perPage = 50
  ) => {
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    if (base) params.set("base", base);
    if (cursorId) params.set("cursor_id", String(cursorId));
    return api.get<CursorPage<NaoEncontradoItem>>(
      `/sqlite/nao-encontrados?${params.toString()}`
    );
  },

  // ---------- pegar TOTAL (consultando no modo offset) ----------
  getEncontradosTotal: async (base?: BaseName) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per_page", "1");
    if (base) params.set("base", base);
    const { data } = await api.get<PagedOffset<EncontradoItem>>(
      `/sqlite/encontrados?${params.toString()}`
    );
    return data.total ?? 0;
  },

  getNaoEncontradosTotal: async (base?: BaseName) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per_page", "1");
    if (base) params.set("base", base);
    const { data } = await api.get<PagedOffset<NaoEncontradoItem>>(
      `/sqlite/nao-encontrados?${params.toString()}`
    );
    return data.total ?? 0;
  },

  // ---------- legado sem paginação ----------
  getEncontrados: (base?: BaseName) =>
    api.get(`/sqlite/encontrados${base ? `?base=${base}` : ""}`),

  getNaoEncontrados: (base?: BaseName) =>
    api.get(`/sqlite/nao-encontrados${base ? `?base=${base}` : ""}`),

  // ---------- CRUD ----------
  deleteEncontrado: (id: number) => api.delete(`/sqlite/encontrados/${id}`),

  deleteNaoEncontrado: (id: number) =>
    api.delete(`/sqlite/nao-encontrados/${id}`),

  updateNaoEncontrado: (id: number, descricao: string) =>
    api.patch(`/sqlite/nao-encontrados/${id}`, { descricao }),

  // ---------- admin ----------
  createUser: (payload: {
    email: string;
    password: string;
    role?: "user" | "admin" | "superadmin";
    client_slug?: string;
  }) => api.post("/admin/users", payload),
};

console.log("[API] BASE_URL =", BASE_URL, "| ngrok:", isNgrok);
