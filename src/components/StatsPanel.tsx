import React from 'react';
import { BarChart3, TrendingUp, Target, Clock } from 'lucide-react';
import { ProdutoEncontrado, ProdutoNaoEncontrado } from '../types';

interface StatsPanelProps {
  encontrados: ProdutoEncontrado[];
  naoEncontrados: ProdutoNaoEncontrado[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  encontrados,
  naoEncontrados
}) => {
  const totalItems = encontrados.length + naoEncontrados.length;
  const successRate = totalItems > 0 ? (encontrados.length / totalItems) * 100 : 0;

  // Estatísticas por período
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const todayFound = encontrados.filter(item => 
    new Date(item.datahora) >= todayStart
  ).length;
  
  const todayNotFound = naoEncontrados.filter(item => 
    new Date(item.datahora) >= todayStart
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <BarChart3 className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{totalItems}</span>
        </div>
        <div className="text-sm opacity-90">Total de Buscas</div>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Target className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{encontrados.length}</span>
        </div>
        <div className="text-sm opacity-90">Encontrados</div>
      </div>
      
      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Clock className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{naoEncontrados.length}</span>
        </div>
        <div className="text-sm opacity-90">Não Encontrados</div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="h-6 w-6 opacity-80" />
          <span className="text-2xl font-bold">{successRate.toFixed(0)}%</span>
        </div>
        <div className="text-sm opacity-90">Taxa de Sucesso</div>
      </div>
      
      {/* Estatísticas do dia - apenas em telas maiores */}
      <div className="hidden lg:block lg:col-span-2 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Hoje
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-600 font-semibold">{todayFound}</span>
            <span className="text-gray-600 ml-1">encontrados</span>
          </div>
          <div>
            <span className="text-red-600 font-semibold">{todayNotFound}</span>
            <span className="text-gray-600 ml-1">não encontrados</span>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block lg:col-span-2 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Resumo Geral</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Eficiência:</span>
            <span className={`font-semibold ${successRate >= 70 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {successRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${successRate >= 70 ? 'bg-green-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${successRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};