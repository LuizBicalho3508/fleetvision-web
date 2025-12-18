import React, { useState, useEffect, useMemo } from 'react';
import { getProfiles, addProfile, updateProfile, deleteProfile } from '../services/api';
import { Shield, Plus, Trash2, Edit, Save, X, CheckSquare, Square, Lock, Key, CheckCircle, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PERMISSION_GROUPS = [
  { title: "Monitoramento", color: "bg-blue-500", items: [{id:'dashboard',label:'Dashboard'},{id:'mapa',label:'Mapa'},{id:'alertas',label:'Alertas'}] },
  { title: "Relatórios", color: "bg-purple-500", items: [{id:'rel_central',label:'Central'},{id:'ranking',label:'Ranking'},{id:'replay',label:'Replay'}] },
  { title: "Operação", color: "bg-emerald-500", items: [{id:'jornada',label:'Jornada'},{id:'roteirizador',label:'Roteirizador'},{id:'rotas_gestao',label:'Gestão Rotas'},{id:'manutencao',label:'Manutenção'},{id:'checklist',label:'Checklist'},{id:'cercas',label:'Cercas'}] },
  { title: "Financeiro", color: "bg-amber-500", items: [{id:'financeiro',label:'Financeiro'},{id:'clientes',label:'Clientes'}] },
  { title: "Cadastros", color: "bg-orange-500", items: [{id:'frota',label:'Veículos'},{id:'motoristas',label:'Motoristas'},{id:'pneus',label:'Pneus'}] },
  { title: "Admin", color: "bg-slate-600", items: [{id:'usuarios',label:'Usuários'},{id:'perfis',label:'Perfis'},{id:'config',label:'Configuração'},{id:'admin',label:'VPS'}] }
];

// Componente de KPI
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 flex-1">
    <div className={`p-3 rounded-full ${colorClass} text-white shadow-md`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function Perfis() {
  const [profiles, setProfiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', permissions: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
  
  const loadData = async () => { 
    try { setProfiles(await getProfiles()); } catch (e) { console.error(e); } 
  };

  const handleOpenModal = (p = null) => { 
    setEditingId(p?.id || null); 
    setFormData(p ? { name: p.name, permissions: p.permissions || [] } : { name: '', permissions: [] }); 
    setIsModalOpen(true); 
  };

  const togglePermission = (id) => { 
    setFormData(prev => { 
      const exists = prev.permissions.includes(id); 
      return { ...prev, permissions: exists ? prev.permissions.filter(p => p !== id) : [...prev.permissions, id] }; 
    }); 
  };

  const toggleGroup = (items) => { 
    const ids = items.map(i => i.id); 
    const allSelected = ids.every(id => formData.permissions.includes(id)); 
    setFormData(prev => ({ 
      ...prev, 
      permissions: allSelected 
        ? prev.permissions.filter(p => !ids.includes(p)) 
        : [...new Set([...prev.permissions, ...ids])] 
    })); 
  };

  const handleSave = async (e) => { 
    e.preventDefault(); 
    setSaving(true);
    try { 
      if (editingId) await updateProfile(editingId, formData); 
      else await addProfile(formData); 
      
      setIsModalOpen(false); 
      loadData(); 
      toast.success('Perfil salvo com sucesso!');
    } catch (e) { 
      toast.error('Erro ao salvar perfil.'); 
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => { 
    if (confirm('Tem certeza que deseja excluir este perfil?')) { 
      await deleteProfile(id); 
      loadData(); 
      toast.success('Perfil excluído.');
    } 
  };

  // Helper para verificar quais grupos estão ativos num perfil
  const getActiveGroups = (permissions) => {
    return PERMISSION_GROUPS.map(group => {
      const count = group.items.filter(i => permissions.includes(i.id)).length;
      return { ...group, active: count > 0, count, total: group.items.length };
    });
  };

  const totalPermissions = PERMISSION_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="text-blue-600"/> Perfis de Acesso
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Defina o que cada usuário pode ver e fazer.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95">
          <Plus size={18}/> Novo Perfil
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <StatCard title="Perfis Criados" value={profiles.length} icon={LayoutGrid} colorClass="bg-blue-600" />
        <StatCard title="Permissões Totais" value={totalPermissions} icon={Key} colorClass="bg-emerald-500" />
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(p => {
          const activeGroups = getActiveGroups(p.permissions);
          return (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col group">
              
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Shield size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{p.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {p.permissions.length} de {totalPermissions} permissões
                    </p>
                  </div>
                </div>
              </div>

              {/* Groups Badges */}
              <div className="p-5 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Acesso aos Módulos</p>
                <div className="flex flex-wrap gap-2">
                  {activeGroups.map((g, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        g.active 
                          ? `${g.color.replace('bg-', 'bg-').replace('500', '50')} ${g.color.replace('bg-', 'text-').replace('500', '700')} ${g.color.replace('bg-', 'border-').replace('500', '200')}`
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700 opacity-50'
                      }`}
                    >
                      {g.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 rounded-b-xl">
                <button onClick={() => handleOpenModal(p)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors shadow-sm"><Edit size={18}/></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-colors shadow-sm"><Trash2 size={18}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] border dark:border-slate-700 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <Lock size={22} className="text-blue-600"/> {editingId ? 'Editar Perfil' : 'Novo Perfil'}
              </h3>
              <button onClick={()=>setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* Esquerda: Nome e Resumo */}
              <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Perfil</label>
                <input 
                  autoFocus 
                  required 
                  className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                  value={formData.name} 
                  onChange={e=>setFormData({...formData, name:e.target.value})} 
                  placeholder="Ex: Gerente de Frota"
                />
                
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Resumo de Acesso</h4>
                  <div className="space-y-3">
                    {PERMISSION_GROUPS.map((group, idx) => {
                      const count = group.items.filter(i => formData.permissions.includes(i.id)).length;
                      const isFull = count === group.items.length;
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{group.title}</span>
                          <span className={`font-bold ${count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300'}`}>
                            {count}/{group.items.length} {isFull && <CheckCircle size={14} className="inline ml-1 text-green-500"/>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Direita: Grid de Permissões */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {PERMISSION_GROUPS.map((group, idx) => {
                    const allSelected = group.items.every(i => formData.permissions.includes(i.id));
                    return (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div 
                          className="bg-slate-50 dark:bg-slate-700/50 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700" 
                          onClick={() => toggleGroup(group.items)}
                        >
                          <span className="font-bold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${group.color}`}></div> {group.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-blue-600 hover:underline">
                            {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                          </span>
                        </div>
                        <div className="p-2 space-y-1">
                          {group.items.map(item => { 
                            const isChecked = formData.permissions.includes(item.id); 
                            return (
                              <div 
                                key={item.id} 
                                onClick={() => togglePermission(item.id)} 
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all select-none ${isChecked ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                              >
                                {isChecked ? <CheckSquare size={18} className="text-blue-600 shrink-0"/> : <Square size={18} className="text-slate-300 shrink-0"/>}
                                <span className={`text-sm ${isChecked ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3 justify-end">
              <button onClick={()=>setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {saving ? 'Salvando...' : <><Save size={18}/> Salvar Perfil</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
