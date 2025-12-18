import React, { useState, useEffect } from 'react';
import { 
  getChecklists, saveChecklist, getChecklistTemplates, saveChecklistTemplate, 
  getDevices, getDrivers 
} from '../services/api';
import { 
  ClipboardCheck, AlertTriangle, CheckCircle, Search, 
  Plus, Trash2, Truck, Car, Bike 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Checklist() {
  const [activeTab, setActiveTab] = useState('management');
  const [checklists, setChecklists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [devices, setDevices] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('car');
  const [newTemplateItem, setNewTemplateItem] = useState('');
  const [validatingChecklist, setValidatingChecklist] = useState(null);
  const [validationNote, setValidationNote] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [chk, tpl, dev, drv] = await Promise.all([
        getChecklists(), getChecklistTemplates(), getDevices(), getDrivers()
      ]);
      setChecklists(chk || []);
      setTemplates(tpl && tpl.length > 0 ? tpl : [
        { category: 'car', items: ['Nível de Óleo', 'Pneus', 'Freios', 'Luzes', 'Lataria'] },
        { category: 'truck', items: ['Freios a Ar', 'Pneus', 'Luzes', 'Óleo Motor', 'Estepe', 'Tacógrafo'] },
        { category: 'motorcycle', items: ['Corrente', 'Pneus', 'Freios', 'Capacete', 'Luzes'] }
      ]);
      setDevices(dev || []);
      setDrivers(drv || []);
    } catch (e) { console.error(e); }
  };

  const handleAddItem = async () => {
    if (!newTemplateItem) return;
    const updated = [...templates];
    const idx = updated.findIndex(t => t.category === selectedCategory);
    if (idx >= 0) updated[idx].items.push(newTemplateItem);
    else updated.push({ category: selectedCategory, items: [newTemplateItem] });
    await saveChecklistTemplate(updated);
    setTemplates(updated);
    setNewTemplateItem('');
    toast.success('Item adicionado!');
  };

  const handleRemoveItem = async (cat, idx) => {
    const updated = [...templates];
    const catIdx = updated.findIndex(t => t.category === cat);
    if (catIdx >= 0) {
      updated[catIdx].items.splice(idx, 1);
      await saveChecklistTemplate(updated);
      setTemplates(updated);
      toast.success('Item removido!');
    }
  };

  const handleValidate = async (status) => {
    if (!validatingChecklist) return;
    const updated = { ...validatingChecklist, status, validationDate: new Date().toISOString(), validationNote };
    const newList = checklists.map(c => c.id === validatingChecklist.id ? updated : c);
    await saveChecklist(newList);
    setChecklists(newList);
    setValidatingChecklist(null);
    setValidationNote('');
    toast.success(`Checklist ${status === 'approved' ? 'Aprovado' : 'Rejeitado'}!`);
  };

  const filtered = checklists.filter(c => {
    const dev = devices.find(d => d.id === c.deviceId)?.name || '';
    const drv = drivers.find(d => d.id === c.driverId)?.name || '';
    const match = dev.toLowerCase().includes(filter.toLowerCase()) || drv.toLowerCase().includes(filter.toLowerCase());
    return match && (onlyIssues ? (c.hasIssues && c.status === 'pending') : true);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><ClipboardCheck className="text-blue-600"/> Gestão de Checklist</h1>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button onClick={() => setActiveTab('management')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'management' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>Gestão</button>
          <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'templates' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>Configuração</button>
        </div>
      </div>

      {activeTab === 'management' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none" placeholder="Buscar..." value={filter} onChange={e => setFilter(e.target.value)}/></div>
            <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={onlyIssues} onChange={e => setOnlyIssues(e.target.checked)}/><span className="text-sm font-bold text-slate-600 dark:text-slate-300">Apenas Inconformidades</span></label>
          </div>
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-xs uppercase"><tr><th className="p-4">Data</th><th className="p-4">Veículo</th><th className="p-4">Motorista</th><th className="p-4">Status</th><th className="p-4 text-center">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nenhum checklist.</td></tr> : filtered.map(c => {
                const dev = devices.find(d => d.id === c.deviceId); const drv = drivers.find(d => d.id === c.driverId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">{new Date(c.date).toLocaleString()}</td>
                    <td className="p-4 font-bold">{dev ? dev.name : '-'}</td>
                    <td className="p-4">{drv ? drv.name : '-'}</td>
                    <td className="p-4">{c.status==='pending'?<span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pendente</span>:c.status==='approved'?<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Aprovado</span>:<span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Reprovado</span>} {c.hasIssues && <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">!</span>}</td>
                    <td className="p-4 text-center"><button onClick={() => setValidatingChecklist(c)} className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-xs font-bold">Ver Detalhes</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['car', 'truck', 'motorcycle'].map(cat => {
            const template = templates.find(t => t.category === cat) || { items: [] };
            const icon = cat === 'car' ? <Car/> : cat === 'truck' ? <Truck/> : <Bike/>;
            return (
              <div key={cat} className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700 dark:text-white">{icon} {cat==='car'?'Carros':cat==='truck'?'Caminhões':'Motos'}</h3>
                <div className="space-y-2 mb-4">{template.items.map((item, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded border dark:border-slate-600"><span className="text-sm dark:text-slate-200">{item}</span><button onClick={() => handleRemoveItem(cat, idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></div>))}</div>
                {selectedCategory === cat ? <div className="flex gap-2"><input className="flex-1 border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-900 dark:text-white" placeholder="Novo item..." value={newTemplateItem} onChange={e => setNewTemplateItem(e.target.value)}/><button onClick={handleAddItem} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={18}/></button></div> : <button onClick={() => setSelectedCategory(cat)} className="w-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">Adicionar Item</button>}
              </div>
            );
          })}
        </div>
      )}

      {validatingChecklist && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-lg shadow-2xl border dark:border-slate-700">
            <h3 className="font-bold text-xl mb-4 text-slate-800 dark:text-white">Validar Checklist</h3>
            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {validatingChecklist.items.filter(i => !i.ok).map((item, idx) => (<div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-3"><AlertTriangle className="text-red-600 shrink-0" size={20}/><div><p className="font-bold text-red-700 dark:text-red-300">{item.name}</p><p className="text-sm text-red-600 dark:text-red-400">{item.obs || 'Sem observação.'}</p></div></div>))}
              <div className="text-xs text-slate-500">Outros {validatingChecklist.items.filter(i => i.ok).length} itens verificados e OK.</div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Observação</label><textarea className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white h-24 mt-1" placeholder="Obs..." value={validationNote} onChange={e => setValidationNote(e.target.value)}></textarea></div>
            </div>
            <div className="grid grid-cols-2 gap-3"><button onClick={() => handleValidate('rejected')} className="bg-red-100 text-red-700 py-3 rounded-lg font-bold hover:bg-red-200">Bloquear</button><button onClick={() => handleValidate('approved')} className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex justify-center items-center gap-2"><CheckCircle size={18}/> Liberar Veículo</button></div>
            <button onClick={() => setValidatingChecklist(null)} className="w-full mt-3 text-slate-500 text-sm hover:underline">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
