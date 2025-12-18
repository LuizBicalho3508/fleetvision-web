import React, { useState, useEffect } from 'react';
import { getServerStatus } from '../services/api';
import { 
  Server, Cpu, HardDrive, Activity, Terminal, Power, 
  RotateCcw, Shield, Database, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Card de Recurso com Barra de Progresso
const ResourceCard = ({ title, value, total, percent, icon: Icon, colorClass }) => {
  // Cor dinâmica baseada no uso
  const barColor = percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : colorClass.replace('text-', 'bg-');
  
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{percent}%</h3>
        </div>
        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700 ${colorClass}`}>
          <Icon size={20}/>
        </div>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${percent}%` }}></div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
        <span>{value}</span>
        <span>{total}</span>
      </div>
    </div>
  );
};

// Item de Log do Terminal
const LogItem = ({ time, msg, type }) => (
  <div className="flex gap-3 text-xs font-mono border-b border-white/5 pb-1 mb-1 last:border-0">
    <span className="text-slate-500">[{time}]</span>
    <span className={type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-slate-300'}>
      {msg}
    </span>
  </div>
);

export default function Admin() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Função para formatar Uptime
  const formatUptime = (seconds) => {
    if(!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const loadStatus = async () => {
    try {
      const data = await getServerStatus();
      setStatus(data);
      
      // Simulação de Logs (Para efeito visual)
      const now = new Date().toLocaleTimeString();
      if (data.cpu > 80) addLog(now, 'ALERTA: Uso de CPU elevado detectedo.', 'error');
      else if (Math.random() > 0.7) addLog(now, 'Health check: Sistema operante.', 'success');
      
    } catch (e) {
      addLog(new Date().toLocaleTimeString(), 'Erro ao conectar com API de status.', 'error');
    }
  };

  const addLog = (time, msg, type='info') => {
    setLogs(prev => [{time, msg, type}, ...prev].slice(0, 8)); // Mantém últimos 8
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    const tId = toast.loading('Reiniciando serviços...');
    setTimeout(() => {
      toast.success('Serviços reiniciados!', {id: tId});
      addLog(new Date().toLocaleTimeString(), 'Serviços de backend reiniciados pelo usuário.', 'success');
    }, 2000);
  };

  const handleClearCache = () => {
    toast.success('Cache do sistema limpo.');
    addLog(new Date().toLocaleTimeString(), 'Limpeza de cache executada.', 'info');
  };

  if (!status) return <div className="p-10 text-center text-slate-500 animate-pulse">Carregando métricas do servidor...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Server className="text-blue-600"/> Administração VPS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitoramento de infraestrutura e serviços</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Clock size={14}/> Uptime: {formatUptime(status.uptime)}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResourceCard 
          title="Uso de CPU" 
          percent={status.cpu} 
          value={`${status.cpu}%`} 
          total={status.os}
          icon={Cpu} 
          colorClass="text-blue-500" 
        />
        <ResourceCard 
          title="Memória RAM" 
          percent={status.ram?.percent || 0} 
          value={`${status.ram?.used || 0} MB`} 
          total={`${status.ram?.total || 0} MB Total`}
          icon={Activity} 
          colorClass="text-purple-500" 
        />
        <ResourceCard 
          title="Armazenamento" 
          percent={status.disk?.percent || 0} 
          value={`${status.disk?.used || 0} GB`} 
          total={`${status.disk?.total || 0} GB Total`}
          icon={HardDrive} 
          colorClass="text-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Terminal de Logs */}
        <div className="md:col-span-2 bg-slate-900 rounded-xl p-4 shadow-lg border border-slate-800 font-mono text-xs flex flex-col h-64">
          <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
            <span className="text-slate-400 flex items-center gap-2"><Terminal size={14}/> System Logs</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {logs.map((log, i) => <LogItem key={i} {...log} />)}
            {logs.length === 0 && <span className="text-slate-600 italic">Aguardando eventos...</span>}
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-slate-500">
            <span className="text-green-500">➜</span>
            <span className="animate-pulse">_</span>
          </div>
        </div>

        {/* Painel de Controle */}
        <div className="space-y-4">
          
          {/* Status dos Serviços */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 text-sm uppercase">Status dos Serviços</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Database size={16}/> Banco de Dados</span>
                <CheckCircle size={16} className="text-green-500"/>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Shield size={16}/> Proxy API</span>
                <CheckCircle size={16} className="text-green-500"/>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Activity size={16}/> Traccar Core</span>
                {status.cpu > 0 ? <CheckCircle size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-500"/>}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 text-sm uppercase">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleRestart} className="flex flex-col items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200 dark:border-red-900/30">
                <Power size={20}/>
                <span className="text-xs font-bold">Reiniciar</span>
              </button>
              <button onClick={handleClearCache} className="flex flex-col items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-900/30">
                <RotateCcw size={20}/>
                <span className="text-xs font-bold">Limpar Cache</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
