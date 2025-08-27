// src/App.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  Eye,
  EyeOff,
  Download,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  UserPlus,
  Store,
  Building2,
} from "lucide-react";
import logo from "./assets/faiveslogo.png";

import { SearchBar } from "./components/SearchBar";
import { SearchResult } from "./components/SearchResult";
import { FilterPanel } from "./components/FilterPanel";
import { ProductList } from "./components/ProductList";
import { ExportPanel } from "./components/ExportPanel";
import { CollapsibleSection } from "./components/CollapsibleSection";

import { apiService, setAuthToken, BaseName } from "./utils/api";
import {
  ProdutoEncontrado,
  ProdutoNaoEncontrado,
  SearchResult as SearchResultType,
  FilterOptions,
} from "./types";

type Role = "superadmin" | "admin" | "user" | null;

/* -------------------- LoginScreen -------------------- */
type LoginScreenProps = {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  doLogin: () => void;
};
function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  doLogin,
}: LoginScreenProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <img
          src={logo}
          alt="Faives"
          className="mx-auto h-20 mb-4 object-contain select-none"
          draggable={false}
        />
        <h3 className="text-lg font-semibold mb-4 text-center">Entrar</h3>
        <div className="space-y-3">
          <input
            ref={emailRef}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={doLogin}
          >
            <LogIn className="h-4 w-4" /> Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
/* ---------------------------------------------------- */

