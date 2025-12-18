import React, { useState, useEffect, useMemo } from 'react';
import { getDevices, addDevice, updateDevice, deleteDevice, getCustomIcons, addCustomIcon, deleteCustomIcon, uploadFile, getStorage } from '../services/api';
import { 
  Truck, Plus, Trash2, Edit, Search, CheckSquare, Square, Image, Upload, 
  User, Fuel, X, Save, Loader2, Car, Wifi, WifiOff, Fingerprint, Clock
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import SortHeader from '../components/SortHeader';
import { toast } from 'react-hot-toast';

// --- HELPERS ---
// Garante que a URL do ícone esteja correta (seja upload local ou link externo)
const getIconUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/uploads/${url}`;
};

const StatBadge = ({ label, value, color, icon: Icon }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 min-w-[150px]">
    <div className={`p-3 rounded-xl ${color} text-white shadow-md`}>
      <Icon size={20}/>
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function Frota() {
  const [devices, setDevices] = useState([]);
  const [icons, setIcons] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
  
  // Forms
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', uniqueId: '', model: '', plate: '', 
    customIconUrl: '', clientId: '', averageConsumption: '' 
  });
  const [saving, setSaving] = useState(false);

  // Table Utils
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { 
    setLoading(true);
    try { 
      const [devs, ics, clis] = await Promise.all([
        getDevices(), 
        getCustomIcons(),
        getStorage('clients')
      ]);
      setDevices(devs); 
      setIcons(ics || []);
      setClients(clis || []);
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleSave = async (e) => { 
    e.preventDefault(); 
    setSaving(true);
    try {
      const originalDevice = currentId ? devices.find(d => d.id === currentId) : {};
      const payload = {
        id: currentId,
        name: formData.name,
        uniqueId: formData.uniqueId,
        model: formData.model,
        contact: formData.plate,
        attributes: {
          ...(originalDevice?.attributes || {}),
          customIconUrl: formData.customIconUrl,
          clientId: formData.clientId,
          averageConsumption: formData.averageConsumption
        }
      };

      if(currentId) await updateDevice(currentId, payload);
      else await addDevice(payload); 

      setIsModalOpen(false); 
      loadData(); 
      toast.success('Veículo salvo com sucesso!');
    } catch(e) { 
      toast.error('Erro ao salvar: ' + (e.response?.data?.message || e.message)); 
    } finally { setSaving(false); }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadFile(fd);
      // Salva no banco de ícones customizados
      await addCustomIcon(file.name, res.url);
      const newIcons = await getCustomIcons();
      setIcons(newIcons || []);
      toast.success('Ícone enviado!');
    } catch (e) { toast.error('Erro no upload'); }
  };

  const handleDeleteIcon = async (id) => {
    if(confirm('Excluir este ícone?')) {
      await deleteCustomIcon(id);
      setIcons(prev => prev.filter(i => i.id !== id));
    }
  };

  const openModal = (d=null) => { 
    setCurrentId(d?.id); 
    setFormData(d ? { 
      name: d.name, 
      uniqueId: d.uniqueId, 
      model: d.model, 
      plate: d.contact,
      customIconUrl: d.attributes?.customIconUrl || '',
      clientId: d.attributes?.clientId || '',
      averageConsumption: d.attributes?.averageConsumption || ''
    } : { name:'', uniqueId:'', model:'', plate:'', customIconUrl:'', clientId:'', averageConsumption:'' }); 
    setIsModalOpen(true); 
  };
  
  const handleSort = (key) => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === processedData.length ? [] : processedData.map(d => d.id));
  const deleteSelected = async () => { 
    if(confirm(`Excluir ${selectedIds.length} veículos?`)) { 
      await Promise.all(selectedIds.map(id => deleteDevice(id))); 
      setSelectedIds([]); loadData(); toast.success('Veículos excluídos.');
    } 
  };

  const processedData = useMemo(() => {
    let data = [...devices];
    if (filter) data = data.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()) || d.uniqueId.includes(filter));
    data.sort((a, b) => {
      const valA = a[sortConfig.key] || ''; const valB = b[sortConfig.key] || '';
      return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    return data;
  }, [devices, filter, sortConfig]);

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length
  };

  return (
    // FIX SCROLL: Adicionado flex flex-col e h-[calc] com overflow-hidden no pai
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4 animate-in fade-in duration-500 overflow-hidden font-sans">
      
      {/* Header e KPIs (Não scrollam) */}
      <div className="shrink-0 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Truck className="text-blue-600"/> Gestão de Frota
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie seus veículos e rastreadores.</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={()=>setIsIconManagerOpen(true)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold flex gap-2 hover:bg-slate-50 transition-colors shadow-sm">
              <Image size={18}/> <span className="hidden sm:inline">Ícones</span>
            </button>
            <button onClick={()=>openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
              <Plus size={18}/> Novo Veículo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBadge label="Total de Veículos" value={stats.total} color="bg-blue-600" icon={Car}/>
          <StatBadge label="Online Agora" value={stats.online} color="bg-emerald-500" icon={Wifi}/>
          <StatBadge label="Offline / Sem Sinal" value={stats.offline} color="bg-red-500" icon={WifiOff}/>
        </div>
      </div>

      {/* Tabela Container (Scrollável) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="Buscar por nome, placa ou IMEI..." 
              value={filter} 
              onChange={e=>setFilter(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <button onClick={deleteSelected} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold flex gap-2 text-xs items-center hover:bg-red-100 transition-colors">
              <Trash2 size={14}/> Excluir ({selectedIds.length})
            </button>
          )}
        </div>
        
        {loading ? <div className="p-8"><TableSkeleton cols={6}/></div> : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-4 w-10"><div onClick={toggleSelectAll} className="cursor-pointer">{selectedIds.length===processedData.length&&processedData.length>0?<CheckSquare size={18} className="text-blue-600"/>:<Square size={18} className="text-slate-300"/>}</div></th>
                  <SortHeader label="Veículo" sortKey="name" currentSort={sortConfig} onSort={handleSort}/>
                  <SortHeader label="Identificação" sortKey="uniqueId" currentSort={sortConfig} onSort={handleSort}/>
                  <th className="p-4">Cliente</th>
                  <SortHeader label="Status & Última Conexão" sortKey="status" currentSort={sortConfig} onSort={handleSort}/>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {processedData.map(d => {
                  const clientName = clients.find(c => String(c.id) === String(d.attributes?.clientId))?.name || '-';
                  const iconUrl = getIconUrl(d.attributes?.customIconUrl);

                  return (
                    <tr key={d.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.includes(d.id)?'bg-blue-50/50 dark:bg-blue-900/10':''}`}>
                      <td className="p-4"><div onClick={()=>toggleSelect(d.id)} className="cursor-pointer">{selectedIds.includes(d.id)?<CheckSquare size={18} className="text-blue-600"/>:<Square size={18} className="text-slate-300"/>}</div></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shrink-0">
                            {/* FIX ÍCONE: Usa helper getIconUrl */}
                            {iconUrl ? <img src={iconUrl} className="w-6 h-6 object-contain" onError={(e)=>e.target.style.display='none'}/> : <Truck size={18} className="text-slate-400"/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{d.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{d.model || 'Genérico'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-500 flex items-center gap-1"><Fingerprint size={12}/> {d.uniqueId}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 bg-slate-100 dark:bg-slate-700 w-fit px-2 py-0.5 rounded">{d.contact || 'S/ Placa'}</span>
                        </div>
                      </td>
                      <td className="p-4"><div className="flex items-center gap-2"><User size={14} className="text-slate-400"/> {clientName}</div></td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border w-fit ${
                            d.status==='online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${d.status==='online'?'bg-green-600':'bg-red-600'}`}></span>
                            {d.status}
                          </span>
                          {/* FIX DATA: Adiciona data da última atualização */}
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={10}/> {d.lastUpdate ? new Date(d.lastUpdate).toLocaleString() : 'Nunca'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={()=>openModal(d)} className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EDITAR/CRIAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-0 rounded-2xl w-full max-w-2xl shadow-2xl border dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                {currentId ? <Edit size={20} className="text-blue-500"/> : <Plus size={20} className="text-blue-500"/>}
                {currentId ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              <button onClick={()=>setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Truck size={14}/> Identificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome</label><input required className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">IMEI</label><input required className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-mono" value={formData.uniqueId} onChange={e=>setFormData({...formData,uniqueId:e.target.value})}/></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Placa</label><input className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none uppercase" value={formData.plate} onChange={e=>setFormData({...formData,plate:e.target.value})}/></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Modelo</label><input className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none" value={formData.model} onChange={e=>setFormData({...formData,model:e.target.value})}/></div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><User size={14}/> Configuração</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
                    <select className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none" value={formData.clientId} onChange={e=>setFormData({...formData,clientId:e.target.value})}>
                      <option value="">-- Sem Vínculo --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Fuel size={12}/> Consumo (km/l)</label>
                    <input type="number" className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none" value={formData.averageConsumption} onChange={e=>setFormData({...formData,averageConsumption:e.target.value})}/>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Image size={14}/> Aparência</h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-32 overflow-y-auto p-1">
                  <div onClick={()=>setFormData({...formData, customIconUrl: ''})} className={`h-12 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${formData.customIconUrl==='' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'}`}><Truck size={20} className={formData.customIconUrl===''?'text-blue-500':'text-slate-400'}/></div>
                  {icons.map(ic => {
                    const icUrl = getIconUrl(ic.url);
                    return (
                      <div key={ic.id} onClick={()=>setFormData({...formData, customIconUrl: ic.url})} className={`h-12 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${formData.customIconUrl===ic.url ? 'border-blue-500 bg-blue-50' : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'}`}>
                        <img src={icUrl} className="h-8 w-8 object-contain"/>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                {saving ? 'Salvando...' : 'Salvar Veículo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÍCONES */}
      {isIconManagerOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl border dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Image className="text-blue-500"/> Gerenciar Ícones</h3>
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-500/30 border-dashed rounded-xl cursor-pointer bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-blue-500" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Clique para enviar nova imagem</p>
                </div>
                <input type="file" className="hidden" onChange={handleIconUpload} accept="image/*" />
              </label>
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
              {icons.map(ic => (
                <div key={ic.id} className="relative group border dark:border-slate-600 rounded-lg p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:border-blue-300 transition-colors">
                  <img src={getIconUrl(ic.url)} className="h-8 w-8 object-contain"/>
                  <button onClick={()=>handleDeleteIcon(ic.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110"><X size={10}/></button>
                </div>
              ))}
            </div>
            <button onClick={()=>setIsIconManagerOpen(false)} className="w-full mt-6 bg-slate-100 dark:bg-slate-700 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
