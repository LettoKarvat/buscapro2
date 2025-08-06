import { ProdutoEncontrado, ProdutoNaoEncontrado, FilterOptions } from '../types';

export const filterEncontrados = (
  items: ProdutoEncontrado[],
  filters: FilterOptions
): ProdutoEncontrado[] => {
  let filtered = items;

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.codauxiliar.toLowerCase().includes(term) ||
      item.codprod.toLowerCase().includes(term) ||
      item.descricao.toLowerCase().includes(term)
    );
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(item =>
      new Date(item.datahora) >= new Date(filters.dateFrom)
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(item =>
      new Date(item.datahora) <= new Date(filters.dateTo)
    );
  }

  // Ordenação
  filtered.sort((a, b) => {
    let aValue, bValue;
    
    switch (filters.sortBy) {
      case 'date':
        aValue = new Date(a.datahora).getTime();
        bValue = new Date(b.datahora).getTime();
        break;
      case 'code':
        aValue = a.codauxiliar;
        bValue = b.codauxiliar;
        break;
      case 'description':
        aValue = a.descricao;
        bValue = b.descricao;
        break;
      default:
        aValue = new Date(a.datahora).getTime();
        bValue = new Date(b.datahora).getTime();
    }

    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return filtered;
};

export const filterNaoEncontrados = (
  items: ProdutoNaoEncontrado[],
  filters: FilterOptions
): ProdutoNaoEncontrado[] => {
  let filtered = items;

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.codauxiliar.toLowerCase().includes(term) ||
      (item.descricao?.toLowerCase().includes(term) ?? false)
    );
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(item =>
      new Date(item.datahora) >= new Date(filters.dateFrom)
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(item =>
      new Date(item.datahora) <= new Date(filters.dateTo)
    );
  }

  // Ordenação
  filtered.sort((a, b) => {
    let aValue, bValue;
    
    switch (filters.sortBy) {
      case 'date':
        aValue = new Date(a.datahora).getTime();
        bValue = new Date(b.datahora).getTime();
        break;
      case 'code':
        aValue = a.codauxiliar;
        bValue = b.codauxiliar;
        break;
      case 'description':
        aValue = a.descricao || '';
        bValue = b.descricao || '';
        break;
      default:
        aValue = new Date(a.datahora).getTime();
        bValue = new Date(b.datahora).getTime();
    }

    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return filtered;
};