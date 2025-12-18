import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, addUser, updateUser, deleteUser, getProfiles, getDevices, getUserDevices, linkDeviceToUser, unlinkDeviceFromUser } from '../services/api';
import { Users, Plus, Trash2, Edit, Truck, Shield, X, Key, CheckCircle, Search, User, UserCheck } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import { toast } from 'react-hot-toast';

// --- COMPONENTES VISUAIS ---
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

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', administrator: false, profileId: '' });
  
  const [allDevices, setAllDevices] = useState([]);
  const [userDeviceIds, setUserDeviceIds] = useState([]);
  const [fleetSearch, setFleetSearch] = useState(''); // Busca no modal de frota
  const [userSearch, setUserSearch] = useState('');   // Busca na lista de usuários

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([getUsers(), getProfiles()]);
      setUsers(u); 
      setProfiles(p);
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      id: currentUser ? currentUser.id : undefined,
      name: formData.name,
      email: formData.email,
      administrator: formData.administrator,
      attributes: {
        ...(currentUser?.attributes || {}),
        profileId: formData.profileId
      }
    };

    if (formData.password && formData.password.trim() !== "") {
      payload.password = formData.password;
    }

    try {
      if(currentUser) await updateUser(currentUser.id, payload);
      else await addUser(payload);
      
      setIsModalOpen(false); 
      loadData();
      toast.success('Usuário salvo com sucesso!');
    } catch(e) { 
      const msg = e.response?.data?.message || e.message;
      toast.error('Erro: ' + msg); 
    }
  };

  const openFleetModal = async (user) => {
    setCurrentUser(user);
    setFleetSearch('');
    try {
      const [devs, ids] = await Promise.all([getDevices(), getUserDevices(user.id)]);
      setAllDevices(devs);
      setUserDeviceIds(ids.map(d => d.id));
      setIsFleetModalOpen(true);
    } catch(e) { toast.error('Erro ao buscar frota'); }
  };

  const toggleDevice = async (deviceId) => {
    const isLinked = userDeviceIds.includes(deviceId);
    try {
      if(isLinked) await unlinkDeviceFromUser(currentUser.id, deviceId);
      else await linkDeviceToUser(currentUser.id, deviceId);
      setUserDeviceIds(prev => isLinked ? prev.filter(id => id !== deviceId) : [...prev, deviceId]);
    } catch(e) { toast.error('Erro ao alterar vínculo.'); }
  };

  const openModal = (u=null) => {
    setCurrentUser(u);
    setFormData(u ? { 
      name: u.name, 
      email: u.email, 
      password: '', 
      administrator: u.administrator, 
      profileId: u.attributes?.profileId || '' 
    } : { 
      name: '', email: '', password: '', administrator: false, profileId: '' 
    });
    setIsModalOpen(true);
  };

  // Filtros
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredDevices = allDevices.filter(d => 
    d.name.toLowerCase().includes(fleetSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600"/> Usuários do Sistema
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie acessos e permissões.</p>
        </div>
        <button onClick={()=>openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95">
          <Plus size={18}/> Novo Usuário
        </button>
      </div>

      <div className="flex gap-4">
        <StatCard title="Total de Usuários" value={users.length} icon={Users} colorClass="bg-blue-600" />
        <StatCard title="Administradores" value={users.filter(u=>u.administrator).length} icon={Shield} colorClass="bg-purple-600" />
      </div>
      
      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="Buscar usuário..." 
              value={userSearch} 
              onChange={e=>setUserSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? <div className="p-8"><TableSkeleton cols={4}/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">
                <tr><th className="p-4">Usuário</th><th className="p-4">Email</th><th className="p-4">Perfil</th><th className="p-4 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 text-lg uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      {u.administrator ? 
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-800"><Shield size={12}/> Admin</span> : 
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-600"><User size={12}/> {profiles.find(p=>String(p.id)===String(u.attributes?.profileId))?.name || 'Padrão'}</span>
                      }
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={()=>openFleetModal(u)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg flex items-center gap-1 text-xs font-bold border border-transparent hover:border-blue-200 transition-colors" title="Gerenciar Frota"><Truck size={16}/></button>
                      <button onClick={()=>openModal(u)} className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18}/></button>
                      <button onClick={async ()=>{if(confirm('Excluir usuário?')) {await deleteUser(u.id); loadData()}}} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><UserCheck className="text-blue-600"/> {currentUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={()=>setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome Completo</label>
                <input required className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">E-mail de Acesso</label>
                <input required type="email" className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Senha {currentUser && '(Deixe em branco para manter)'}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                  <input type="password" className="w-full pl-10 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Perfil de Permissões</label>
                <select className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.profileId} onChange={e=>setFormData({...formData, profileId:e.target.value})}>
                  <option value="">-- Selecione --</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" onClick={()=>setFormData({...formData, administrator:!formData.administrator})}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.administrator ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-300'}`}>
                  {formData.administrator && <CheckCircle size={14} className="text-white"/>}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Administrador Total</span>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 mt-2">Salvar Usuário</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FROTA */}
      {isFleetModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-0 rounded-2xl w-full max-w-lg shadow-2xl border dark:border-slate-700 h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Vincular Frota</h3>
                <p className="text-xs text-slate-500">Usuário: {currentUser?.name}</p>
              </div>
              <button onClick={()=>setIsFleetModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
                <input 
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="Buscar veículo..." 
                  value={fleetSearch} 
                  onChange={e=>setFleetSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50 dark:bg-slate-900/30">
              {filteredDevices.map(d => {
                const isLinked = userDeviceIds.includes(d.id);
                return (
                  <div key={d.id} onClick={()=>toggleDevice(d.id)} className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${isLinked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-3">
                      <Truck size={18} className={isLinked ? 'text-blue-600' : 'text-slate-400'}/>
                      <span className={`font-bold text-sm ${isLinked?'text-blue-700 dark:text-blue-400':'text-slate-600 dark:text-slate-400'}`}>{d.name}</span>
                    </div>
                    {isLinked && <CheckCircle size={18} className="text-blue-600"/>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
