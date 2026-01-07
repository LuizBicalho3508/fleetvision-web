import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Bell, FileText, Trophy, PlayCircle, Clock, 
  MapPin, Settings, LogOut, Truck, Wrench, DollarSign, Disc, Users, 
  UserCircle, Shield, Route, Server, ClipboardCheck, Activity
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const MenuItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1 mx-2 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
    <Icon size={18} /><span>{label}</span>
  </NavLink>
);

export default function Sidebar({ isOpen, onClose }) {
  const { config } = useConfig();
  const navigate = useNavigate();
  
  const logoUrl = config.logo ? (config.logo.startsWith('http') || config.logo.startsWith('/') ? config.logo : `/storage/uploads/${config.logo}`) : null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-30 h-screen w-64 transition-transform duration-300 lg:translate-x-0 bg-slate-900 text-white border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: config.sidebarBg || '#1e293b' }}>
        <div className="flex items-center justify-center p-6 h-20 border-b border-white/10">
          {logoUrl ? (
            <img src={logoUrl} className="h-10 w-auto object-contain" alt="Logo"/>
          ) : (
            <div className="bg-blue-600 p-2 rounded-lg"><Truck className="text-white" size={24}/></div>
          )}
        </div>
        <div className="overflow-y-auto h-[calc(100vh-5rem)] py-4 custom-scrollbar">
          <div className="space-y-1">
            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Monitoramento</p>
            <MenuItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
            <MenuItem to="/mapa" icon={Map} label="Mapa Ao Vivo" onClick={onClose} />
            <MenuItem to="/alertas" icon={Bell} label="Alertas" onClick={onClose} />
            
            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Relatórios</p>
            <MenuItem to="/relatorios" icon={FileText} label="Relatórios" onClick={onClose} />
            <MenuItem to="/ranking" icon={Trophy} label="Ranking" onClick={onClose} />
            <MenuItem to="/replay" icon={PlayCircle} label="Replay de Rota" onClick={onClose} />
            
            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Gestão</p>
            <MenuItem to="/jornada" icon={Clock} label="Jornada" onClick={onClose} />
            <MenuItem to="/checklist" icon={ClipboardCheck} label="Checklist" onClick={onClose} />
            <MenuItem to="/roteirizador" icon={MapPin} label="Roteirizador" onClick={onClose} />
            <MenuItem to="/rotas" icon={Route} label="Minhas Rotas" onClick={onClose} />
            <MenuItem to="/manutencao" icon={Wrench} label="Manutenção" onClick={onClose} />
            <MenuItem to="/financeiro" icon={DollarSign} label="Financeiro" onClick={onClose} />

            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Cadastros</p>
            <MenuItem to="/frota" icon={Truck} label="Veículos" onClick={onClose} />
            <MenuItem to="/pneus" icon={Disc} label="Gestão de Pneus" onClick={onClose} />
            <MenuItem to="/clientes" icon={Users} label="Clientes" onClick={onClose} />
            <MenuItem to="/motoristas" icon={UserCircle} label="Motoristas" onClick={onClose} />
            <MenuItem to="/usuarios" icon={UserCircle} label="Usuários" onClick={onClose} />
            <MenuItem to="/perfis" icon={Shield} label="Perfis de Acesso" onClick={onClose} />

            <p className="px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Sistema</p>
            <MenuItem to="/teste" icon={Activity} label="Teste de Equipamentos" onClick={onClose} />
            <MenuItem to="/admin" icon={Server} label="Administração VPS" onClick={onClose} />
            <MenuItem to="/config" icon={Settings} label="Configurações" onClick={onClose} />
            
            <div className="px-2 mt-4"><button onClick={() => { localStorage.removeItem('isAuthenticated'); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><LogOut size={18} /> <span>Sair</span></button></div>
          </div>
        </div>
      </aside>
    </>
  );
}
