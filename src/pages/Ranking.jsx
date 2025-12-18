import React, { useEffect, useState } from 'react';
import { getDevices, getEvents, getCustomEvents } from '../services/api';
import { calculateScores } from '../utils/telemetry';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';
import { 
  Medal, Trophy, Gauge, AlertTriangle, Clock, Calendar, 
  Search, Download, Crown, AlertOctagon, User, Activity
} from 'lucide-react';
import jsPDF from 'jspdf'; 
import 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const PodiumCard = ({ driver, place }) => {
  if (!driver) return null;
  const colors = {
    1: 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400',
    2: 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300',
    3: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400'
  };
  const iconColor = { 1: 'text-yellow-500', 2: 'text-slate-400', 3: 'text-orange-500' };

  return (
    <div className={`relative flex flex-col items-center p-6 rounded-2xl border-2 ${colors[place]} shadow-lg transform hover:-translate-y-1 transition-all flex-1 min-w-[200px]`}>
      <div className="absolute -top-5 bg-white dark:bg-slate-900 p-3 rounded-full shadow-md border border-slate-100 dark:border-slate-700">
        <Crown size={32} className={iconColor[place]} fill="currentColor" />
      </div>
      <div className="mt-6 text-center">
        <h3 className="text-xl font-bold dark:text-white truncate max-w-[150px]">{driver.name}</h3>
        <p className="text-xs uppercase font-bold opacity-70 mb-2">{place}º Lugar</p>
        <div className="text-4xl font-black mb-2">{driver.score}</div>
        <div className="flex gap-3 text-xs opacity-75 justify-center">
          <span title="Velocidade" className="flex items-center gap-1"><Gauge size={12}/> {driver.violations?.speeding || 0}</span>
          <span title="Frenagem" className="flex items-center gap-1"><AlertTriangle size={12}/> {driver.violations?.braking || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(formatISO(startOfMonth(new Date())).slice(0,16));
  const [dateTo, setDateTo] = useState(formatISO(endOfMonth(new Date())).slice(0,16));

  const loadData = async () => {
    setLoading(true);
    try { 
      const from = new Date(dateFrom).toISOString();
      const to = new Date(dateTo).toISOString();
      const [d, e, c] = await Promise.all([getDevices(), getEvents(from, to).catch(()=>[]), getCustomEvents(from, to).catch(()=>[])]);
      const scores = calculateScores(d, e, c);
      setRanking(scores.sort((a,b) => b.score - a.score));
      toast.success('Ranking atualizado!');
    } catch (e) { toast.error('Erro ao calcular ranking'); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const getScoreColor = (s) => {
    if (s >= 90) return 'bg-green-500';
    if (s >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const exportPDF = () => { 
    const doc = new jsPDF(); 
    doc.text("Ranking de Conduta", 14, 15); 
    doc.autoTable({ 
      startY: 25,
      head: [['Pos', 'Motorista', 'Score', 'Vel', 'Fren', 'Acel']], 
      body: ranking.map((r,i)=>[i+1, r.name, r.score, r.violations.speeding, r.violations.braking, r.violations.acceleration||0])
    }); 
    doc.save("ranking.pdf"); 
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Trophy className="text-yellow-500"/> Ranking</h1><p className="text-sm text-slate-500">Avaliação de desempenho.</p></div>
        <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
          <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">De</label><input type="datetime-local" className="w-full p-2 border rounded-lg text-sm dark:bg-slate-900 dark:text-white" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></div>
          <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Até</label><input type="datetime-local" className="w-full p-2 border rounded-lg text-sm dark:bg-slate-900 dark:text-white" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></div>
          <button onClick={loadData} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg shadow-lg"><Search size={20}/></button>
          <button onClick={exportPDF} className="bg-slate-700 hover:bg-slate-800 text-white p-2.5 rounded-lg"><Download size={20}/></button>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 px-4 py-4">
          <div className="order-2 md:order-1 w-full md:w-1/3 transform md:scale-90"><PodiumCard driver={ranking[1]} place={2} /></div>
          <div className="order-1 md:order-2 w-full md:w-1/3 transform md:-translate-y-4 z-10"><PodiumCard driver={ranking[0]} place={1} /></div>
          <div className="order-3 md:order-3 w-full md:w-1/3 transform md:scale-90"><PodiumCard driver={ranking[2]} place={3} /></div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
              <tr><th className="p-4 w-16">Pos</th><th className="p-4">Motorista</th><th className="p-4 w-32 text-center">Score</th><th className="p-4 text-center">Infrações</th><th className="p-4 text-right">Avaliação</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {ranking.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-bold text-slate-400">#{i+1}</td>
                  <td className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"><User size={16} className="text-slate-500"/></div><div><p className="font-bold text-slate-700 dark:text-white">{r.name}</p></div></div></td>
                  <td className="p-4"><div className="flex flex-col items-center gap-1"><span className="font-bold text-lg dark:text-white">{r.score}</span><div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className={`h-full ${getScoreColor(r.score)}`} style={{ width: `${r.score}%` }}></div></div></div></td>
                  <td className="p-4"><div className="flex justify-center gap-4 text-xs text-slate-500"><div className="flex flex-col items-center"><Gauge size={14} className="text-blue-500"/><span>{r.violations.speeding}x</span></div><div className="flex flex-col items-center"><AlertOctagon size={14} className="text-red-500"/><span>{r.violations.braking}x</span></div><div className="flex flex-col items-center"><Activity size={14} className="text-orange-500"/><span>{r.violations.acceleration||0}x</span></div></div></td>
                  <td className="p-4 text-right"><span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getScoreColor(r.score)}`}>{r.score >= 90 ? 'EXCELENTE' : r.score >= 70 ? 'REGULAR' : 'CRÍTICO'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
