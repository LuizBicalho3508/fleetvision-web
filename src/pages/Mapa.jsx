import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getDevices, getPositions, sendCommand } from '../services/api';
import { 
  MapContainer, TileLayer, Marker, Popup, useMap, LayersControl 
} from 'react-leaflet';
import { 
  Search, Layout, Sidebar, ArrowDown, ArrowUp, Wifi, WifiOff, 
  Navigation, Battery, Zap, Clock, Map as MapIcon, Settings, 
  Lock, Unlock, User, Briefcase, AlertTriangle, Smartphone, 
  MapPin, Activity, ShieldCheck, ShieldAlert, Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

const { BaseLayer } = LayersControl;

// --- SISTEMA DE FILA DE ENDEREÇOS OTIMIZADO ---
const addressQueue = [];
const addressCache = new Map();
let isProcessingQueue = false;

const processAddressQueue = async () => {
  if (addressQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;
  const { lat, lon, setAddr } = addressQueue.shift();

  if (!lat || !lon || (lat === 0 && lon === 0)) {
    setAddr('Sem GPS válido');
    processAddressQueue(); 
    return;
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (addressCache.has(cacheKey)) {
    setAddr(addressCache.get(cacheKey));
    processAddressQueue();
    return;
  }

  try {
    const resp = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { timeout: 3000 }
    );
    
    if (resp.data && resp.data.address) {
      const a = resp.data.address;
      const short = `${a.road || ''}, ${a.suburb || ''} - ${a.city || ''}`;
      const cleanAddr = short.replace(/^, /, '').replace(/, ,/g, ',').replace(/, -/g, ' -');
      addressCache.set(cacheKey, cleanAddr);
      setAddr(cleanAddr);
    } else {
      setAddr('Endereço n/d');
    }
  } catch (e) {
    setAddr(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  }

  setTimeout(processAddressQueue, 1500);
};

const requestAddress = (lat, lon, setAddr) => {
  if (!lat && !lon) {
    setAddr('Sem Localização');
    return;
  }
  addressQueue.push({ lat, lon, setAddr });
  if (!isProcessingQueue) processAddressQueue();
};

const AutoAddress = ({ lat, lon, serverAddress }) => {
  const [addr, setAddr] = useState(serverAddress || 'Aguardando...');

  useEffect(() => {
    if (serverAddress) {
      setAddr(serverAddress);
    } else {
      requestAddress(lat, lon, setAddr);
    }
  }, [lat, lon, serverAddress]);

  return <span className="truncate block" title={addr}>{addr}</span>;
};

// --- UTILITÁRIOS ---
const getStatusColor = (device, pos) => {
  if (device.status === 'offline') return '#64748b'; 
  if (pos?.attributes?.alarm) return '#ef4444'; 
  if (pos?.speed > 0) return '#10b981'; 
  if (pos?.attributes?.ignition) return '#f59e0b'; 
  return '#ef4444'; 
};

const createRotatedIcon = (color, course) => {
  const svg = `
    <svg width="34" height="34" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="15" cy="15" r="10" fill="white" stroke="${color}" stroke-width="3" filter="url(#shadow)" />
      <path d="M15 7 L19 19 L15 16 L11 19 Z" fill="${color}" transform="rotate(${course || 0}, 15, 15)" />
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center]);
  return null;
}

export default function Mapa() {
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [layoutPos, setLayoutPos] = useState(localStorage.getItem('mapLayout') || 'bottom'); 
  const [gridHeight, setGridHeight] = useState(localStorage.getItem('mapGridHeight') || '45vh');
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [selectedId, setSelectedId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [processingCmd, setProcessingCmd] = useState(null);

  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const [devs, pos] = await Promise.all([getDevices(), getPositions()]);
      setDevices(devs);
      setPositions(pos);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 4000); 
    return () => clearInterval(timerRef.current);
  }, []);

  const handleLayoutChange = (pos) => {
    setLayoutPos(pos);
    localStorage.setItem('mapLayout', pos);
  };

  const handleHeightChange = (height) => {
    setGridHeight(height);
    localStorage.setItem('mapGridHeight', height);
  };

  const handleQuickCommand = async (e, id, type) => {
    e.stopPropagation(); 
    if (!confirm(`Deseja enviar comando: ${type}?`)) return;
    setProcessingCmd(id);
    try {
      await sendCommand(id, type, {});
      toast.success('Comando enviado!');
    } catch (err) { toast.error('Falha no envio.'); } 
    finally { setProcessingCmd(null); }
  };

  const openGoogleMaps = (e, lat, lon) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  const filteredList = useMemo(() => {
    return devices.filter(d => {
      const p = positions.find(pos => pos.deviceId === d.id);
      const matchesText = d.name.toLowerCase().includes(filterText.toLowerCase()) || 
                          d.uniqueId?.includes(filterText) ||
                          d.attributes?.client?.toLowerCase().includes(filterText.toLowerCase());
      
      if (!matchesText) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'offline' && d.status === 'offline') return true;
      if (statusFilter === 'moving' && d.status !== 'offline' && p?.speed > 0) return true;
      if (statusFilter === 'stop' && d.status !== 'offline' && p?.speed <= 0) return true;
      return false;
    });
  }, [devices, positions, filterText, statusFilter]);

  const selectedDevice = useMemo(() => {
    if (!selectedId) return null;
    const d = devices.find(x => x.id === selectedId);
    const p = positions.find(x => x.deviceId === selectedId);
    if (p && p.latitude && p.longitude) return { lat: p.latitude, lon: p.longitude };
    return null; 
  }, [selectedId, devices, positions]);

  const DeviceRow = ({ d }) => {
    const pos = positions.find(p => p.deviceId === d.id) || {};
    const isSelected = selectedId === d.id;
    const color = getStatusColor(d, pos);
    const speed = Math.round((pos.speed || 0) * 1.852);
    
    const isBlocked = d.attributes?.blocked || pos.attributes?.blocked || false;
    
    const client = d.attributes?.client || 'Sem Cliente';
    const operator = pos.attributes?.operator || d.attributes?.operator || '-';
    let lastUpdate = '-';
    try { lastUpdate = pos.serverTime ? format(new Date(pos.serverTime), 'dd/MM HH:mm') : '-'; } catch(e){}

    return (
      <div 
        onClick={() => setSelectedId(d.id)}
        className={`grid grid-cols-12 gap-2 items-center py-2 px-3 rounded-lg border transition-all cursor-pointer hover:shadow-md mb-1.5 text-xs ${
          isSelected 
            ? 'bg-blue-50/90 border-blue-400 dark:bg-blue-900/40 dark:border-blue-500' 
            : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-300'
        }`}
      >
        <div className="col-span-12 md:col-span-3 flex items-center gap-3 overflow-hidden">
           <div className="relative shrink-0">
             <div className="w-9 h-9 rounded-full flex items-center justify-center border bg-slate-50" style={{ borderColor: color }}>
               {d.status === 'offline' ? <WifiOff size={16} style={{ color }}/> : <Navigation size={16} style={{ color }} className={speed > 0 ? 'animate-pulse' : ''}/>}
             </div>
           </div>
           <div className="min-w-0 flex-1">
             <div className="flex justify-between items-center">
               <h4 className="font-black text-slate-800 dark:text-white truncate max-w-[130px] text-sm">{d.name}</h4>
             </div>
             <div className="flex items-center gap-2 mt-0.5 text-[10px]">
               <span className="text-slate-500 font-mono truncate">{d.uniqueId}</span>
               {d.attributes?.plate && <span className="bg-slate-100 px-1 rounded text-slate-600 font-bold">{d.attributes.plate}</span>}
             </div>
           </div>
        </div>

        <div className="col-span-6 md:col-span-2 flex flex-col justify-center border-l border-slate-100 dark:border-slate-700 pl-3 h-full overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1 text-slate-700 dark:text-slate-200 truncate font-bold">
             <Briefcase size={12} className="text-slate-400 shrink-0"/>
             <span className="truncate">{client}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate text-[10px]">
             <Smartphone size={12} className="text-slate-400 shrink-0"/>
             <span className="truncate">{operator}</span>
          </div>
        </div>

        <div className="col-span-6 md:col-span-3 flex flex-col justify-center border-l border-slate-100 dark:border-slate-700 pl-3 h-full overflow-hidden">
           <div className="flex items-start gap-1.5 mb-1 text-slate-600 dark:text-slate-300 font-medium">
              <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5"/>
              <AutoAddress lat={pos.latitude} lon={pos.longitude} serverAddress={pos.address} />
           </div>
           <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Clock size={10}/>
              <span>{lastUpdate}</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono">{pos.latitude?.toFixed(4)}, {pos.longitude?.toFixed(4)}</span>
           </div>
        </div>

        <div className="col-span-6 md:col-span-2 grid grid-cols-2 gap-x-2 gap-y-1 border-l border-slate-100 dark:border-slate-700 pl-3 h-full items-center">
           <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 mr-1 flex gap-1"><Zap size={10}/> Ign</span>
              <span className={`font-bold ${pos.attributes?.ignition ? 'text-amber-500' : 'text-slate-400'}`}>{pos.attributes?.ignition ? 'ON' : 'OFF'}</span>
           </div>
           <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 mr-1 flex gap-1"><Battery size={10}/> Bat</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{pos.attributes?.power ? pos.attributes.power.toFixed(1)+'V' : '-'}</span>
           </div>
           <div className="flex items-center justify-between text-[10px] col-span-2">
              <span className="text-slate-400 mr-1">Velocidade</span>
              <span className={`font-black text-sm ${speed > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{speed} <span className="text-[9px] font-normal text-slate-400">km/h</span></span>
           </div>
        </div>

        <div className="col-span-6 md:col-span-2 flex flex-col justify-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-700 h-full">
           <div className="flex justify-end gap-1">
              <button title="Maps" onClick={(e) => openGoogleMaps(e, pos.latitude, pos.longitude)} className="p-1.5 bg-white border border-slate-200 hover:bg-blue-50 text-slate-600 rounded shadow-sm">
                <MapIcon size={14}/>
              </button>
              <button title="Bloquear" onClick={(e) => handleQuickCommand(e, d.id, 'engineStop')} className="p-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded shadow-sm">
                {processingCmd === d.id ? <Activity className="animate-spin" size={14}/> : <Lock size={14}/>}
              </button>
              <button title="Liberar" onClick={(e) => handleQuickCommand(e, d.id, 'engineResume')} className="p-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-600 rounded shadow-sm">
                {processingCmd === d.id ? <Activity className="animate-spin" size={14}/> : <Unlock size={14}/>}
              </button>
           </div>
           <div className={`flex items-center justify-center gap-1 py-0.5 rounded text-[9px] font-bold uppercase w-full ${isBlocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isBlocked ? <ShieldAlert size={10}/> : <ShieldCheck size={10}/>}
              <span>{isBlocked ? 'BLOQUEADO' : 'LIBERADO'}</span>
           </div>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-[1000]">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h2 className="text-sm font-black text-slate-800 dark:text-white mb-2">Frota ({filteredList.length})</h2>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2 text-slate-400" size={14}/>
          <input className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded text-xs" placeholder="Buscar..." value={filterText} onChange={e=>setFilterText(e.target.value)}/>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
           {['all', 'moving', 'stop', 'offline'].map(status => (
             <button key={status} onClick={() => setStatusFilter(status)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${statusFilter===status ? 'bg-slate-800 text-white':'bg-slate-100 text-slate-500'}`}>{status}</button>
           ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
        {loading ? <div className="text-center py-10 text-slate-400 text-xs">Carregando...</div> : filteredList.map(d => (
           <div key={d.id} onClick={()=>setSelectedId(d.id)} className="p-2 border rounded cursor-pointer hover:bg-slate-50">
             <div className="font-bold text-xs">{d.name}</div>
             <div className="text-[10px] text-slate-500">{d.attributes?.client || 'Sem Cliente'}</div>
           </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] relative bg-slate-100 dark:bg-slate-950 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      
      {/* MAPA */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <LayersControl position="topright">
            <BaseLayer checked name="Mapa"><TileLayer attribution='OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/></BaseLayer>
            <BaseLayer name="Satélite"><TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" attribution="Google"/></BaseLayer>
          </LayersControl>
          {filteredList.map(d => {
            const p = positions.find(pos => pos.deviceId === d.id);
            if (!p || !p.latitude) return null;
            return (
              <Marker key={d.id} position={[p.latitude, p.longitude]} icon={createRotatedIcon(getStatusColor(d, p), p.course)} eventHandlers={{ click: () => setSelectedId(d.id) }}>
                <Popup><strong className="block text-sm">{d.name}</strong></Popup>
              </Marker>
            );
          })}
          <MapController center={selectedDevice ? [selectedDevice.lat, selectedDevice.lon] : null} />
        </MapContainer>
      </div>

      {/* SIDEBARS */}
      {(layoutPos === 'left' || layoutPos === 'right') && (
        <div className={`absolute top-0 bottom-0 w-72 z-10 border-slate-200 dark:border-slate-800 ${layoutPos==='left'?'left-0 border-r':'right-0 border-l'}`}>
           <SidebarContent />
        </div>
      )}

      {/* BOTTOM LAYOUT (GRID PRO RESTAURADO) */}
      {layoutPos === 'bottom' && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-10 animate-in slide-in-from-bottom duration-300 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col shadow-2xl transition-all ease-in-out"
          style={{ height: gridHeight }}
        >
           <div className="p-2 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/90 dark:bg-slate-900/90 shrink-0 h-12">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <Layout size={16} className="text-blue-600"/> Monitoramento <span className="text-[10px] bg-slate-200 px-1.5 rounded-full">{filteredList.length}</span>
              </h2>
              <div className="flex gap-2">
                 <input placeholder="Buscar Placa/Cliente..." className="bg-white border px-3 py-1 rounded text-xs w-48 focus:w-64 transition-all" value={filterText} onChange={e=>setFilterText(e.target.value)}/>
                 <div className="flex bg-slate-100 rounded border">
                    <button onClick={()=>handleHeightChange('25vh')} className="p-1 hover:bg-white text-slate-500"><ArrowDown size={14}/></button>
                    <button onClick={()=>handleHeightChange('50vh')} className="p-1 hover:bg-white text-slate-500"><Layout size={14}/></button>
                    <button onClick={()=>handleHeightChange('85vh')} className="p-1 hover:bg-white text-slate-500"><ArrowUp size={14}/></button>
                 </div>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredList.map(d => <DeviceRow key={d.id} d={d} />)}
              {filteredList.length === 0 && <div className="text-center text-slate-400 py-4 text-xs">Nenhum veículo encontrado</div>}
           </div>
        </div>
      )}

      {/* BOTÃO CONFIG */}
      <div className="absolute top-28 right-2.5 z-[400]">
        <div className="relative group">
          <button onClick={() => setShowSettings(!showSettings)} className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border hover:bg-slate-50 text-slate-700">
            <Settings size={20}/>
          </button>
          {showSettings && (
            <div className="absolute right-0 top-10 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-2xl border w-48 animate-in fade-in zoom-in-95">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Visualização</h3>
              <button onClick={() => handleLayoutChange('left')} className="w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-slate-50"><Sidebar size={14}/> Lateral</button>
              <button onClick={() => handleLayoutChange('bottom')} className="w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-slate-50"><Layout size={14}/> Grid (Padrão)</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
