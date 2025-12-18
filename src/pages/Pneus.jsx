import React, { useState, useEffect } from 'react';
import { getDevices, getStorage, saveStorage } from '../services/api';
import { CircleDot, Plus, Trash2, Edit, Save, Truck, Activity } from 'lucide-react';

export default function Pneus() {
  const [tires, setTires] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, code: '', brand: '', model: '', size: '', status: 'Novo', deviceId: '', kmInstalled: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [d, t] = await Promise.all([getDevices(), getStorage('tires')]);
      setDevices(d); setTires(t || []);
    } catch(e){}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newTire = { ...formData, id: formData.id || Date.now() };
    const updated = formData.id ? tires.map(t => t.id===newTire.id ? newTire : t) : [...tires, newTire];
    await saveStorage('tires', updated);
    setTires(updated); setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if(confirm('Excluir pneu?')) {
      const updated = tires.filter(t => t.id !== id);
      await saveStorage('tires', updated);
      setTires(updated);
    }
  };

  const openModal = (t=null) => {
    setFormData(t || { id: null, code: '', brand: '', model: '', size: '', status: 'Novo', deviceId: '', kmInstalled: 0 });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Pneus</h1><button onClick={()=>openModal()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex gap-2"><Plus size={18}/> Novo Pneu</button></div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase"><tr><th className="p-4">Código/Marca</th><th className="p-4">Medida</th><th className="p-4">Veículo</th><th className="p-4">Estado</th><th className="p-4 text-right">Ações</th></tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {tires.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="p-4 font-bold text-slate-800 dark:text-white">{t.code}<br/><span className="text-xs font-normal text-slate-500">{t.brand} {t.model}</span></td>
                <td className="p-4">{t.size}</td>
                <td className="p-4 flex items-center gap-2">{t.deviceId ? <><Truck size={14} className="text-blue-500"/> {devices.find(d=>d.id==t.deviceId)?.name || 'Desconhecido'}</> : <span className="text-slate-400">Em Estoque</span>}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${t.status==='Novo'?'bg-green-100 text-green-700':t.status==='Reformado'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{t.status}</span></td>
                <td className="p-4 text-right"><button onClick={()=>openModal(t)} className="text-blue-600 mr-2"><Edit size={16}/></button><button onClick={()=>handleDelete(t.id)} className="text-red-500"><Trash2 size={16}/></button></td>
              </tr>
            ))}
            {tires.length===0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nenhum pneu cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
      {isModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border dark:border-slate-700"><h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Cadastro de Pneu</h3><form onSubmit={handleSave} className="space-y-3"><input required placeholder="Código de Fogo/Série" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={formData.code} onChange={e=>setFormData({...formData,code:e.target.value})}/><div className="grid grid-cols-2 gap-2"><input placeholder="Marca" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={formData.brand} onChange={e=>setFormData({...formData,brand:e.target.value})}/><input placeholder="Modelo" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={formData.model} onChange={e=>setFormData({...formData,model:e.target.value})}/></div><input placeholder="Medida (Ex: 295/80 R22.5)" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={formData.size} onChange={e=>setFormData({...formData,size:e.target.value})}/><select className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}><option>Novo</option><option>Reformado</option><option>Descarte</option></select><select className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 dark:text-white" value={formData.deviceId} onChange={e=>setFormData({...formData,deviceId:e.target.value})}><option value="">-- Em Estoque --</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><div className="flex gap-2 mt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2 rounded text-slate-600 dark:text-slate-300">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Salvar</button></div></form></div></div>)}
    </div>
  );
}
