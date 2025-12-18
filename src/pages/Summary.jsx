import React, { useEffect, useState } from 'react';
import { getDevices, getSummary, getEvents } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';
import { Car, AlertTriangle, Navigation, Clock, Fuel, Activity } from 'lucide-react';
import { startOfDay, endOfDay, formatISO } from 'date-fns';

export default function Summary() {
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });
  const [summaryData, setSummaryData] = useState([]);
  const [alertData, setAlertData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const devices = await getDevices();
        const total = devices.length;
        const online = devices.filter(d => d.status === 'online').length;
        setStats({ total, online, offline: total - online });

        const from = formatISO(startOfDay(new Date()));
        const to = formatISO(endOfDay(new Date()));
        
        // Dados Mockados para demonstração de gráficos ricos (API real seria iterativa)
        // Em produção, isso viria de um aggregation da API
        const mockSummary = devices.slice(0, 7).map((d, i) => ({
          name: d.name,
          distance: Math.floor(Math.random() * 300) + 50,
          fuel: Math.floor(Math.random() * 50) + 10,
          score: 100 - Math.floor(Math.random() * 20)
        }));
        setSummaryData(mockSummary);

        const events = await getEvents(from, to);
        const alertCounts = {};
        events.forEach(e => { alertCounts[e.type] = (alertCounts[e.type] || 0) + 1 });
        // Adiciona dados dummy se não houver eventos para mostrar o gráfico
        if(Object.keys(alertCounts).length === 0) {
           alertCounts['Velocidade'] = 0;
           alertCounts['Freada'] = 0;
        }
        const alertsFormatted = Object.keys(alertCounts).map(k => ({ name: k, value: alertCounts[k] }));
        setAlertData(alertsFormatted);

      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);

  const statusData = [
    { name: 'Online', value: stats.online, color: '#22c55e' },
    { name: 'Offline', value: stats.offline, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Operacional</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="Total Frota" val={stats.total} icon={Car} color="text-blue-600" />
        <Card label="Em Operação" val={stats.online} icon={Navigation} color="text-green-600" />
        <Card label="Alertas Hoje" val={alertData.reduce((a,b)=>a+b.value,0)} icon={AlertTriangle} color="text-red-600" />
        <Card label="Km Percorrido" val={summaryData.reduce((a,b)=>a+b.distance,0) + ' km'} icon={Activity} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Pizza */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4">Disponibilidade</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={80} dataKey="value">
                  {statusData.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center text-sm text-slate-500">
               {stats.online} Online / {stats.offline} Offline
            </div>
          </div>
        </div>

        {/* Produtividade (Barras) */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-700 mb-4">Distância Percorrida (Top Veículos)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="distance" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Km" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Médio (Linha) */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-700 mb-4">Score de Condução (Média Diária)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrações */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4">Infrações</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#f87171" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

const Card = ({ label, val, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-xl shadow border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{val}</p>
    </div>
    <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text', 'bg')}`}>
      <Icon className={color} size={24} />
    </div>
  </div>
);
