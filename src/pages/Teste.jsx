import React, { useState, useEffect, useRef } from 'react';
import { getDevices, getPositions, sendCommand, getRoute, getEvents } from '../services/api';
import { 
  Activity, Play, Square, Trash2, Terminal, Wifi, 
  Send, Calendar, Search, History, ChevronDown, ChevronRight,
  Code
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from 'date-fns';

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// COMPONENTE DE LOG INDIVIDUAL (EXPANSÍVEL E FORMATADO)
const LogItem = ({ log }) => {
  const [expanded, setExpanded] = useState(true); // Padrão aberto para ver tudo

  return (
    <div className="mb-2 rounded-md border border-slate-800 bg-slate-900/50 overflow-hidden animate-in slide-in-from-left-2 duration-200">
      {/* CABEÇALHO DO LOG */}
      <div 
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-slate-500">
          {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </button>
        
        <span className="text-[10px] font-mono text-slate-500 min-w-[60px]">{log.time}</span>
        
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
          log.type === 'rx' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 
          log.type === 'tx' ? 'bg-blue-950 text-blue-400 border border-blue-900' : 
          log.type === 'err' ? 'bg-red-950 text-red-400 border border-red-900' :
          'bg-slate-800 text-slate-400'
        }`}>
          {log.type}
        </span>

        <span className="text-xs font-semibold text-slate-300 truncate flex-1">{log.title}</span>
      </div>

      {/* CORPO DO LOG (JSON FORMATADO) */}
      {expanded && log.details && (
        <div className="border-t border-slate-800 bg-slate-950 p-2 overflow-x-auto">
          <pre className="text-[10px] font-mono text-emerald-300/90 whitespace-pre leading-snug">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default function Teste() {
  const [activeTab, setActiveTab] = useState('live');
  const [imei, setImei] = useState('');
  const [deviceData, setDeviceData] = useState(null);
  
  // LIVE STATES
  const [listening, setListening] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);
  const [cmdType, setCmdType] = useState('custom');
  const [customCmd, setCustomCmd] = useState('');
  const [sending, setSending] = useState(false);
  const intervalRef = useRef(null);
  const liveLogsEndRef = useRef(null);

  // HISTORY STATES
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-scroll (Apenas se estiver no final)
  useEffect(() => {
    if (activeTab === 'live' && liveLogsEndRef.current) {
      liveLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveLogs, activeTab]);

  useEffect(() => { return () => stopListening(); }, []);

  const addLiveLog = (type, title, details = null) => {
    const time = new Date().toLocaleTimeString();
    // Limita a 50 logs para não travar o navegador com muito JSON
    setLiveLogs(prev => [...prev, { id: Date.now(), time, type, title, details }].slice(-50));
  };

  const fetchLoop = async () => {
    try {
      const [devs, pos] = await Promise.all([getDevices(), getPositions()]);
      const target = devs.find(d => d.uniqueId === imei);

      if (!target) {
        if (deviceData) addLiveLog('err', 'Dispositivo desconectado.');
        return;
      }

      const p = pos.find(x => x.deviceId === target.id) || {};
      
      // Combina dados do Device + Posição para ter o pacote COMPLETO
      // O 'attributes' dentro de 'p' é o que contém os sensores
      const fullPacket = {
        ...target,
        ...p,
        attributes: { ...target.attributes, ...p.attributes } 
      };

      setDeviceData(prev => {
        // Se mudou o horário de atualização, é pacote novo
        if (!prev || prev.lastUpdate !== fullPacket.lastUpdate) {
          addLiveLog(
            'rx', 
            `📍 Pacote Recebido (${fullPacket.protocol || 'protocolo'})`, 
            // Aqui passamos o objeto inteiro para o log
            {
              latitude: fullPacket.latitude,
              longitude: fullPacket.longitude,
              speed: fullPacket.speed,
              course: fullPacket.course,
              address: fullPacket.address,
              battery: fullPacket.attributes?.batteryLevel || fullPacket.attributes?.power,
              ignition: fullPacket.attributes?.ignition,
              motion: fullPacket.attributes?.motion,
              totalDistance: fullPacket.attributes?.totalDistance,
              // Joga todo o resto dos atributos aqui para garantir completude
              ...fullPacket.attributes
            }
          );
        }
        return fullPacket;
      });
    } catch (e) { console.error(e); }
  };

  const startListening = () => {
    if (!imei) return toast.error('Digite o IMEI');
    setListening(true);
    setLiveLogs([]);
    setDeviceData(null);
    addLiveLog('sys', `Monitorando IMEI: ${imei}`);
    fetchLoop();
    intervalRef.current = setInterval(fetchLoop, 3000);
  };

  const stopListening = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setListening(false);
    addLiveLog('sys', 'Monitoramento pausado.');
  };

  const handleSendCommand = async () => {
    if (!deviceData) return toast.error('Conecte primeiro.');
    setSending(true);
    try {
      let payload = { type: 'custom', attributes: { data: customCmd } };
      if (cmdType === 'engineStop') payload = { type: 'engineStop' };
      if (cmdType === 'engineResume') payload = { type: 'engineResume' };

      addLiveLog('tx', `Enviando: ${cmdType}`, payload);
      await sendCommand(deviceData.id, payload.type, payload.attributes);
      toast.success('Enviado!');
    } catch (e) {
      toast.error('Erro');
      addLiveLog('err', 'Falha envio', e.message);
    } finally {
      setSending(false);
    }
  };

  const fetchHistory = async () => {
    if (!imei) return toast.error('Digite o IMEI');
    setLoadingHistory(true);
    setHistoryLogs([]);
    try {
      const devs = await getDevices();
      const target = devs.find(d => d.uniqueId === imei);
      if (!target) { toast.error('IMEI não encontrado.'); setLoadingHistory(false); return; }

      const from = new Date(historyDate); from.setHours(0, 0, 0, 0);
      const to = new Date(historyDate); to.setHours(23, 59, 59, 999);

      const [route, events] = await Promise.all([
        getRoute(target.id, from.toISOString(), to.toISOString()),
        getEvents(from.toISOString(), to.toISOString())
      ]);

      const logs = [];
      route.forEach(r => logs.push({
        id: r.id, time: format(new Date(r.serverTime), 'HH:mm:ss'), type: 'rx',
        title: 'Posição Histórica', details: { ...r, attributes: r.attributes }
      }));
      events.filter(e => e.deviceId === target.id).forEach(e => logs.push({
        id: 'evt_'+e.id, time: format(new Date(e.serverTime), 'HH:mm:ss'), type: 'evt',
        title: `Evento: ${e.type}`, details: e.attributes
      }));

      logs.sort((a, b) => a.time.localeCompare(b.time));
      setHistoryLogs(logs);
      if(logs.length===0) toast('Sem dados.');
    } catch (e) { toast.error('Erro histórico'); } 
    finally { setLoadingHistory(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4 font-sans animate-in fade-in">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-lg text-white"><Terminal size={20}/></div>
          <div><h1 className="font-bold text-slate-800 dark:text-white">Console Diagnóstico</h1></div>
        </div>
        <div className="flex gap-2 items-center">
          <input className="w-40 p-2 bg-slate-50 dark:bg-slate-900 border rounded text-sm dark:text-white font-mono" placeholder="IMEI..." value={imei} onChange={e=>setImei(e.target.value)}/>
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded p-1">
            <button onClick={()=>setActiveTab('live')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeTab==='live'?'bg-white dark:bg-slate-700 shadow text-blue-600':'text-slate-500'}`}>AO VIVO</button>
            <button onClick={()=>setActiveTab('history')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeTab==='history'?'bg-white dark:bg-slate-700 shadow text-purple-600':'text-slate-500'}`}>HISTÓRICO</button>
          </div>
        </div>
      </div>

      {/* AO VIVO */}
      {activeTab === 'live' && (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
          {/* PAINEL ESQUERDO */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
               {!listening ? 
                 <button onClick={startListening} className="w-full bg-green-600 text-white py-2 rounded font-bold flex justify-center gap-2"><Play size={18}/> Iniciar</button> :
                 <button onClick={stopListening} className="w-full bg-red-500 text-white py-2 rounded font-bold flex justify-center gap-2 animate-pulse"><Square size={18}/> Parar</button>
               }
               {deviceData && (
                 <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border dark:border-slate-700">
                      <span className="text-slate-500 block">Velocidade</span>
                      <span className="font-bold text-lg text-blue-600">{Math.round((deviceData.speed||0)*1.852)} km/h</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border dark:border-slate-700">
                      <span className="text-slate-500 block">Ignição</span>
                      <span className={`font-bold text-lg ${deviceData.attributes?.ignition?'text-green-500':'text-slate-400'}`}>{deviceData.attributes?.ignition?'ON':'OFF'}</span>
                    </div>
                    {deviceData.latitude && (
                     <div className="col-span-2 h-32 rounded border overflow-hidden mt-1 relative z-0">
                        <MapContainer center={[deviceData.latitude, deviceData.longitude]} zoom={13} style={{height:'100%',width:'100%'}} zoomControl={false} dragging={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                          <Marker position={[deviceData.latitude, deviceData.longitude]}/>
                          <ChangeView center={[deviceData.latitude, deviceData.longitude]}/>
                        </MapContainer>
                     </div>
                   )}
                 </div>
               )}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold mb-2 flex gap-1"><Send size={14}/> Comandos</h3>
              <select className="w-full mb-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded text-xs dark:text-white" value={cmdType} onChange={e=>setCmdType(e.target.value)}>
                <option value="custom">Personalizado</option>
                <option value="engineStop">Bloquear</option>
                <option value="engineResume">Desbloquear</option>
              </select>
              {cmdType === 'custom' && <input className="w-full mb-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded text-xs font-mono dark:text-white" placeholder="Ex: RELAY,1" value={customCmd} onChange={e=>setCustomCmd(e.target.value)}/>}
              <button onClick={handleSendCommand} disabled={sending||!deviceData} className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold">{sending?'Enviando...':'Enviar'}</button>
            </div>
          </div>

          {/* PAINEL DIREITO - LOGS */}
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-2 border-b border-slate-800 flex justify-between items-center">
              <div className="flex gap-2 items-center text-xs font-mono text-emerald-400"><Code size={14}/> <span>JSON_STREAM</span></div>
              <button onClick={()=>setLiveLogs([])}><Trash2 size={14} className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
              {liveLogs.length === 0 && <div className="text-slate-600 text-xs text-center mt-10">Aguardando pacotes...</div>}
              {liveLogs.map(log => <LogItem key={log.id} log={log} />)}
              <div ref={liveLogsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      {activeTab === 'history' && (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border p-4">
           <div className="flex gap-2 mb-4">
             <input type="date" className="border p-2 rounded text-sm dark:bg-slate-900 dark:text-white" value={historyDate} onChange={e=>setHistoryDate(e.target.value)}/>
             <button onClick={fetchHistory} className="bg-purple-600 text-white px-4 rounded text-sm font-bold flex items-center gap-2">{loadingHistory?<Activity className="animate-spin" size={16}/>:<Search size={16}/>} Buscar</button>
           </div>
           <div className="flex-1 overflow-y-auto bg-slate-950 rounded-lg p-2 custom-scrollbar">
              {historyLogs.map(log => <LogItem key={log.id} log={log} />)}
           </div>
        </div>
      )}
    </div>
  );
}
