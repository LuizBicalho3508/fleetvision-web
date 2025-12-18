import React from 'react';
import { Menu, Bell, User, Moon, Sun, LogOut } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const { config, setConfig } = useConfig();
  const navigate = useNavigate();
  const isDark = config.theme?.mode === 'dark'; // Lógica simplificada de tema

  const toggleTheme = () => {
    // Aqui você pode expandir a lógica de tema se usar classes do Tailwind
    const newMode = isDark ? 'light' : 'dark';
    setConfig({ ...config, theme: { ...config.theme, mode: newMode } });
    if (newMode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Botão Hamburger (Só aparece no Mobile) */}
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
          <Menu size={20} />
        </button>
        
        <h2 className="text-lg font-semibold text-slate-700 dark:text-white hidden md:block">
          FleetVision
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
          {isDark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
        </button>

        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700 dark:text-white">{user.name || 'Admin'}</p>
            <p className="text-xs text-slate-500">{user.email || 'admin@fleet.com'}</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
