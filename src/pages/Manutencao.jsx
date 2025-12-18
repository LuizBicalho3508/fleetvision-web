import React, { useState, useEffect, useMemo } from 'react';
import { getDevices, getPositions, getMaintPlans, addMaintPlan, deleteMaintPlan, getMaintLogs, addMaintLog, deleteMaintLog } from '../services/api';
import { Wrench, Plus, Trash2, CheckCircle, AlertTriangle, XCircle, Settings, ClipboardList, Calendar, Truck } from 'lucide-react';

export default function Manutencao() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState({});
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', intervalKm: 10000, warningKm: 1000 });
  const [logForm, setLogForm] = useState({ deviceId: '', planId: '', serviceDate: '', serviceKm: '', cost: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try { const [devs, pos, p, l] = await Promise.all([getDevices(), getPositions(), getMaintPlans(), getMaintLogs()]); setDevices(devs); const posMap={}; pos.forEach(p=>posMap[p.deviceId]=p); setPositions(posMap); setPlans(p); setLogs(l); } catch(e){}
  };

  const maintenanceStatus = useMemo(() => {
    const statusList = [];
    devices.forEach(dev => {
      const currentOdometer = (positions[dev.id]?.attributes?.totalDistance || 0) / 1000;
      plans.forEach(plan => {
        const lastLog = logs.filter(l => l.deviceId == dev.id && l.planId == plan.id).sort((a,b) => b.serviceKm - a.serviceKm)[0];
        const lastKm = lastLog ? lastLog.serviceKm : 0;
        const nextKm = lastKm + plan.intervalKm;
        const remaining = nextKm - currentOdometer;
        const percent = Math.min(100, Math.max(0, (1 - (remaining / plan.intervalKm)) * 100));
        let status = 'ok'; if (remaining < 0) status = 'overdue'; else if (remaining < plan.warningKm) status = 'warning';
        statusList.push({ id: `${dev.id}-${plan.id}`, device: dev.name, plan: plan.name, currentKm: currentOdometer.toFixed(0), nextKm: nextKm.toFixed(0), remaining: remaining.toFixed(0), percent, status });
      });
    });
    return statusList.sort((a,b) => a.remaining - b.remaining);
  }, [devices, positions, plans, logs]);

  const handleSavePlan = async (e) => { e.preventDefault(); await addMaintPlan(planForm); setIsPlanModalOpen(false); loadData(); };
  const handleSaveLog = async (e) => { e.preventDefault(); await addMaintLog(logForm); setIsLogModalOpen(false); loadData(); };
  const handleDeletePlan = async (id) => { if(confirm('Excluir?')) { await deleteMaintPlan(id); loadData(); } };
  const handleDeleteLog = async (id) => { if(confirm('Excluir?')) { await deleteMaintLog(id); loadData(); } };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="text-blue-600"/> Manutenção</h1>
        <div className="flex gap-2">
          {['dashboard','plans','logs'].map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab===t?'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300':'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{t==='dashboard'?'Visão Geral':t==='plans'?'Planos':'Histórico'}</button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-700 dark:text-white">Próximas Manutenções</h3><button onClick={()=>setIsLogModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-green-700"><CheckCircle size={14}/> Registrar</button></div>
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300"><thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-200 uppercase text-xs"><tr><th className="p-4">Veículo</th><th className="p-4">Serviço</th><th className="p-4">Vida Útil</th><th className="p-4">Restante</th><th className="p-4 text-center">Status</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{maintenanceStatus.map(item=>(<tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="p-4 font-bold text-slate-700 dark:text-white">{item.device}</td><td className="p-4">{item.plan}</td><td className="p-4 w-48"><div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${item.status==='ok'?'bg-green-500':item.status==='warning'?'bg-yellow-500':'bg-red-500'}`} style={{width: `${item.percent}%`}}/></div></td><td className="p-4 font-mono">{item.remaining} km</td><td className="p-4 text-center">{item.status==='overdue'?<span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">VENCIDO</span>:item.status==='warning'?<span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded text-xs font-bold">ATENÇÃO</span>:<span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">EM DIA</span>}</td></tr>))}</tbody></table>
        </div>
      )}

      {/* Outras abas (simplificadas para caber) */}
      {activeTab === 'plans' && <div className="grid grid-cols-3 gap-4"><button onClick={()=>setIsPlanModalOpen(true)} className="col-span-full bg-blue-600 text-white p-2 rounded text-center font-bold">Adicionar Plano</button>{plans.map(p=><div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded border dark:border-slate-700 shadow relative"><h4 className="font-bold dark:text-white">{p.name}</h4><p className="text-sm dark:text-slate-400">{p.intervalKm} km</p><button onClick={()=>handleDeletePlan(p.id)} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button></div>)}</div>}
      
      {/* MODAL PLANO */}
      {isPlanModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border dark:border-slate-700"><h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Novo Plano</h3><form onSubmit={handleSavePlan} className="space-y-3"><input required placeholder="Nome" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={planForm.name} onChange={e=>setPlanForm({...planForm,name:e.target.value})}/><input type="number" placeholder="Intervalo (KM)" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={planForm.intervalKm} onChange={e=>setPlanForm({...planForm,intervalKm:e.target.value})}/><div className="flex gap-2 pt-2"><button type="button" onClick={()=>setIsPlanModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Salvar</button></div></form></div></div>)}
      {/* MODAL LOG */}
      {isLogModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border dark:border-slate-700"><h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Registrar</h3><form onSubmit={handleSaveLog} className="space-y-3"><select className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={logForm.deviceId} onChange={e=>{setLogForm({...logForm,deviceId:e.target.value}); const cur=positions[e.target.value]?.attributes?.totalDistance; if(cur)setLogForm(p=>({...p,serviceKm:(cur/1000).toFixed(0)}))}}><option>Veículo...</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><select className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={logForm.planId} onChange={e=>setLogForm({...logForm,planId:e.target.value})}><option>Serviço...</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="date" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={logForm.serviceDate} onChange={e=>setLogForm({...logForm,serviceDate:e.target.value})}/><input type="number" placeholder="KM" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={logForm.serviceKm} onChange={e=>setLogForm({...logForm,serviceKm:e.target.value})}/><button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold">Salvar</button><button type="button" onClick={()=>setIsLogModalOpen(false)} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded mt-2">Cancelar</button></form></div></div>)}
    </div>
  );
}
