import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export default function Financeiro() {
  const now = new Date();
  const currentMonthName = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(now.getMonth() + 1);
  const nextMonthName = nextMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <DollarSign className="text-green-600"/> Dashboard Financeiro
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-white capitalize">
            <Calendar size={20}/> {currentMonthName}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-green-600 font-bold uppercase">Receitas</p>
              <p className="text-2xl font-bold text-green-700">R$ 12.450,00</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-xs text-red-600 font-bold uppercase">Despesas</p>
              <p className="text-2xl font-bold text-red-700">R$ 3.200,00</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700 opacity-75">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-white capitalize">
            <TrendingUp size={20}/> Previsão: {nextMonthName}
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-blue-600 font-bold uppercase">Receita Prevista</p>
            <p className="text-2xl font-bold text-blue-700">R$ 14.800,00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
