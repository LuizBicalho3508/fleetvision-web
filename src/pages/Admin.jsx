import React, { useState, useEffect } from 'react';
import { getServerStatus } from '../services/api';
import { 
  Server, Cpu, HardDrive, Activity, Box, Database, 
  Clock, Shield, Terminal, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componente de Barra de Progresso
const ProgressBar = ({ value, color = 'bg-blue-600' }) => (
  <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
    <div 
      className={`h-2.5 rounded-full transition-all duration-1000 ${color}`} 
      style={{ width: `${Math.min(value, 100)}%` }}
    ></div>
  </div>
);

// Card de Estatística
const StatCard = ({ icon: Icon, title, value, subtext, progress, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg hover:border-slate-600 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-20 text-white`}>
        <Icon size={24} />
      </div>
    </div>
    {progress !== undefined && (
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Uso</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <ProgressBar value={progress} color={color.replace('bg-', 'bg-').replace('text-', 'bg-')} />
      </div>
    )}
    {subtext && <p className="text-xs text-slate-500 mt-3 font-mono">{subtext}</p>}
  </div>
);

export default function Admin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    try {
      const stats = await getServerStatus();
      setData(stats);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
      // toast.error('Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-slate-500">
        <Activity className="animate-spin mb-4 text-blue-600" size={48} />
        <p>Conectando ao Kernel da VPS...</p>
      </div>
    );
  }

  // Cálculos de Memória
  const memTotalGB = (data?.mem?.total / 1024 / 1024 / 1024).toFixed(1);
  const memUsedGB = (data?.mem?.active / 1024 / 1024 / 1024).toFixed(1);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 font-sans pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
            <Server size={32} className="text-white"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">System Monitor</h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Terminal size={12}/> {data?.os?.distro} | {data?.os?.hostname}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-500 font-bold uppercase">Última Atualização</p>
            <p className="text-sm text-emerald-400 font-mono">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white border border-slate-700 transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <StatCard 
          icon={Cpu} 
          title="Processador" 
          value={`${Math.round(data?.cpu?.load)}%`} 
          progress={data?.cpu?.load}
          color="bg-blue-600"
          subtext="Intel(R) Xeon(R) CPU @ 2.20GHz"
        />
        
        {/* RAM */}
        <StatCard 
          icon={Box} 
          title="Memória RAM" 
          value={`${memUsedGB} GB`} 
          progress={data?.mem?.usedPercent}
          color="bg-purple-600"
          subtext={`Total: ${memTotalGB} GB Disponível`}
        />

        {/* DOCKER */}
        <StatCard 
          icon={Box} 
          title="Containers" 
          value={data?.docker?.length || 0}
          color="bg-emerald-600"
          subtext={`${data?.docker?.filter(c => c.state === 'running').length} Rodando / ${data?.docker?.length} Total`}
        />

        {/* UPTIME */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tempo Atividade</p>
              <h3 className="text-xl font-black text-white mt-1">
                {(data?.os?.uptime / 3600).toFixed(1)} Horas
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-amber-500 bg-opacity-20 text-amber-500">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900 p-2 rounded">
            <Shield size={12} className="text-green-500"/> Sistema Protegido (Swap Ativa)
          </div>
        </div>
      </div>

      {/* SEÇÃO DE ARMAZENAMENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <HardDrive size={20} className="text-indigo-400"/> Armazenamento
          </h3>
          <div className="space-y-6">
            {data?.disk?.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-slate-300">{d.mount}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {(d.used / 1024 / 1024 / 1024).toFixed(1)} GB / {(d.size / 1024 / 1024 / 1024).toFixed(1)} GB
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${d.use > 80 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${d.use}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-right">{d.use.toFixed(1)}% Usado</p>
              </div>
            ))}
            {(!data?.disk || data.disk.length === 0) && (
              <p className="text-slate-500 text-sm">Nenhum disco físico detectado.</p>
            )}
          </div>
        </div>

        {/* SEÇÃO DOCKER HEALTH */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Box size={20} className="text-blue-400"/> Saúde dos Containers
            </h3>
            <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded">
              Docker Engine
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Container</th>
                  <th className="px-6 py-4">Imagem</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Consumo CPU/RAM</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 font-mono text-xs">
                {data?.docker?.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${c.state === 'running' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                      {c.name.replace('/', '')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{c.image}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        c.state === 'running' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                      }`}>
                        {c.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {c.state === 'running' ? (
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1 text-blue-400"><Cpu size={12}/> {c.cpu_percent?.toFixed(1) || '0.0'}%</span>
                          <span className="flex items-center gap-1 text-purple-400"><Database size={12}/> {c.mem_percent?.toFixed(1) || '0.0'}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{c.status}</td>
                  </tr>
                ))}
                {(!data?.docker || data.docker.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      <AlertCircle className="mx-auto mb-2 opacity-50" size={24}/>
                      Não foi possível ler o socket do Docker. Verifique permissões.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
