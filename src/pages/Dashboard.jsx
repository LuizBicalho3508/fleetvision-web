import React, { useState, useEffect } from 'react';
import { getDevices, getPositions } from '../services/api';
import { 
  Truck, CheckCircle, AlertTriangle, Navigation, Activity, 
  Wifi, Zap, MapPin, Gauge
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Componente de Card com Identidade Visual Admin
const DashboardCard = ({ title, value, subtext, icon: Icon, colorClass, loading }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-all hover:shadow-md group">
    <div className="flex justify-between items-start z-10 relative">
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-700 animate-pulse rounded"></div>
        ) : (
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{value}</h3>
        )}
        {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} strokeWidth={2} />
      </div>
    </div>
    {/* Decoração de Fundo */}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 ${colorClass}`}></div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, moving: 0, ignitionOn: 0 });
  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [devs, pos] = await Promise.all([getDevices(), getPositions()]);
      
      const onlineCount = devs.filter(d => d.status === 'online').length;
      const offlineCount = devs.filter(d => d.status === 'offline').length;
      const movingCount = pos.filter(p => p.speed > 0).length;
      const ignitionCount = pos.filter(p => p.attributes?.ignition).length;

      setStats({
        total: devs.length,
        online: onlineCount,
        offline: offlineCount,
        moving: movingCount,
        ignitionOn: ignitionCount
      });

      setPieData([
        { name: 'Online', value: onlineCount, color: '#10b981' }, // Verde
        { name: 'Movimento', value: movingCount, color: '#3b82f6' }, // Azul
        { name: 'Offline', value: offlineCount, color: '#ef4444' }, // Vermelho
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="text-blue-600"/> Visão Geral
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitoramento da frota em tempo real</p>
        </div>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard 
          title="Total da Frota" 
          value={stats.total} 
          subtext="Veículos Cadastrados"
          icon={Truck} 
          colorClass="bg-blue-600" 
          loading={loading}
        />
        <DashboardCard 
          title="Veículos Online" 
          value={stats.online} 
          subtext="Conectados ao Sistema"
          icon={Wifi} 
          colorClass="bg-emerald-500" 
          loading={loading}
        />
        <DashboardCard 
          title="Em Deslocamento" 
          value={stats.moving} 
          subtext="Velocidade > 0 km/h"
          icon={Navigation} 
          colorClass="bg-indigo-500" 
          loading={loading}
        />
        <DashboardCard 
          title="Ignição Ligada" 
          value={stats.ignitionOn} 
          subtext="Veículos Ativos"
          icon={Zap} 
          colorClass="bg-amber-500" 
          loading={loading}
        />
      </div>

      {/* Gráficos e Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gráfico Donut (Estilo Admin) */}
        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <h3 className="font-bold text-slate-700 dark:text-white mb-6 border-b dark:border-slate-700 pb-4">Status da Frota</h3>
          
          <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-5xl font-extrabold text-slate-700 dark:text-white tracking-tight">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Veículos</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  cursor={false}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  iconSize={10}
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Lista de Resumo */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-white mb-6 border-b dark:border-slate-700 pb-4">Resumo Operacional</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-blue-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-slate-500 shadow-sm"><MapPin size={20}/></div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-white">Veículos Parados</p>
                  <p className="text-xs text-slate-500">Ignição desligada</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-700 dark:text-white">{stats.total - stats.moving}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-red-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-red-500 shadow-sm"><AlertTriangle size={20}/></div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-white">Alertas Recentes</p>
                  <p className="text-xs text-slate-500">Últimas 24 horas</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-700 dark:text-white">0</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-green-200 md:col-span-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-green-500 shadow-sm"><CheckCircle size={20}/></div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-white">Sistema Saudável</p>
                  <p className="text-xs text-slate-500">Conexão com servidor estável</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">100% ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
