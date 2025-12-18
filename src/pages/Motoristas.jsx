import React, { useState, useEffect, useMemo } from 'react';
import { getDrivers, addDriver, updateDriver, deleteDriver, getStorage } from '../services/api'; 
import { Users, Plus, Trash2, Edit, Save, Briefcase, Search, CheckSquare, Square } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import SortHeader from '../components/SortHeader';

export default function Motoristas() {
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: '', uniqueId: '', clientId: '' });
  
  // Smart Table
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try { const [d, c] = await Promise.all([ getDrivers(), getStorage('clients') ]); setDrivers(d); setClients(c); } catch(e) {} finally { setLoading(false); }
  };

  const handleSave = async (e) => { e.preventDefault(); const attributes = { clientId: formData.clientId }; try { if(currentId) await updateDriver(currentId, { ...formData, attributes }); else await addDriver({ ...formData, attributes }); setIsModalOpen(false); loadData(); } catch(e) { alert('Erro'); } };
  const openModal = (drv = null) => { setCurrentId(drv?.id); setFormData(drv ? { name: drv.name, uniqueId: drv.uniqueId, clientId: drv.attributes?.clientId || '' } : { name: '', uniqueId: '', clientId: '' }); setIsModalOpen(true); };
  
  const handleSort = (key) => { setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' }); };
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === processedData.length ? [] : processedData.map(d => d.id));
  const deleteSelected = async () => { if(confirm(`Excluir ${selectedIds.length} itens?`)) { await Promise.all(selectedIds.map(id => deleteDriver(id))); setSelectedIds([]); loadData(); } };

  const processedData = useMemo(() => {
    let data = [...drivers];
    if (filter) data = data.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()) || d.uniqueId.includes(filter));
    data.sort((a, b) => {
      const valA = a[sortConfig.key] || ''; const valB = b[sortConfig.key] || '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [drivers, filter, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Motoristas</h1><div className="flex gap-2">{selectedIds.length > 0 && <button onClick={deleteSelected} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2"><Trash2 size={18}/> Excluir ({selectedIds.length})</button>}<button onClick={()=>openModal()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex gap-2"><Plus size={18}/> Novo</button></div></div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"><div className="relative w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar..." value={filter} onChange={e=>setFilter(e.target.value)}/></div></div>
        
        {loading ? <div className="p-4"><TableSkeleton cols={4}/></div> : (
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-200">
              <tr><th className="p-4 w-10"><div onClick={toggleSelectAll} className="cursor-pointer">{selectedIds.length === processedData.length && processedData.length > 0 ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-400"/>}</div></th><SortHeader label="Nome" sortKey="name" currentSort={sortConfig} onSort={handleSort} /><SortHeader label="RFID/ID" sortKey="uniqueId" currentSort={sortConfig} onSort={handleSort} /><th className="p-4">Cliente</th><th className="p-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {processedData.map(d => {
                const clientName = clients.find(c => String(c.id) === String(d.attributes?.clientId))?.name || '-';
                return (
                  <tr key={d.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedIds.includes(d.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <td className="p-4"><div onClick={()=>toggleSelect(d.id)} className="cursor-pointer">{selectedIds.includes(d.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-300"/>}</div></td>
                    <td className="p-4 font-bold text-slate-800 dark:text-white">{d.name}</td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{d.uniqueId}</td>
                    <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs flex w-fit items-center gap-1"><Briefcase size={12}/> {clientName}</span></td>
                    <td className="p-4 text-right"><button onClick={()=>openModal(d)} className="text-blue-600 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit size={16}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {isModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700"><h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">{currentId?'Editar':'Novo'} Motorista</h3><form onSubmit={handleSave} className="space-y-3"><input required placeholder="Nome" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/><input required placeholder="RFID" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.uniqueId} onChange={e=>setFormData({...formData,uniqueId:e.target.value})}/><div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Vincular a Cliente</label><select className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.clientId} onChange={e=>setFormData({...formData,clientId:e.target.value})}><option value="">-- Nenhum --</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="flex gap-2 mt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2 rounded text-slate-600 dark:text-slate-300">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Salvar</button></div></form></div></div>)}
    </div>
  );
}
