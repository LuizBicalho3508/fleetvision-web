import React, { useState, useEffect } from 'react';
import { getDevices, addDevice, updateDevice, deleteDevice, getTrackerStock, updateTrackerStock } from '../services/api';
import { 
  Truck, Plus, Search, Edit2, Trash2, MoreVertical, 
  MapPin, Calendar, Smartphone, Box
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Frota() {
  const [devices, setDevices] = useState([]);
  const [stock, setStock] = useState([]); // Lista de estoque
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  
  const [formData, setFormData] = useState({ name: '', uniqueId: '', phone: '', model: '', contact: '', category: 'car' });
  const [selectedStockId, setSelectedStockId] = useState(''); // ID do item do estoque selecionado

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [devs, stk] = await Promise.all([getDevices(), getTrackerStock()]);
      setDevices(devs);
      // Filtra estoque para mostrar apenas disponíveis + o atual se estiver editando
      setStock(stk || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleStockSelect = (stockId) => {
    setSelectedStockId(stockId);
    const item = stock.find(s => s.id == stockId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        uniqueId: item.imei,
        model: item.model,
        phone: item.sim,
        contact: item.operator
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateDevice(formData.id, formData);
        toast.success('Veículo atualizado!');
      } else {
        await addDevice(formData);
        // Se usou do estoque, marca como 'used'
        if (selectedStockId) {
          await updateTrackerStock(selectedStockId, { status: 'used' });
        }
        toast.success('Veículo cadastrado!');
      }
      setShowModal(false);
      loadData();
    } catch (err) { toast.error('Erro ao salvar. Verifique se o IMEI já existe.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este veículo?')) return;
    try {
      await deleteDevice(id);
      toast.success('Removido!');
      loadData();
    } catch (e) { toast.error('Erro ao remover'); }
  };

  const openModal = (device = null) => {
    if (device) {
      setFormData(device);
      setSelectedStockId(''); // Não vincula estoque na edição por enquanto
    } else {
      setFormData({ name: '', uniqueId: '', phone: '', model: '', contact: '', category: 'car' });
      setSelectedStockId('');
    }
    setShowModal(true);
  };

  const availableStock = stock.filter(s => s.status !== 'used');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg text-white"><Truck size={24}/></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Gestão de Frota</h1>
            <p className="text-slate-500 text-sm">Gerencie seus veículos e vincule rastreadores</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
            <Plus size={18}/> Novo Veículo
          </button>
        </div>
      </div>

      {/* LISTA DE VEÍCULOS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Veículo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Rastreador (IMEI)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Modelo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {devices.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <td className="p-4 font-bold text-slate-800 dark:text-white">{d.name}</td>
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-300 text-sm">{d.uniqueId}</td>
                  <td className="p-4 text-slate-500 text-sm">{d.model || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.status || 'Offline'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openModal(d)} className="p-2 hover:bg-blue-50 text-blue-600 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{formData.id ? 'Editar Veículo' : 'Novo Veículo'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* VINCULAR ESTOQUE (Só aparece na criação) */}
              {!formData.id && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                  <label className="block text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-2">
                    <Box size={14}/> Vincular Rastreador do Estoque
                  </label>
                  <select 
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg text-sm outline-none"
                    value={selectedStockId}
                    onChange={(e) => handleStockSelect(e.target.value)}
                  >
                    <option value="">-- Selecione ou Digite Manualmente --</option>
                    {availableStock.map(s => (
                      <option key={s.id} value={s.id}>{s.model} - {s.imei} ({s.operator})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Veículo / Placa</label>
                <input required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Fiat Uno - ABC1234" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Identificador (IMEI)</label>
                  <input required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" value={formData.uniqueId} onChange={e => setFormData({...formData, uniqueId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo Rastreador</label>
                  <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
