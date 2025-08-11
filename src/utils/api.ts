// src/utils/api.ts (bases + JWT + env) — atualizado
import axios, { AxiosError, AxiosResponse } from "axios";

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL as
  | string
  | undefined;

// Se não tiver .env, usa backend local como padrão
const BASE_URL =
  VITE_API_URL && VITE_API_URL.trim() !== ""
    ? VITE_API_URL
    : "http://localhost:5001";

const isNgrok = /ngrok(-free)?\.app/i.test(BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // vamos setar esse header só quando for ngrok (via interceptor abaixo)
  },
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

// ---- auth helpers ----
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

// ---- response interceptors ----
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

// ---- tipos ----
export type BaseName = "homecenter" | "mercado";

// ---- endpoints ----
export const apiService = {
  // auth
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  // produto
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

  // histórico
  getEncontrados: (base?: BaseName) =>
    api.get(`/sqlite/encontrados${base ? `?base=${base}` : ""}`),
  getNaoEncontrados: (base?: BaseName) =>
    api.get(`/sqlite/nao-encontrados${base ? `?base=${base}` : ""}`),

  deleteEncontrado: (id: number) => api.delete(`/sqlite/encontrados/${id}`),
  deleteNaoEncontrado: (id: number) =>
    api.delete(`/sqlite/nao-encontrados/${id}`),
  updateNaoEncontrado: (id: number, descricao: string) =>
    api.patch(`/sqlite/nao-encontrados/${id}`, { descricao }),

  // admin (superadmin pode passar client_slug)
  createUser: (payload: {
    email: string;
    password: string;
    role?: "user" | "admin" | "superadmin";
    client_slug?: string;
  }) => api.post("/admin/users", payload),
};

console.log("[API] BASE_URL =", BASE_URL, "| ngrok:", isNgrok);
