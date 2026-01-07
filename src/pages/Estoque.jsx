import React, { useState, useEffect } from 'react';
import { getTrackerStock, addTrackerStock, updateTrackerStock, deleteTrackerStock } from '../services/api';
import { 
  Box, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, 
  Smartphone, Cpu, Hash, Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Estoque() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({ id: null, imei: '', model: '', sim: '', operator: '', notes: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await getTrackerStock();
      setItems(data || []);
    } catch (e) { toast.error('Erro ao carregar estoque'); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateTrackerStock(formData.id, formData);
        toast.success('Atualizado!');
      } else {
        await addTrackerStock(formData);
        toast.success('Cadastrado!');
      }
      setShowModal(false);
      loadData();
    } catch (err) { toast.error('Erro ao salvar.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este rastreador do estoque?')) return;
    try {
      await deleteTrackerStock(id);
      toast.success('Excluído!');
      loadData();
    } catch (e) { toast.error('Erro ao excluir'); }
  };

  const openModal = (item = null) => {
    if (item) setFormData(item);
    else setFormData({ id: null, imei: '', model: '', sim: '', operator: '', notes: '' });
    setShowModal(true);
  };

  const filteredItems = items.filter(i => 
    i.imei.includes(filter) || 
    i.model?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg text-white"><Box size={24}/></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Estoque de Rastreadores</h1>
            <p className="text-slate-500 text-sm">Gerencie seus equipamentos disponíveis</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
            <input 
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg w-full focus:ring-2 focus:ring-indigo-500" 
              placeholder="Buscar IMEI ou Modelo..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
            <Plus size={18}/> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? <p className="text-slate-500 col-span-full text-center py-10">Carregando estoque...</p> : 
         filteredItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all relative group">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                <Cpu size={20}/>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'used' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {item.status === 'used' ? 'EM USO' : 'DISPONÍVEL'}
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{item.model || 'Genérico'}</h3>
            <div className="space-y-1 text-sm text-slate-500 mb-4">
              <div className="flex items-center gap-2"><Hash size={14}/> <span className="font-mono">{item.imei}</span></div>
              <div className="flex items-center gap-2"><Smartphone size={14}/> {item.sim || 'S/ Chip'} ({item.operator || '-'})</div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
              <button onClick={() => openModal(item)} className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 text-xs font-bold flex justify-center items-center gap-1">
                <Edit2 size={14}/> Editar
              </button>
              <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{formData.id ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IMEI (Identificador)</label>
                <input required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono" value={formData.imei} onChange={e => setFormData({...formData, imei: e.target.value})} placeholder="Ex: 864321..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                  <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Ex: J-R12" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operadora</label>
                  <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={formData.operator} onChange={e => setFormData({...formData, operator: e.target.value})} placeholder="Ex: M2M Vivo" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do Chip (MSISDN)</label>
                <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={formData.sim} onChange={e => setFormData({...formData, sim: e.target.value})} placeholder="Ex: 1199999..." />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
