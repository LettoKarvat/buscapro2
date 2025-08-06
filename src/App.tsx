import React, { useState, useEffect } from "react";
import {
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Filter,
} from "lucide-react";
import { SearchBar } from "./components/SearchBar";
import { SearchResult } from "./components/SearchResult";
import { FilterPanel } from "./components/FilterPanel";
import { ProductList } from "./components/ProductList";
import { ExportPanel } from "./components/ExportPanel";
import { StatsPanel } from "./components/StatsPanel";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { apiService } from "./utils/api";
import logo from "./assets/faiveslogo.png";
import { filterEncontrados, filterNaoEncontrados } from "./utils/filters";
import {
  ProdutoEncontrado,
  ProdutoNaoEncontrado,
  SearchResult as SearchResultType,
  FilterOptions,
} from "./types";

function App() {
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultType | null>(
    null
  );
  const [encontrados, setEncontrados] = useState<ProdutoEncontrado[]>([]);
  const [naoEncontrados, setNaoEncontrados] = useState<ProdutoNaoEncontrado[]>(
    []
  );
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Carregar histórico automaticamente
  const loadHistory = async () => {
    try {
      const [encResponse, naoResponse] = await Promise.all([
        apiService.getEncontrados(),
        apiService.getNaoEncontrados(),
      ]);
      setEncontrados(encResponse.data);
      setNaoEncontrados(naoResponse.data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  // Carregar histórico na inicialização
  useEffect(() => {
    loadHistory();
  }, []);

  // Buscar produto
  const searchProduct = async () => {
    if (!searchCode.trim()) return;

    setLoading(true);
    setSearchResult(null);

    try {
      const response = await apiService.searchProduct(searchCode);
      setSearchResult({
        found: true,
        produto: response.data,
        message: "Produto encontrado com sucesso!",
      });

      // Atualizar histórico em tempo real
      await loadHistory();
    } catch (error: any) {
      setSearchResult({
        found: false,
        message:
          error.response?.data?.detail ||
          "Produto não encontrado ou erro no servidor",
      });

      // Atualizar histórico em tempo real (para casos de não encontrado)
      await loadHistory();
    } finally {
      setLoading(false);
    }
  };

  // Deletar item
  const deleteItem = async (
    id: number,
    type: "encontrados" | "nao-encontrados"
  ) => {
    try {
      if (type === "encontrados") {
        await apiService.deleteEncontrado(id);
        setEncontrados((prev) => prev.filter((item) => item.id !== id));
      } else {
        await apiService.deleteNaoEncontrado(id);
        setNaoEncontrados((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Erro ao deletar item:", error);
    }
  };

  // Atualizar descrição de produto não encontrado
  const updateDescription = async (id: number, description: string) => {
    try {
      await apiService.updateNaoEncontrado(id, description);
      setNaoEncontrados((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, descricao: description } : item
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar descrição:", error);
    }
  };

  // Filtrar dados
  const filteredEncontrados = filterEncontrados(encontrados, filters);
  const filteredNaoEncontrados = filterNaoEncontrados(naoEncontrados, filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Faives Soluções em Tecnologia"
            className="mx-auto h-24 mb-3 object-contain select-none" /* 96 px */
          />

          <p className="text-lg text-gray-600">
            Sistema de Consulta de Códigos de Barras
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          searchCode={searchCode}
          setSearchCode={setSearchCode}
          onSearch={searchProduct}
          loading={loading}
        />

        {/* Search Result */}
        {searchResult && <SearchResult result={searchResult} />}

        {/* Stats Panel - sempre visível no topo */}

        {/* Toggle History Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all mx-auto border border-gray-200 hover:border-blue-300"
          >
            {showHistory ? (
              <>
                <EyeOff className="h-5 w-5" />
                Ocultar Histórico
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Ver Histórico
              </>
            )}
          </button>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="space-y-6">
            {/* Collapsible Sections */}
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
                encontrados={filteredEncontrados}
                naoEncontrados={filteredNaoEncontrados}
              />
            </CollapsibleSection>

            {/* Refresh Button */}
            <div className="text-center">
              <button
                onClick={loadHistory}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mx-auto shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar Histórico
              </button>
            </div>

            {/* Product Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductList
                title="Produtos Encontrados"
                items={filteredEncontrados}
                onDelete={(id) => deleteItem(id, "encontrados")}
                type="found"
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                emptyMessage="Nenhum produto encontrado no histórico"
              />

              <ProductList
                title="Produtos Não Encontrados"
                items={filteredNaoEncontrados}
                onDelete={(id) => deleteItem(id, "nao-encontrados")}
                onUpdateDescription={updateDescription}
                type="not-found"
                icon={<XCircle className="h-5 w-5 text-red-600" />}
                emptyMessage="Nenhum produto não encontrado no histórico"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            Desenvolvido por{" "}
            <span className="text-blue-600 font-medium">
              Faives soluções em tecnologia
            </span>{" "}
            • © 2025
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
