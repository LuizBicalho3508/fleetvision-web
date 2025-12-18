import React, { useState, useEffect } from 'react';
import { getSchedules, getDevices, deleteSchedule } from '../services/api';
import { Calendar, Truck, Clock, CheckCircle, AlertTriangle, Trash2, Route, XCircle, Timer } from 'lucide-react';

export default function Rotas() {
  const [schedules, setSchedules] = useState([]);
  const [devices, setDevices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const [scheds, devs] = await Promise.all([ getSchedules(), getDevices() ]); setSchedules(scheds); const devMap = {}; devs.forEach(d => devMap[d.id] = d.name); setDevices(devMap); } catch (e) {} finally { setLoading(false); } };
  const handleDelete = async (id) => { if(confirm('Excluir?')) { await deleteSchedule(id); loadData(); } };
  const getStatusBadge = (status) => {
    const map = {
      'pending': { color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300', icon: <Clock size={14}/>, label: 'AGENDADO' },
      'active': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 animate-pulse', icon: <Truck size={14}/>, label: 'EM ROTA' },
      'completed': { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: <CheckCircle size={14}/>, label: 'CONCLUÍDO' },
      'late_start': { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: <AlertTriangle size={14}/>, label: 'ATRASO SAÍDA' }
    };
    const s = map[status] || map['pending'];
    return <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-transparent ${s.color}`}>{s.icon} {s.label}</span>;
  };
  const formatDate = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Rotas</h1><p className="text-slate-500 dark:text-slate-400">Status e pontualidade.</p></div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-200"><tr><th className="px-6 py-4">Rota / Veículo</th><th className="px-6 py-4">Horários</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {schedules.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4"><div className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2"><Route size={16} className="text-blue-500"/> {s.routeName}</div><div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 w-fit px-2 py-0.5 rounded"><Truck size={12}/> {devices[s.deviceId] || 'Veículo Desc.'}</div></td>
                <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="font-mono text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1 rounded">S</span> {formatDate(s.scheduledStart)}</div><div className="flex items-center gap-2 mt-1"><span className="font-mono text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-1 rounded">C</span> {formatDate(s.scheduledEnd)}</div></td>
                <td className="px-6 py-4 flex justify-center">{getStatusBadge(s.status)}</td>
                <td className="px-6 py-4 text-right"><button onClick={()=>handleDelete(s.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"><Trash2 size={18}/></button></td>
              </tr>
            ))}
            {schedules.length === 0 && !loading && <tr><td colSpan="4" className="p-10 text-center text-slate-400 dark:text-slate-500"><div className="flex flex-col items-center gap-2"><XCircle size={32} className="opacity-20"/><p>Nenhuma rota agendada.</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
