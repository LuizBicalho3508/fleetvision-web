import React, { useState, useEffect, useRef } from 'react';
import { getDevices, sendCommand, getPositions, getRoute, getEvents } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Search, Activity, Wifi, WifiOff, Battery, Power, Send, Terminal, MapPin, RefreshCw, Lock, LockOpen, Key, CreditCard, Radio, FileText, CheckCircle, AlertTriangle, X, History, Clock, Download, Calendar } from 'lucide-react';
import { startOfDay, endOfDay, formatISO, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  return (
    <div className={`fixed top-4 right-4 z-[9999] ${bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-all animate-in slide-in-from-right duration-500`}>
      <div><p className="font-bold text-sm">{type==='error'?'Atenção':'Sucesso'}</p><p className="text-xs opacity-90">{message}</p></div>
      <button onClick={onClose}><X size={16}/></button>
    </div>
  );
};

const pulsingIcon = L.divIcon({ html: `<div class="relative flex h-6 w-6"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span class="relative inline-flex rounded-full h-6 w-6 bg-blue-500 border-2 border-white shadow-sm"></span></div>`, className: 'bg-transparent', iconSize: [24, 24], iconAnchor: [12, 12] });
const MapRecenter = ({ position }) => { const map = useMap(); useEffect(() => { if (position && position.latitude) map.flyTo([position.latitude, position.longitude], 16, { animate: true }); }, [position, map]); return null; };

const formatLogDetails = (data) => {
  if (!data || typeof data !== 'object') return String(data);
  let details = ''; const attrs = data.attributes || {};
  if (data.latitude) details += `Lat:${data.latitude.toFixed(5)} Lon:${data.longitude.toFixed(5)} ${(data.speed * 1.852).toFixed(0)}km/h. `;
  if (attrs.ignition !== undefined) details += `Ign:${attrs.ignition?'ON':'OFF'} `;
  let pkg = attrs.type || (data.type ? 'EVENTO' : 'GPS');
  if(data.type && !attrs.type) pkg = data.type.toUpperCase();
  details += `| ${pkg}`;
  const rawKeys = Object.entries(attrs).filter(([k]) => !['ignition','distance','totalDistance','motion','hours'].includes(k)).map(([k, v]) => `${k}:${v}`);
  if (rawKeys.length > 0) details += `\n   ↳ RAW: {${rawKeys.join(', ')}}`;
  return details;
};

