import React, { useState, useEffect } from 'react';
import { saveStorage, getStorage, uploadFile } from '../services/api';
import { 
  Settings, Save, Image, Palette, Globe, CreditCard, 
  UploadCloud, CheckCircle, Server, Shield 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfig } from '../context/ConfigContext';

// Componente de Input Estilizado
const InputGroup = ({ label, subtext, children }) => (
  <div className="mb-6">
    <label className="block text-sm font-bold text-slate-700 dark:text-white mb-1">{label}</label>
    {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{subtext}</p>}
    {children}
  </div>
);

export default function Config() {
  const { setConfig: setGlobalConfig } = useConfig();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    appName: 'FleetVision',
    logo: '',
    primaryColor: '#3b82f6',
    sidebarBg: '#1e293b',
    traccarUrl: 'http://localhost:8082',
    traccarToken: '',
    asaasToken: '',
    asaasSandbox: false
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await getStorage('config');
      if (res && res.system) {
        setFormData(prev => ({ ...prev, ...res.system }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Salva no banco
      await saveStorage('config', { system: formData });
      
      // Atualiza contexto global para refletir mudanças (ex: logo/cor) instantaneamente
      setGlobalConfig(formData);
      
      toast.success('Configurações salvas com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await uploadFile(data);
      // O servidor retorna { url: '/storage/uploads/nome-do-arquivo.png' }
      // Salvamos apenas o nome do arquivo para manter consistência com o Sidebar.jsx
      const fileName = res.url.split('/').pop();
      setFormData({ ...formData, logo: fileName });
      toast.success('Logo enviada!');
    } catch (err) {
      toast.error('Erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'integrations', label: 'Integrações', icon: Server },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="text-blue-600"/> Configurações do Sistema
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie as preferências globais da plataforma</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={20}/>}
          Salvar Alterações
        </button>
      </div>

      {/* Navegação por Abas */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon size={16}/>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Conteúdo Principal */}
        <div className="md:col-span-2 space-y-6">
          
          {/* ABA GERAL */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Globe size={20} className="text-blue-500"/> Informações Básicas
              </h3>
              
              <InputGroup label="Nome da Aplicação" subtext="Este nome aparecerá no título do navegador e na sidebar.">
                <input 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  value={formData.appName}
                  onChange={e => setFormData({...formData, appName: e.target.value})}
                />
              </InputGroup>

              <InputGroup label="Logotipo do Sistema" subtext="Recomendado: PNG Transparente (200x50px)">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative group">
                    {formData.logo ? (
                      <img 
                        src={formData.logo.startsWith('http') ? formData.logo : `/storage/uploads/${formData.logo}`} 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => e.target.src = 'https://placehold.co/100x100?text=Logo'}
                      />
                    ) : (
                      <Image className="text-slate-400" size={32}/>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="text-white"/>
                    </div>
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 transition-colors"
                    >
                      {uploading ? 'Enviando...' : 'Escolher Nova Logo'}
                    </label>
                    <p className="text-xs text-slate-400 mt-2">Formatos: PNG, JPG, SVG. Máx: 2MB.</p>
                  </div>
                </div>
              </InputGroup>
            </div>
          )}

          {/* ABA APARÊNCIA */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Palette size={20} className="text-purple-500"/> Personalização Visual
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Cor Primária" subtext="Cor dos botões e destaques.">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                      value={formData.primaryColor}
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                    />
                    <span className="font-mono text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">{formData.primaryColor}</span>
                  </div>
                </InputGroup>

                <InputGroup label="Fundo da Sidebar" subtext="Cor de fundo do menu lateral.">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                      value={formData.sidebarBg}
                      onChange={e => setFormData({...formData, sidebarBg: e.target.value})}
                    />
                    <span className="font-mono text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">{formData.sidebarBg}</span>
                  </div>
                </InputGroup>
              </div>
            </div>
          )}

          {/* ABA INTEGRAÇÕES */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* TRACCAR */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Server size={20} className="text-orange-500"/> Conexão Traccar
                </h3>
                
                <InputGroup label="URL do Servidor Traccar" subtext="Endereço da API do Traccar (ex: http://localhost:8082).">
                  <input 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors dark:text-white font-mono text-sm"
                    value={formData.traccarUrl}
                    onChange={e => setFormData({...formData, traccarUrl: e.target.value})}
                  />
                </InputGroup>

                <InputGroup label="Token de Acesso (Opcional)" subtext="Se o Traccar exigir autenticação por token.">
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 text-slate-400" size={18}/>
                    <input 
                      type="password"
                      className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors dark:text-white font-mono text-sm"
                      value={formData.traccarToken}
                      onChange={e => setFormData({...formData, traccarToken: e.target.value})}
                      placeholder="••••••••••••"
                    />
                  </div>
                </InputGroup>
              </div>

              {/* ASAAS */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <CreditCard size={20} className="text-blue-500"/> Gateway de Pagamento (Asaas)
                </h3>

                <InputGroup label="API Key (Token)" subtext="Chave de API gerada no painel do Asaas.">
                  <input 
                    type="password"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors dark:text-white font-mono text-sm"
                    value={formData.asaasToken}
                    onChange={e => setFormData({...formData, asaasToken: e.target.value})}
                    placeholder="••••••••••••"
                  />
                </InputGroup>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-white block">Modo Sandbox</span>
                    <span className="text-xs text-slate-500">Ative para realizar testes sem cobrança real.</span>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, asaasSandbox: !formData.asaasSandbox})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.asaasSandbox ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.asaasSandbox ? 'left-7' : 'left-1'}`}/>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar de Ajuda / Resumo */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
            <h4 className="font-bold text-lg mb-2">Precisa de Ajuda?</h4>
            <p className="text-sm text-blue-100 mb-4 leading-relaxed">
              Configure as integrações corretamente para garantir que o rastreamento e as cobranças funcionem.
            </p>
            <div className="text-xs bg-white/10 p-3 rounded-lg border border-white/20">
              <p className="font-bold mb-1">Versão do Sistema</p>
              <p>v2.5.0 (Build 99)</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-700 dark:text-white mb-4">Status das Conexões</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={16} className="text-green-500"/>
                <span className="text-slate-600 dark:text-slate-300">Banco de Dados Local</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${formData.traccarUrl ? 'bg-green-500' : 'bg-red-500'}`}/>
                <span className="text-slate-600 dark:text-slate-300">Traccar API</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${formData.asaasToken ? 'bg-green-500' : 'bg-slate-300'}`}/>
                <span className="text-slate-600 dark:text-slate-300">Asaas Gateway</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
