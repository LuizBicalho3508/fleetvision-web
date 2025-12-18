import React, { useState, useEffect } from 'react';
import { Save, Upload, Loader2, Image as ImageIcon, Palette, CreditCard, AlertTriangle, Monitor } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { saveStorage, uploadFile } from '../services/api';

export default function Configuracoes() {
  const { config, setConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setLocalConfig(config); }, [config]);

  const handleThemeChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, theme: { ...prev.theme, [key]: value } }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const formData = new FormData(); 
    formData.append('file', file); 
    formData.append('type', 'logo');
    try { 
      const res = await uploadFile(formData); 
      setLocalConfig(prev => ({ ...prev, logo: res.url })); 
      alert('Logo enviada! Clique em Salvar para aplicar.'); 
    } catch (err) { alert('Erro no upload.'); } 
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    try { 
      await saveStorage('config', localConfig); 
      setConfig(localConfig); 
      alert('Configurações salvas!');
      window.location.reload(); 
    } catch (e) { alert('Erro ao salvar.'); }
  };

  const previewUrl = localConfig.logo;
  const t = localConfig.theme || {};

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Personalização do Sistema</h1>
        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex gap-2 hover:bg-blue-700 shadow">
          <Save size={20}/> Salvar e Aplicar
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IDENTIDADE VISUAL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2 mb-4"><ImageIcon size={20} className="text-blue-500"/> Identidade Visual</h3>
          
          <div className="space-y-4">
            {/* CAMPO RESTAURADO */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Sistema</label>
              <input 
                className="w-full border-2 border-slate-200 p-2.5 rounded-lg focus:border-blue-500 outline-none" 
                value={localConfig.appName || ''} 
                onChange={e=>setLocalConfig({...localConfig, appName: e.target.value})} 
                placeholder="Ex: Minha Frota"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border rounded flex items-center justify-center bg-slate-100 p-2">
                  {previewUrl ? <img src={previewUrl} className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-slate-400">Sem Logo</span>}
                </div>
                <label className="bg-slate-800 text-white px-4 py-2 rounded cursor-pointer text-sm flex items-center gap-2 hover:bg-slate-900">
                  {uploading ? <Loader2 className="animate-spin"/> : <Upload size={16}/>} Trocar Logo
                  <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ASAAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2 mb-4"><CreditCard size={20} className="text-blue-500"/> Integração Asaas</h3>
          <div>
            <label className="block text-sm font-bold mb-1">API Key</label>
            <input type="password" className="w-full border p-2.5 rounded bg-slate-50 font-mono text-sm border-slate-200" 
              value={localConfig.asaasToken || ''} 
              onChange={e=>setLocalConfig({...localConfig, asaasToken: e.target.value})} 
              placeholder="$aact_..."
            />
            <label className="flex items-center gap-2 mt-3 text-sm text-slate-700 cursor-pointer bg-slate-50 p-2 rounded border border-slate-100">
               <input type="checkbox" checked={localConfig.asaasSandbox || false} onChange={e=>setLocalConfig({...localConfig, asaasSandbox: e.target.checked})} className="w-4 h-4 text-blue-600"/>
               <span>Modo Sandbox (Ambiente de Teste)</span>
            </label>
            <p className="text-xs text-slate-400 mt-2">Desmarque o Sandbox se estiver usando uma chave de produção.</p>
          </div>
        </div>

        {/* CORES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2 mb-4"><Palette size={20} className="text-blue-500"/> Cores do Tema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorPicker label="Cor Primária (Destaques)" value={t.primary} onChange={v => handleThemeChange('primary', v)} />
            <ColorPicker label="Cor Secundária (Fundo Login)" value={t.secondary} onChange={v => handleThemeChange('secondary', v)} />
            <ColorPicker label="Cor de Fundo (Páginas)" value={t.background} onChange={v => handleThemeChange('background', v)} />
            <ColorPicker label="Cor dos Cards (Papel)" value={t.paper} onChange={v => handleThemeChange('paper', v)} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2 mb-4"><Monitor size={20} className="text-blue-500"/> Barra Lateral (Sidebar)</h3>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Fundo da Sidebar" value={t.sidebarBg} onChange={v => handleThemeChange('sidebarBg', v)} />
            <ColorPicker label="Texto/Ícones da Sidebar" value={t.sidebarText} onChange={v => handleThemeChange('sidebarText', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ColorPicker = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
    <div className="flex gap-2 items-center border p-1 rounded bg-slate-50">
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="h-8 w-10 cursor-pointer border-none bg-transparent p-0"/>
      <span className="text-xs font-mono text-slate-600 flex-1">{value}</span>
    </div>
  </div>
);