export default function Testador() {
  const [activeTab, setActiveTab] = useState('live');
  const [notification, setNotification] = useState(null);
  const showToast = (msg, type = 'success') => setNotification({ msg, type, id: Date.now() });
  const [imeiInput, setImeiInput] = useState('');
  const [testingDevice, setTestingDevice] = useState(null);
  const [latestPosition, setLatestPosition] = useState(null);
  const [logs, setLogs] = useState([]);
  const [commandType, setCommandType] = useState('positionSingle');
  const [sendingCmd, setSendingCmd] = useState(false);
  const logsEndRef = useRef(null);
  const [histDate, setHistDate] = useState(new Date().toISOString().split('T')[0]);
  const [histLogs, setHistLogs] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const scrollToBottom = () => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { if(activeTab === 'live') scrollToBottom(); }, [logs, activeTab]);

  useSocket((data) => {
    if (!testingDevice || activeTab !== 'live') return;
    if (data.positions) { const pos = data.positions.find(p => p.deviceId === testingDevice.id); if (pos) updateLivePosition(pos, 'SOCKET'); }
    if (data.events) data.events.filter(e => e.deviceId === testingDevice.id).forEach(e => addLog(`EVENTO: ${e.type}`, e));
  });

  const updateLivePosition = (pos, source) => { setLatestPosition(pos); addLog(source, pos); };
  const addLog = (type, data) => { setLogs(prev => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString(), type, details: formatLogDetails(data) }].slice(-100)); };

  const handleStartTest = async () => {
    if (!imeiInput) return showToast('Informe o IMEI.', 'error');
    try {
      const allDevs = await getDevices();
      const found = allDevs.find(d => d.uniqueId === imeiInput);
      if (found) { setTestingDevice(found); addLog('SUCESSO', `Conectado: ${found.name}`); showToast('Conectado.', 'success'); } 
      else showToast('Não encontrado.', 'error');
    } catch (e) { showToast('Erro API.', 'error'); }
  };

  const handleSendCommand = async () => {
    if (!testingDevice) return; setSendingCmd(true);
    try { await sendCommand({ deviceId: testingDevice.id, type: commandType }); addLog('COMANDO', 'Enviado!'); } 
    catch (e) { addLog('ERRO', e.message); } finally { setSendingCmd(false); }
  };

  const handleFetchHistory = async () => {
    setHistLoading(true); setHistLogs([]);
    try {
      const allDevs = await getDevices();
      const target = allDevs.find(d => d.uniqueId === imeiInput);
      if(!target) throw new Error('Dispositivo não encontrado');
      const from = formatISO(startOfDay(parseISO(histDate))); const to = formatISO(endOfDay(parseISO(histDate)));
      const [routeData, eventsData] = await Promise.all([ getRoute(target.id, from, to).catch(()=>[]), getEvents(from, to).catch(()=>[]) ]);
      const combined = [ ...routeData.map(r => ({ ...r, _source: 'GPS' })), ...eventsData.filter(e=>e.deviceId===target.id).map(e => ({ ...e, _source: 'EVENTO', serverTime: e.eventTime })) ].sort((a,b) => new Date(a.serverTime) - new Date(b.serverTime));
      setHistLogs(combined);
    } catch (e) { showToast('Erro histórico.', 'error'); } finally { setHistLoading(false); }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 relative">
      {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 transition-colors">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setActiveTab('live')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'live' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><Activity size={18}/> Monitoramento Real</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><History size={18}/> Histórico Logs</button>
        </div>
        <div className="p-4 flex gap-4 items-center bg-slate-50 dark:bg-slate-900">
          <div className="relative w-96"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className="w-full pl-9 pr-4 py-2 border dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Serial / IMEI" value={imeiInput} onChange={e=>setImeiInput(e.target.value)} /></div>
          {activeTab === 'live' ? <button onClick={handleStartTest} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Activity size={18}/> Conectar</button> : <><input type="date" className="border dark:border-slate-700 p-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white" value={histDate} onChange={e=>setHistDate(e.target.value)} /><button onClick={handleFetchHistory} disabled={histLoading} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 dark:hover:bg-slate-600 shadow-sm">{histLoading ? <RefreshCw className="animate-spin"/> : <Search size={18}/>} Buscar</button></>}
        </div>
      </div>

      {activeTab === 'live' ? (
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/2 flex flex-col gap-4 h-full overflow-hidden">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-2 shrink-0">
              <select className="flex-1 border dark:border-slate-600 p-2 rounded text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none" value={commandType} onChange={e=>setCommandType(e.target.value)} disabled={!testingDevice}><option value="positionSingle">Pedir Posição</option><option value="engineStop">Bloquear</option><option value="engineResume">Desbloquear</option><option value="rebootDevice">Reiniciar</option></select>
              <button onClick={handleSendCommand} disabled={!testingDevice || sendingCmd} className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black dark:hover:bg-slate-600 disabled:opacity-50">{sendingCmd ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>}</button>
            </div>
            <div className="flex-1 bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700 flex flex-col overflow-hidden text-xs font-mono">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                {logs.map(log => (
                  <div key={log.id} className="flex flex-col border-b border-slate-800 hover:bg-slate-800/50 p-1.5 rounded">
                    <div className="flex gap-2"><span className="text-blue-400 shrink-0">[{log.time}]</span><span className="text-yellow-400 font-bold shrink-0">{log.type}&gt;</span><span className="text-slate-300">{log.details.split('\n')[0]}</span></div>
                    {log.details.includes('RAW:') && <div className="text-[10px] text-slate-500 mt-1 pl-20 break-all">{log.details.split('\n')[1]}</div>}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative h-full">
            <MapContainer center={[-14.2350, -51.9253]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}><TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />{latestPosition && <MapRecenter position={latestPosition}/>}{latestPosition && <Marker position={[latestPosition.latitude, latestPosition.longitude]} icon={pulsingIcon}><Popup><strong>{testingDevice?.name}</strong></Popup></Marker>}</MapContainer>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-sm text-left font-mono text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 shadow-sm"><tr><th className="px-4 py-3">Horário</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Dados</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {histLogs.map((log, idx) => {
                  const formatted = formatLogDetails(log);
                  const [summary, raw] = formatted.split('\n');
                  return (<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="px-4 py-2 text-slate-500 dark:text-slate-400">{new Date(log.serverTime).toLocaleTimeString()}</td><td className="px-4 py-2 font-bold text-blue-600 dark:text-blue-400">{log._source}</td><td className="px-4 py-2"><div className="text-slate-800 dark:text-slate-200">{summary}</div>{raw && <div className="text-[10px] text-slate-400 mt-1 break-all bg-slate-50 dark:bg-slate-900 p-1 rounded">{raw.replace('↳ RAW: ', '')}</div>}</td></tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
