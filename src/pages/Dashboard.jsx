import React, { useEffect, useState } from 'react';
import { getDevices, getPositions, getAlertRules } from '../services/api';
import { 
  Truck, Wifi, WifiOff, AlertTriangle, Activity, Map, 
  Battery, Signal, Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Card = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color} text-white shadow-lg`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, moving: 0, alerts: 0 });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [devs, pos] = await Promise.all([getDevices(), getPositions()]);
        
        const online = devs.filter(d => d.status === 'online').length;
        const offline = devs.filter(d => d.status === 'offline').length;
        const moving = pos.filter(p => p.speed > 0).length;

        setStats({
          total: devs.length,
          online,
          offline,
          moving,
          alerts: 0 // Mock por enquanto
        });

        setChartData({
          labels: ['Online', 'Offline', 'Em Movimento'],
          datasets: [{
            data: [online, offline, moving],
            backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
            borderWidth: 0,
          }]
        });
      } catch (e) { console.error(e); }
    };
    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total da Frota" value={stats.total} icon={Truck} color="bg-blue-600" />
        <Card title="Veículos Online" value={stats.online} icon={Wifi} color="bg-emerald-500" />
        <Card title="Veículos Offline" value={stats.offline} icon={WifiOff} color="bg-red-500" />
        <Card title="Em Movimento" value={stats.moving} icon={Activity} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Visão Geral</h3>
          <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <p>Gráfico de histórico em desenvolvimento...</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Status Atual</h3>
          <div className="h-64 relative">
            {chartData && <Doughnut data={chartData} options={{ maintainAspectRatio: false, cutout: '70%' }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
