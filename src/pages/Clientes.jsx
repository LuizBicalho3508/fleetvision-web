import React, { useState, useEffect, useMemo } from 'react';
import { asaasListCustomers, asaasCreateCustomer, asaasGetPayments, saveStorage } from '../services/api';
import { Users, Plus, CreditCard, Search, RefreshCw, FileText, CheckCircle, AlertTriangle, ExternalLink, Calendar, X, Filter, ChevronLeft, ChevronRight, Ban } from 'lucide-react';

const StatCard = ({ title, value, color, icon: Icon, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${active ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900 ' + color.replace('text', 'ring').replace('500','500').replace('600','500') : 'border-slate-200 dark:border-slate-700'}`}
  >
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-full text-white shadow-md opacity-90 ${color.replace('text-', 'bg-')}`}>
        <Icon size={20} />
      </div>
    </div>
    {active && <div className={`absolute bottom-0 left-0 w-full h-1 ${color.replace('text-', 'bg-')}`}/>}
  </div>
);

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [overdueIds, setOverdueIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPayments, setClientPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [formData, setFormData] = useState({ name: '', cpfCnpj: '', email: '', mobilePhone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const resClients = await asaasListCustomers();
      const resOverdue = await asaasGetPayments('ALL', { status: 'OVERDUE', limit: 100 }).catch(() => ({ data: [] }));
      const debtors = new Set();
      if(resOverdue && resOverdue.data) resOverdue.data.forEach(p => debtors.add(p.customer));

      if (resClients && resClients.data) {
        setClients(resClients.data);
        setOverdueIds(debtors);
        saveStorage('clients', resClients.data.map(c => ({ id: c.id, name: c.name })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchText = (c.name||'').toLowerCase().includes(searchTerm.toLowerCase()) || (c.cpfCnpj||'').includes(searchTerm) || (c.email||'').includes(searchTerm);
      if(!matchText) return false;
      const isOverdue = overdueIds.has(c.id);
      if (filterType === 'OVERDUE') return isOverdue;
      if (filterType === 'UP_TO_DATE') return !isOverdue;
      return true;
    });
  }, [clients, searchTerm, filterType, overdueIds]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const stats = useMemo(() => { const total = clients.length; const overdue = clients.filter(c => overdueIds.has(c.id)).length; return { total, overdue, upToDate: total - overdue }; }, [clients, overdueIds]);

  const handleOpenFinance = async (client) => {
    setSelectedClient(client); setIsFinanceModalOpen(true); setLoadingPayments(true); setClientPayments([]);
    try { const res = await asaasGetPayments(client.id); if (res && res.data) setClientPayments(res.data); } catch (e) { alert('Erro ao buscar faturas.'); } finally { setLoadingPayments(false); }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await asaasCreateCustomer(formData); alert('Criado!'); setIsClientModalOpen(false); loadData(); } catch(e) { alert('Erro.'); } finally { setSaving(false); }
  };

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { label: 'Pendente', bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'RECEIVED': { label: 'Pago', bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'OVERDUE': { label: 'Vencido', bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      'CONFIRMED': { label: 'Confirmado', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    };
    const s = map[status] || { label: status, bg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
    return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.bg}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Clientes</h1>
        <button onClick={()=>setIsClientModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 hover:bg-blue-700 shadow"><Plus size={18}/> Novo Cliente</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total de Clientes" value={stats.total} icon={Users} color="text-blue-500" active={filterType === 'ALL'} onClick={() => { setFilterType('ALL'); setCurrentPage(1); }} />
        <StatCard title="Faturamento em Dia" value={stats.upToDate} icon={CheckCircle} color="text-green-500" active={filterType === 'UP_TO_DATE'} onClick={() => { setFilterType('UP_TO_DATE'); setCurrentPage(1); }} />
        <StatCard title="Inadimplentes" value={stats.overdue} icon={AlertTriangle} color="text-red-500" active={filterType === 'OVERDUE'} onClick={() => { setFilterType('OVERDUE'); setCurrentPage(1); }} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="relative w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}/></div>
          <button onClick={loadData} className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all"><RefreshCw size={18} className={loading?"animate-spin":""}/></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-200 uppercase text-xs font-bold">
              <tr><th className="px-6 py-4">Cliente / Contato</th><th className="px-6 py-4">Documento</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-center">Financeiro</th><th className="px-6 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedClients.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4"><div className="font-bold text-slate-800 dark:text-white">{c.name||'Sem Nome'}</div><div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.email||'-'}</div></td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{c.cpfCnpj||'-'}</td>
                  <td className="px-6 py-4 text-center">{!c.deleted ? <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-200 dark:border-green-800">ATIVO</span> : <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">INATIVO</span>}</td>
                  <td className="px-6 py-4 text-center">{overdueIds.has(c.id) ? <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-200 dark:border-red-800 flex items-center justify-center gap-1 w-fit mx-auto"><AlertTriangle size={12}/> VENCIDO</span> : <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 w-fit mx-auto"><CheckCircle size={12}/> EM DIA</span>}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => handleOpenFinance(c)} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 transition-colors text-xs font-bold flex items-center gap-2 ml-auto"><FileText size={14}/> Faturas</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">Mostrando {paginatedClients.length} de {filteredClients.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"><ChevronLeft size={16}/></button>
            <span className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-white">Página {currentPage}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      {isFinanceModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-3xl shadow-2xl h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-4">
              <div><h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2"><CreditCard className="text-blue-600"/> Financeiro: {selectedClient.name}</h3></div>
              <button onClick={()=>setIsFinanceModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400"><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {loadingPayments ? <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2"><RefreshCw className="animate-spin" size={32}/><p>Buscando...</p></div> : 
               <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                  <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0 shadow-sm text-xs uppercase"><tr><th className="p-3">Vencimento</th><th className="p-3">Valor</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {clientPayments.map(pay => (
                      <tr key={pay.id} className="bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{new Date(pay.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-white">R$ {pay.value.toFixed(2)}</td>
                        <td className="p-3 text-center">{getStatusBadge(pay.status)}</td>
                        <td className="p-3 text-center"><a href={pay.bankSlipUrl || pay.invoiceUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold inline-flex items-center gap-2 hover:bg-blue-700 shadow-sm"><ExternalLink size={12}/> Visualizar</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Novo Cliente</h3>
            <form onSubmit={handleSaveClient} className="space-y-3">
              <input required placeholder="Nome" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
              <input required placeholder="CPF/CNPJ" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.cpfCnpj} onChange={e=>setFormData({...formData, cpfCnpj:e.target.value})} />
              <input required placeholder="Email" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
              <div className="flex gap-2 mt-4"><button type="button" onClick={()=>setIsClientModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2 rounded text-slate-600 dark:text-slate-300">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
