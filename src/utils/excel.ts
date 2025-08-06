import * as XLSX from 'xlsx';
import { ProdutoEncontrado, ProdutoNaoEncontrado } from '../types';

export const exportToExcel = (
  encontrados: ProdutoEncontrado[],
  naoEncontrados: ProdutoNaoEncontrado[]
) => {
  const workbook = XLSX.utils.book_new();

  // Planilha de produtos encontrados
  const encontradosData = encontrados.map(item => ({
    'ID': item.id,
    'Código Auxiliar': item.codauxiliar,
    'Código Produto': item.codprod,
    'Descrição': item.descricao,
    'Data/Hora': new Date(item.datahora).toLocaleString('pt-BR')
  }));

  const encontradosWs = XLSX.utils.json_to_sheet(encontradosData);
  XLSX.utils.book_append_sheet(workbook, encontradosWs, 'Produtos Encontrados');

  // Planilha de produtos não encontrados
  const naoEncontradosData = naoEncontrados.map(item => ({
    'ID': item.id,
    'Código Auxiliar': item.codauxiliar,
    'Descrição': item.descricao || 'Sem descrição',
    'Data/Hora': new Date(item.datahora).toLocaleString('pt-BR')
  }));

  const naoEncontradosWs = XLSX.utils.json_to_sheet(naoEncontradosData);
  XLSX.utils.book_append_sheet(workbook, naoEncontradosWs, 'Produtos Não Encontrados');

  // Resumo estatístico
  const resumoData = [
    { 'Tipo': 'Produtos Encontrados', 'Quantidade': encontrados.length },
    { 'Tipo': 'Produtos Não Encontrados', 'Quantidade': naoEncontrados.length },
    { 'Tipo': 'Total de Buscas', 'Quantidade': encontrados.length + naoEncontrados.length }
  ];

  const resumoWs = XLSX.utils.json_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(workbook, resumoWs, 'Resumo');

  // Salvar arquivo
  const fileName = `produtos_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};