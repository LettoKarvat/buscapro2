import React, { useRef, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  searchCode: string;
  setSearchCode: (code: string) => void;
  onSearch: () => void | Promise<void>;
  loading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchCode,
  setSearchCode,
  onSearch,
  loading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // foco inicial
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // devolve foco quando a busca terminar
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  // busca + limpa
  const handleSearch = () => {
    if (!searchCode.trim() || loading) return;
    onSearch();
    setSearchCode("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite o código de barras..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={loading}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-transparent read-only:bg-gray-100"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !searchCode.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     flex items-center gap-2 min-w-[120px] justify-center"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span>Buscar</span>
        </button>
      </div>
    </div>
  );
};