function App() {
  // busca
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultType | null>(
    null
  );

  // base selecionada
  const [base, _setBase] = useState<BaseName>(
    () => (localStorage.getItem("sb_base") as BaseName) || "homecenter"
  );
  const setBase = (b: BaseName) => {
    _setBase(b);
    localStorage.setItem("sb_base", b);
  };

  // históricos (cursor)
  const [encItems, setEncItems] = useState<ProdutoEncontrado[]>([]);
  const [encNext, setEncNext] = useState<number | null>(null);
  const [encLoading, setEncLoading] = useState(false);
  const [encHasMore, setEncHasMore] = useState(true);
  const [encTotal, setEncTotal] = useState(0); // << total

  const [naoItems, setNaoItems] = useState<ProdutoNaoEncontrado[]>([]);
  const [naoNext, setNaoNext] = useState<number | null>(null);
  const [naoLoading, setNaoLoading] = useState(false);
  const [naoHasMore, setNaoHasMore] = useState(true);
  const [naoTotal, setNaoTotal] = useState(0); // << total

  const [showHistory, setShowHistory] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  // auth / role / cliente
  const [authed, setAuthed] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [role, setRole] = useState<Role>(null);
  const [clientSlug, setClientSlug] = useState<string | null>(null);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // modal Novo Usuário
  const [showNewUser, setShowNewUser] = useState(false);
  const [nuEmail, setNuEmail] = useState("");
  const [nuPwd, setNuPwd] = useState("");
  const [nuRole, setNuRole] = useState<Exclude<Role, null>>("user");
  const [nuClientSlug, setNuClientSlug] = useState("");

  // -------- Auth Gate --------
  useEffect(() => {
    const saved = localStorage.getItem("sb_token");
    if (!saved) {
      setAuthChecking(false);
      setAuthed(false);
      return;
    }

    setAuthToken(saved);

    (async () => {
      try {
        const me = await apiService.validateToken(); // precisa existir no api.ts
        setAuthed(true);
        setRole(me.data?.role as Role);
        setClientSlug(me.data?.client_slug ?? null);
        localStorage.setItem("sb_role", me.data?.role ?? "");
        localStorage.setItem("sb_client", me.data?.client_slug ?? "");
      } catch (e: any) {
        const code = e?.response?.status;
        if (code === 401 || code === 403) {
          // token inválido/expirado -> derruba
          logout(true);
        } else {
          // falha de rede/CORS/timeout -> mantém sessão local
          console.warn("Falha ao validar token (mantendo sessão local):", e);
          setAuthed(true);
          setRole((localStorage.getItem("sb_role") as Role) || null);
          setClientSlug(localStorage.getItem("sb_client"));
        }
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  const logout = (silent = false) => {
    setAuthToken(null);
    setAuthed(false);
    setRole(null);
    setClientSlug(null);
    setSearchResult(null);
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_role");
    localStorage.removeItem("sb_client");
    if (!silent) alert("Sessão encerrada.");
  };

  const handleAuthError = (e: any) => {
    const code = e?.response?.status;
    if (code === 401 || code === 403) {
      logout(true);
      return true;
    }
    return false;
  };

  // ---------- helpers de histórico ----------
  const resetHistory = () => {
    setEncItems([]);
    setEncNext(null);
    setEncHasMore(true);
    setEncTotal(0);
    setNaoItems([]);
    setNaoNext(null);
    setNaoHasMore(true);
    setNaoTotal(0);
  };

  const loadTotals = async () => {
    try {
      const [t1, t2] = await Promise.all([
        apiService.getEncontradosTotal(base),
        apiService.getNaoEncontradosTotal(base),
      ]);
      setEncTotal(t1 || 0);
      setNaoTotal(t2 || 0);
    } catch (e) {
      console.error("Erro ao carregar totais:", e);
    }
  };

  const loadEncMore = async () => {
    if (encLoading || !encHasMore) return;
    setEncLoading(true);
    try {
      const res = await apiService.getEncontradosCursor(base, encNext, 50);
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setEncItems((prev) => [...prev, ...items]);
      setEncNext(res.data?.next_cursor_id ?? null);
      setEncHasMore(Boolean(res.data?.next_cursor_id));
    } catch (e) {
      if (!handleAuthError(e))
        console.error("Erro ao carregar encontrados:", e);
      setEncHasMore(false);
    } finally {
      setEncLoading(false);
    }
  };

  const loadNaoMore = async () => {
    if (naoLoading || !naoHasMore) return;
    setNaoLoading(true);
    try {
      const res = await apiService.getNaoEncontradosCursor(base, naoNext, 50);
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setNaoItems((prev) => [...prev, ...items]);
      setNaoNext(res.data?.next_cursor_id ?? null);
      setNaoHasMore(Boolean(res.data?.next_cursor_id));
    } catch (e) {
      if (!handleAuthError(e))
        console.error("Erro ao carregar nao-encontrados:", e);
      setNaoHasMore(false);
    } finally {
      setNaoLoading(false);
    }
  };

  const loadHistoryFirstPage = async () => {
    resetHistory();
    await Promise.all([loadTotals(), loadEncMore(), loadNaoMore()]);
  };

  useEffect(() => {
    if (authed) loadHistoryFirstPage();
  }, [authed, base]);

  // ---------- login/busca ----------
  const doLogin = async () => {
    try {
      const res = await apiService.login(email, password);
      setAuthToken(res.data.access_token);
      localStorage.setItem("sb_token", res.data.access_token);
      setAuthed(true);
      setRole(res.data.role as Role);
      setClientSlug(res.data.client_slug);
      localStorage.setItem("sb_role", res.data.role);
      localStorage.setItem("sb_client", res.data.client_slug);
      setEmail("");
      setPassword("");
      await loadHistoryFirstPage();
    } catch {
      alert("Falha no login");
    }
  };

  const searchProduct = async () => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setSearchResult(null);
    try {
      const res = await apiService.searchProduct(base, searchCode, {
        parallel: true,
        fallback: true,
      });
      const data = res.data;
      setSearchResult({
        found: true,
        produto: {
          id: 0,
          codauxiliar: data.codauxiliar,
          codprod: data.CODPROD,
          descricao: data.DESCRICAO,
          datahora: new Date().toISOString(),
        },
        message: data?._base
          ? `Consultando ${base} • Encontrado na base ${data._base}`
          : `Consultando ${base} • Produto encontrado`,
      });
      await Promise.all([loadTotals(), loadHistoryFirstPage()]);
    } catch (error: any) {
      if (handleAuthError(error)) return;
      setSearchResult({
        found: false,
        message:
          error?.response?.data?.detail ||
          "Produto não encontrado ou erro no servidor",
      });
      await Promise.all([loadTotals(), loadHistoryFirstPage()]);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (
    id: number,
    type: "encontrados" | "nao-encontrados"
  ) => {
    try {
      if (type === "encontrados") {
        await apiService.deleteEncontrado(id);
        setEncItems((prev) => prev.filter((i) => i.id !== id));
        setEncTotal((t) => Math.max(0, t - 1));
      } else {
        await apiService.deleteNaoEncontrado(id);
        setNaoItems((prev) => prev.filter((i) => i.id !== id));
        setNaoTotal((t) => Math.max(0, t - 1));
      }
    } catch (e) {
      if (!handleAuthError(e)) console.error("Erro ao deletar:", e);
    }
  };

  const updateDescription = async (id: number, description: string) => {
    try {
      await apiService.updateNaoEncontrado(id, description);
      setNaoItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, descricao: description } : i))
      );
    } catch (e) {
      if (!handleAuthError(e)) console.error("Erro ao atualizar descrição:", e);
    }
  };

  // enquanto valida token, não mostra nada
  if (authChecking) return null;

  // login
  if (!authed)
    return (
      <LoginScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        doLogin={doLogin}
      />
    );

  // -------- App autenticada --------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-24 h-64 w-64 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-10 pb-6 relative">
          <div className="mx-auto max-w-5xl">
            <img
              src={logo}
              alt="Faives"
              className="mx-auto h-28 md:h-36 lg:h-40 xl:h-44 mb-3 object-contain select-none drop-shadow-sm"
              draggable={false}
            />
            <p className="text-center text-slate-600">
              Sistema de Consulta de Códigos de Barras
            </p>

            <div className="mt-5 flex justify-center">
              <SegmentedBaseToggle />
            </div>
          </div>

          {/* ações canto superior direito */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {role === "superadmin" && (
              <button
                onClick={() => setShowNewUser(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 shadow-sm"
                title="Criar novo usuário"
              >
                <UserPlus className="h-4 w-4" /> Novo usuário
              </button>
            )}
            <button
              onClick={() => logout(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-900 shadow-sm"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 pb-10">
        <SearchBar
          searchCode={searchCode}
          setSearchCode={setSearchCode}
          onSearch={searchProduct}
          loading={loading}
        />

        <div className="text-center mt-6">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 shadow-sm"
          >
            {showHistory ? (
              <>
                <EyeOff className="h-5 w-5" /> Ocultar Histórico
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" /> Mostrar Histórico
              </>
            )}
          </button>
        </div>

        {searchResult && (
          <div className="mt-6">
            <SearchResult result={searchResult} />
          </div>
        )}

        <div className="mt-6 space-y-4">
          <CollapsibleSection
            title="Filtros e Pesquisa"
            icon={<Filter className="h-5 w-5 text-gray-600" />}
            defaultExpanded={false}
          >
            <FilterPanel filters={filters} setFilters={setFilters} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Exportação e Relatórios"
            icon={<Download className="h-5 w-5 text-gray-600" />}
            defaultExpanded={false}
          >
            <ExportPanel
              encontrados={encItems}
              naoEncontrados={naoItems}
              totalEncontrados={encTotal}
              totalNaoEncontrados={naoTotal}
            />
          </CollapsibleSection>
        </div>

        <div className="text-center my-6">
          <button
            onClick={() => loadHistoryFirstPage()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow"
          >
            <RefreshCw className="h-5 w-5" /> Atualizar Histórico
          </button>
        </div>

        {showHistory && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Produtos Encontrados</span>
                  <span className="ml-2 inline-flex items-center justify-center min-w-[48px] h-6 text-xs rounded-full bg-emerald-100 text-emerald-700 px-2">
                    {encItems.length} / {encTotal}
                  </span>
                </div>
              }
              defaultExpanded
            >
              <ProductList
                items={encItems}
                type="encontrados"
                total={encTotal}
                onDelete={(id) => deleteItem(id, "encontrados")}
                onLoadMore={loadEncMore}
                hasMore={encHasMore}
                loadingMore={encLoading}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Produtos Não Encontrados</span>
                  <span className="ml-2 inline-flex items-center justify-center min-w-[48px] h-6 text-xs rounded-full bg-red-100 text-red-700 px-2">
                    {naoItems.length} / {naoTotal}
                  </span>
                </div>
              }
              defaultExpanded={false}
            >
              <ProductList
                items={naoItems}
                type="nao-encontrados"
                total={naoTotal}
                onDelete={(id) => deleteItem(id, "nao-encontrados")}
                onUpdateDescription={updateDescription}
                onLoadMore={loadNaoMore}
                hasMore={naoHasMore}
                loadingMore={naoLoading}
              />
            </CollapsibleSection>
          </div>
        )}

        <div className="mt-10 text-center text-sm text-gray-500">
          Desenvolvido por{" "}
          <span className="text-blue-600 font-medium">
            Faives soluções em tecnologia
          </span>{" "}
          • © 2025
        </div>
      </div>

      {/* modal novo usuário */}
      {showNewUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Novo usuário</h3>
            <div className="space-y-3">
              {role === "superadmin" && (
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Cliente"
                  value={nuClientSlug}
                  onChange={(e) => setNuClientSlug(e.target.value)}
                />
              )}
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Email"
                value={nuEmail}
                onChange={(e) => setNuEmail(e.target.value)}
              />
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Senha"
                type="password"
                value={nuPwd}
                onChange={(e) => setNuPwd(e.target.value)}
              />
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={nuRole}
                onChange={(e) => setNuRole(e.target.value as any)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  className="px-3 py-2 rounded border"
                  onClick={() => setShowNewUser(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => createNewUser()}
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function createNewUser() {
    try {
      const payload: any = { email: nuEmail, password: nuPwd, role: nuRole };
      if (role === "superadmin" && nuClientSlug.trim())
        payload.client_slug = nuClientSlug.trim();
      await apiService.createUser(payload);
      setShowNewUser(false);
      setNuEmail("");
      setNuPwd("");
      setNuRole("user");
      setNuClientSlug("");
      alert("Usuário criado com sucesso!");
    } catch (e) {
      if (!handleAuthError(e)) {
        console.error(e);
        alert("Falha ao criar usuário");
      }
    }
  }

  function SegmentedBaseToggle() {
    const options: { key: BaseName; label: string; icon: JSX.Element }[] = [
      {
        key: "homecenter",
        label: "Homecenter",
        icon: <Building2 className="h-4 w-4" />,
      },
      { key: "mercado", label: "Mercado", icon: <Store className="h-4 w-4" /> },
    ];
    return (
      <div
        className="inline-flex items-center gap-1 rounded-2xl bg-white/70 backdrop-blur-md px-1 py-1 shadow-sm ring-1 ring-slate-200"
        role="tablist"
        aria-label="Selecionar base"
      >
        {options.map(({ key, label, icon }) => {
          const isActive = base === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setBase(key)}
              className={[
                "group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm ring-1 ring-blue-600"
                  : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <span
                className={[
                  "rounded-lg p-1.5 transition",
                  isActive
                    ? "bg-white/20"
                    : "bg-slate-100 group-hover:bg-slate-200",
                ].join(" ")}
              >
                {icon}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }
}

export default App;
