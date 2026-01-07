import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Truck, Box, Bell, User, LogOut, 
  Menu, X, Settings, AlertTriangle, FileText, Activity,
  Shield, PenTool, DollarSign, ChevronRight
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Recupera usuário
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/mapa', icon: Map, label: 'Mapa Ao Vivo' },
    { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
    { type: 'divider', label: 'Gestão' },
    { to: '/frota', icon: Truck, label: 'Frota' },
    { to: '/estoque', icon: Box, label: 'Estoque' }, // Novo Item
    { to: '/manutencao', icon: PenTool, label: 'Manutenção' },
    { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { type: 'divider', label: 'Sistema' },
    { to: '/relatorios', icon: FileText, label: 'Relatórios' },
    { to: '/teste', icon: Activity, label: 'Teste de Equip.' },
    { to: '/admin', icon: Shield, label: 'Admin VPS' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Truck size={24} className="text-white"/></div>
          <span className="text-xl font-black tracking-tight">FleetVision</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item, idx) => (
            item.type === 'divider' ? (
              <div key={idx} className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                {item.label}
              </div>
            ) : (
              <Link 
                key={idx} 
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.to 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-bold w-full transition-colors">
            <LogOut size={16}/> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative w-64 bg-slate-900 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={() => setSidebarOpen(false)}><X size={24}/></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item, idx) => (
                item.type !== 'divider' && (
                  <Link 
                    key={idx} 
                    to={item.to} 
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                      location.pathname === item.to ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white dark:bg-slate-800 h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600 dark:text-slate-300">
              <Menu size={24}/>
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white hidden md:block">
              {menuItems.find(i => i.to === location.pathname)?.label || 'FleetVision'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full relative">
              <Bell size={20}/>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white">{user.name || 'Usuário'}</p>
                <p className="text-[10px] text-green-500 font-bold uppercase">Online</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
