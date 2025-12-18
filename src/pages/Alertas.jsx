import React, { useState, useEffect } from 'react';
import { getEvents, getAlertRules, saveAlertRules, getDevices } from '../services/api';
import { 
  Bell, AlertTriangle, Settings, CheckCircle, Search, 
  CheckSquare, Square, Zap, Navigation, Map as MapIcon, Power, Save
} from 'lucide-react';
import { startOfDay, endOfDay, formatISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function Alertas() {
  const [activeTab, setActiveTab] = useState('history');
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filter, setFilter] = useState('');
  
  const [rules, setRules] = useState({
    id: 1, 
    ignitionOn: false,
    ignitionOff: false,
    speeding: false,
    geofenceEnter: false,
    geofenceExit: false,
    powerCut: false,
    lowBattery: false,
    speedLimit: 80
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date();
      const [evts, savedRules, devs] = await Promise.all([
        getEvents(formatISO(startOfDay(today)), formatISO(endOfDay(today))),
        getAlertRules(),
        getDevices()
      ]);
      
      setAlerts(evts || []);
      setDevices(devs || []);
      
      if (Array.isArray(savedRules) && savedRules.length > 0) {
         setRules({ ...rules, ...savedRules[0] });
      }
    } catch (e) { console.error(e); }
  };

  const handleToggleRule = async (key) => {
    const newRules = { ...rules, [key]: !rules[key] };
    setRules(newRules);
    
    try {
      await saveAlertRules([newRules]); 
      // Feedback sutil para não incomodar
      // toast.success('Salvo'); 
    } catch (e) {
      toast.error('Erro ao salvar');
    }
  };

  const handleSpeedChange = async (e) => {
    const val = parseInt(e.target.value) || 0;
    setRules({ ...rules, speedLimit: val });
  };

  const saveSpeed = async () => {
    await saveAlertRules([rules]);
    toast.success('Limite salvo!');
  };

  const filteredAlerts = alerts.filter(a => {
    const devName = devices.find(d => d.id === a.deviceId)?.name || 'Veículo ' + a.deviceId;
    return devName.toLowerCase().includes(filter.toLowerCase()) || a.type.toLowerCase().includes(filter.toLowerCase());
  });

  // Componente de Checkbox Padronizado
  const ToggleItem = ({ label, sublabel, active, onClick }) => (
    <div 
      onClick={onClick}
      className={`flex justify-between items-center p-4 rounded-lg border cursor-pointer transition-all ${active ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
    >
      <div>
        <p className={`font-bold text-sm ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-white'}`}>{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
      </div>
      <div className="text-blue-600 dark:text-blue-400">
        {active ? <CheckSquare size={24} /> : <Square size={24} className="text-slate-300 dark:text-slate-600" />}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="text-blue-600"/> Central de Alertas
        </h1>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>Histórico</button>
          <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>Configuração</button>
        </div>
      </div>

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
              <input className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none" placeholder="Filtrar alertas..." value={filter} onChange={e => setFilter(e.target.value)}/>
            </div>
          </div>
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-200 uppercase text-xs">
              <tr><th className="p-4">Hora</th><th className="p-4">Evento</th><th className="p-4">Veículo</th><th className="p-4">Detalhes</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAlerts.length === 0 ? (<tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum alerta registrado hoje.</td></tr>) : filteredAlerts.map(a => {
                const dev = devices.find(d => d.id === a.deviceId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-mono">{new Date(a.eventTime).toLocaleTimeString()}</td>
                    <td className="p-4 font-bold flex items-center gap-2">
                      {a.type === 'deviceOnline' ? <CheckCircle size={16} className="text-green-500"/> : <AlertTriangle size={16} className="text-red-500"/>}
                      {a.type}
                    </td>
                    <td className="p-4">{dev ? dev.name : a.deviceId}</td>
                    <td className="p-4 text-xs text-slate-400">{JSON.stringify(a.attributes || {})}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Ignição */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><Zap className="text-yellow-500"/> Ignição</h3>
            <div className="space-y-3">
              <ToggleItem 
                label="Ignição Ligada" 
                sublabel="Alertar quando o veículo for ligado" 
                active={rules.ignitionOn} 
                onClick={() => handleToggleRule('ignitionOn')} 
              />
              <ToggleItem 
                label="Ignição Desligada" 
                sublabel="Alertar quando o veículo for desligado" 
                active={rules.ignitionOff} 
                onClick={() => handleToggleRule('ignitionOff')} 
              />
            </div>
          </div>

          {/* Card Velocidade */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><Navigation className="text-blue-500"/> Velocidade</h3>
            <div className="space-y-3">
              <ToggleItem 
                label="Excesso de Velocidade" 
                sublabel="Alertar se ultrapassar o limite configurado" 
                active={rules.speeding} 
                onClick={() => handleToggleRule('speeding')} 
              />
              
              {rules.speeding && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Limite Global (km/h)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="flex-1 p-2.5 rounded border dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={rules.speedLimit}
                      onChange={handleSpeedChange}
                    />
                    <button onClick={saveSpeed} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                      <Save size={16}/> Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Segurança */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><Power className="text-red-500"/> Segurança & Bateria</h3>
            <div className="space-y-3">
              <ToggleItem 
                label="Bateria Removida" 
                sublabel="Alertar corte de alimentação externa" 
                active={rules.powerCut} 
                onClick={() => handleToggleRule('powerCut')} 
              />
              <ToggleItem 
                label="Bateria Baixa" 
                sublabel="Alertar tensão crítica do veículo" 
                active={rules.lowBattery} 
                onClick={() => handleToggleRule('lowBattery')} 
              />
            </div>
          </div>

          {/* Card Cercas */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><MapIcon className="text-green-500"/> Cercas Virtuais</h3>
            <div className="space-y-3">
              <ToggleItem 
                label="Entrada em Cerca" 
                sublabel="Alertar ao entrar em área demarcada" 
                active={rules.geofenceEnter} 
                onClick={() => handleToggleRule('geofenceEnter')} 
              />
              <ToggleItem 
                label="Saída de Cerca" 
                sublabel="Alertar ao sair de área segura" 
                active={rules.geofenceExit} 
                onClick={() => handleToggleRule('geofenceExit')} 
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
