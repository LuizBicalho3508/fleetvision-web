import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap = {
  'dashboard': 'Visão Geral',
  'mapa': 'Mapa Real',
  'alertas': 'Alertas',
  'frota': 'Veículos',
  'motoristas': 'Motoristas',
  'clientes': 'Clientes',
  'pneus': 'Pneus',
  'usuarios': 'Usuários',
  'perfis': 'Perfis de Acesso',
  'config': 'Configurações',
  'manutencao': 'Manutenção',
  'financeiro': 'Financeiro',
  'roteirizador': 'Planejador',
  'rotas': 'Gestão de Rotas',
  'jornada': 'Jornada',
  'testador': 'Laboratório'
};

const categoryMap = {
  'frota': 'Cadastros', 'motoristas': 'Cadastros', 'clientes': 'Cadastros', 'pneus': 'Cadastros',
  'manutencao': 'Operação', 'financeiro': 'Operação', 'roteirizador': 'Operação', 'rotas': 'Operação', 'jornada': 'Operação',
  'usuarios': 'Admin', 'perfis': 'Admin', 'config': 'Admin', 'testador': 'Admin'
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const currentPage = pathnames[pathnames.length - 1];
  
  if (pathnames.length === 0) return null;

  const category = categoryMap[currentPage];
  const pageName = routeNameMap[currentPage] || currentPage;

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-4 animate-in fade-in slide-in-from-left-2">
      <Link to="/dashboard" className="hover:text-blue-600 transition-colors"><Home size={14}/></Link>
      {category && (
        <>
          <ChevronRight size={14} className="mx-1 opacity-50"/>
          <span className="opacity-80">{category}</span>
        </>
      )}
      <ChevronRight size={14} className="mx-1 opacity-50"/>
      <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{pageName}</span>
    </nav>
  );
}
