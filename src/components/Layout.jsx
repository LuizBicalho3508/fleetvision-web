import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast'; // Importação necessária

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Componente que exibe os popups de sucesso/erro */}
      <Toaster position="top-right" toastOptions={{ className: 'font-bold' }} />

      {/* Sidebar (Fixa à esquerda) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Wrapper do Conteúdo */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:ml-64 w-full">
        
        {/* Header fixo */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Conteúdo da Página */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
