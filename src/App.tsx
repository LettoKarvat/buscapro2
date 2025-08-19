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

/* -------------------- LoginScreen (fora do App) -------------------- */
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
    emailRef.current?.focus(); // foca só no primeiro mount
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
        <h3 className="text-lg font-semibold mb-4 text-center">Acessar</h3>
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
/* ------------------------------------------------------------------- */

function App() {
  // busca
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultType | null>(
    null
  );

  // base selecionada (persistida)
  const [base, _setBase] = useState<BaseName>(
    () => (localStorage.getItem("sb_base") as BaseName) || "homecenter"
  );
  const setBase = (b: BaseName) => {
    _setBase(b);
    localStorage.setItem("sb_base", b);
  };

  // histórico
  const [encontrados, setEncontrados] = useState<ProdutoEncontrado[]>([]);
  const [naoEncontrados, setNaoEncontrados] = useState<ProdutoNaoEncontrado[]>(
    []
  );
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

  // login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // modal Novo Usuário (apenas superadmin)
  const [showNewUser, setShowNewUser] = useState(false);
  const [nuEmail, setNuEmail] = useState("");
  const [nuPwd, setNuPwd] = useState("");
  const [nuRole, setNuRole] = useState<Exclude<Role, null>>("user");
  const [nuClientSlug, setNuClientSlug] = useState("");

  // -------- Auth Gate: valida token ao iniciar --------
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
        const me = await apiService.validateToken(); // GET /auth/me (ou similar)
        setAuthed(true);
        setRole(me.data?.role as Role);
        setClientSlug(me.data?.client_slug ?? null);
        localStorage.setItem("sb_role", me.data?.role ?? "");
        localStorage.setItem("sb_client", me.data?.client_slug ?? "");
      } catch {
        logout(true); // token inválido
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  // helper: derruba sessão
  const logout = (silent = false) => {
    setAuthToken(null);
    setAuthed(false);
    setRole(null);
    setClientSlug(null);
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_role");
    localStorage.removeItem("sb_client");
    if (!silent) alert("Sessão encerrada.");
  };

  // helper: trata 401/403 e derruba sessão
  const handleAuthError = (e: any) => {
    const code = e?.response?.status;
    if (code === 401 || code === 403) {
      logout(true);
      return true;
    }
    return false;
  };

  const loadHistory = async () => {
    if (!authed) return;
    try {
      const [encResponse, naoResponse] = await Promise.all([
        apiService.getEncontrados(base),
        apiService.getNaoEncontrados(base),
      ]);
      setEncontrados(Array.isArray(encResponse.data) ? encResponse.data : []);
      setNaoEncontrados(
        Array.isArray(naoResponse.data) ? naoResponse.data : []
      );
    } catch (e) {
      if (!handleAuthError(e)) {
        console.error("Erro ao carregar histórico:", e);
      }
      setEncontrados([]);
      setNaoEncontrados([]);
    }
  };

  useEffect(() => {
    if (authed) loadHistory();
  }, [authed, base]);

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
      await loadHistory();
    } catch (e) {
      alert("Falha no login");
    }
  };

  // busca usando base selecionada; com fallback para a outra base
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
      await loadHistory();
    } catch (error: any) {
      if (handleAuthError(error)) return;
      setSearchResult({
        found: false,
        message:
          error?.response?.data?.detail ||
          "Produto não encontrado ou erro no servidor",
      });
      await loadHistory();
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
        setEncontrados((prev) => prev.filter((i) => i.id !== id));
      } else {
        await apiService.deleteNaoEncontrado(id);
        setNaoEncontrados((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      if (!handleAuthError(e)) console.error("Erro ao deletar:", e);
    }
  };

  const updateDescription = async (id: number, description: string) => {
    try {
      await apiService.updateNaoEncontrado(id, description);
      setNaoEncontrados((prev) =>
        prev.map((i) => (i.id === id ? { ...i, descricao: description } : i))
      );
    } catch (e) {
      if (!handleAuthError(e)) console.error("Erro ao atualizar descrição:", e);
    }
  };

  // guard-rails
  const safeFilter = <T,>(arr: unknown) =>
    Array.isArray(arr) ? (arr as T[]) : [];
  const encontradosList = safeFilter<ProdutoEncontrado>(encontrados);
  const naoEncontradosList = safeFilter<ProdutoNaoEncontrado>(naoEncontrados);

  // criar usuário (superadmin)
  const createNewUser = async () => {
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
  };

  const SegmentedBaseToggle = () => {
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
  };

  // enquanto valida token, não mostra nada (nem login)
  if (authChecking) return null;

  // se não autenticado, mostra apenas a tela de login
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
              encontrados={encontradosList}
              naoEncontrados={naoEncontradosList}
            />
          </CollapsibleSection>
        </div>

        <div className="text-center my-6">
          <button
            onClick={loadHistory}
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
                  <span className="ml-2 inline-flex items-center justify-center min-w-[32px] h-6 text-xs rounded-full bg-emerald-100 text-emerald-700 px-2">
                    {encontradosList.length}
                  </span>
                </div>
              }
              defaultExpanded
            >
              <ProductList
                items={encontradosList}
                type="encontrados"
                onDelete={(id) => deleteItem(id, "encontrados")}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Produtos Não Encontrados</span>
                  <span className="ml-2 inline-flex items-center justify-center min-w-[32px] h-6 text-xs rounded-full bg-red-100 text-red-700 px-2">
                    {naoEncontradosList.length}
                  </span>
                </div>
              }
              defaultExpanded={false}
            >
              <ProductList
                items={naoEncontradosList}
                type="nao-encontrados"
                onDelete={(id) => deleteItem(id, "nao-encontrados")}
                onUpdateDescription={updateDescription}
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

      {/* modal novo usuário (superadmin) */}
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
                  onClick={createNewUser}
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
}

export default App;
