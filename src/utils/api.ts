// src/utils/api.ts
import axios, { AxiosError, AxiosResponse } from "axios";

// ─────────────────────────────────────────────
// Instância global do Axios
// ─────────────────────────────────────────────
export const api = axios.create({
  baseURL: "https://25d96c7e4b26.ngrok-free.app",
  headers: {
    "Content-Type": "application/json",
    /**
     * evita o banner de aviso do ngrok no browser
     * (o backend precisa respeitar esse header)
     */
    "ngrok-skip-browser-warning": "true",
  },
});

// ─────────────────────────────────────────────
// Interceptor global de respostas
//   – Centraliza o tratamento de erros HTTP
//   – 404  → Produto não encontrado
//   – 409  → Código já registrado
//   – outros → erro genérico
//   Você pode trocar `console.error` por
//   qualquer lib de notificação (toast, snackbar…)
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response, // sucesso → devolve direto
  (error: AxiosError) => {
    if (error.response) {
      const { status, data }: any = error.response;
      const detail: string =
        typeof data === "object" && data?.detail ? data.detail : "erro interno";

      switch (status) {
        case 404:
          console.error("Produto não encontrado");
          break;
        case 409:
          console.error(detail); // "código já registrado"
          break;
        default:
          console.error(detail);
      }
    } else {
      console.error("Falha de rede ou CORS");
    }
    // mantém a rejeição para quem quiser tratar localmente (try/catch)
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// API Service – funções utilitárias
// ─────────────────────────────────────────────
export const apiService = {
  /** Busca produto + grava em histórico (GET /sqlite/produto/<code>) */
  searchProduct: (code: string) => api.get(`/sqlite/produto/${code}`),

  /** Lista encontrados mais recentes */
  getEncontrados: () => api.get("/sqlite/encontrados"),

  /** Lista não‑encontrados mais recentes */
  getNaoEncontrados: () => api.get("/sqlite/nao-encontrados"),

  /** Remove item de “encontrados” */
  deleteEncontrado: (id: number) => api.delete(`/sqlite/encontrados/${id}`),

  /** Remove item de “não‑encontrados” */
  deleteNaoEncontrado: (id: number) =>
    api.delete(`/sqlite/nao-encontrados/${id}`),

  /** Atualiza descrição de item em “não‑encontrados” */
  updateNaoEncontrado: (id: number, descricao: string) =>
    api.patch(`/sqlite/nao-encontrados/${id}`, { descricao }),
};
