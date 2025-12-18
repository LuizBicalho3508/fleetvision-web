import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDevices, getPositions, sendCommand, getRoute, getStorage } from '../services/api';
import { 
  Search, Truck, Navigation, Layers, 
  Zap, ZapOff, Clock, ChevronRight, 
  Lock, Unlock, Battery, ArrowLeft, Signal, Gauge, User, MapPin, X, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- ÍCONES E HELPERS ---
const getVehicleImage = (d) => d.attributes?.customIconUrl || d.attributes?.vehicleImage || d.attributes?.iconUrl || null;

const createIcon = (d) => {
  const rotation = d.course || 0;
  const img = getVehicleImage(d);
  const isIgnitionOn = d.attributes?.ignition;
  
  // Estilo de rotação
  const rotStyle = `transform: rotate(${rotation}deg); transition: transform 0.5s linear; display: block;`;
  
  let innerHtml;
  if (img) {
    innerHtml = `<div style="${rotStyle} width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><img src="${img}" style="width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 4px 4px rgba(0,0,0,0.3));"/></div>`;
  } else {
    const color = d.status === 'online' ? '#10b981' : d.status === 'moving' ? '#3b82f6' : '#ef4444'; // Emerald, Blue, Red
    innerHtml = `<div style="${rotStyle} width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" style="width:40px; height:40px; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.4));"><path d="M12 2L2 22L12 18L22 22L12 2Z"/></svg></div>`;
  }

  // Container com Animação de Pulso se Ignição Ligada
  const containerHtml = `
    <div class="relative w-full h-full flex items-center justify-center">
      ${isIgnitionOn ? '<div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" style="transform: scale(1.5);"></div>' : ''}
      <div class="relative z-10 w-full h-full flex items-center justify-center">${innerHtml}</div>
    </div>
  `;

  return L.divIcon({ className: 'bg-transparent', html: containerHtml, iconSize: [50, 50], iconAnchor: [25, 25] });
};

// --- CONTROLADOR DO MAPA (FOLLOW & ZOOM) ---
const MapController = ({ selectedDevice, devices }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  // 1. Ajuste inicial da frota (apenas uma vez)
  useEffect(() => {
    if (!hasFitted.current && devices.length > 0 && !selectedDevice) {
      const valid = devices.filter(d => d.latitude);
      if (valid.length) {
        try {
          map.fitBounds(L.latLngBounds(valid.map(d=>[d.latitude, d.longitude])), { padding: [50,50], maxZoom:15 });
          hasFitted.current = true;
        } catch(e) {}
      }
    }
  }, [devices.length]); 

  // 2. Seguir veículo selecionado (Suave)
  useEffect(() => {
    if (selectedDevice && selectedDevice.latitude) {
      map.panTo([selectedDevice.latitude, selectedDevice.longitude], { animate: true, duration: 1.0 });
    }
  }, [selectedDevice?.id, selectedDevice?.latitude, selectedDevice?.longitude]);

  return null;
};

// --- COMPONENTE DE ESTATÍSTICA (BOTTOM BAR) ---
const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl min-w-[80px] border border-slate-100 dark:border-slate-600">
    <Icon size={18} className={`mb-1 ${color}`} />
    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
    <span className="text-sm font-bold text-slate-700 dark:text-white">{value}</span>
  </div>
);

export default function Mapa() {
  const [devices, setDevices] = useState([]);
  const [clients, setClients] = useState([]); // Mantido para referência futura se precisar nome do cliente
  const [search, setSearch] = useState('');
  const [mapStyle, setMapStyle] = useState('streets');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // ESTADO CRÍTICO: ID Selecionado (String/Number Safe)
  const [selectedId, setSelectedId] = useState(null);
  
  const [trail, setTrail] = useState([]);
  const mapRef = useRef(null);
  const [loadingCmd, setLoadingCmd] = useState(false);

  // Derivar o objeto do veículo selecionado (Sempre atualizado)
  const selectedDevice = useMemo(() => {
    return devices.find(d => String(d.id) === String(selectedId)) || null;
  }, [devices, selectedId]);

  useEffect(() => { getStorage('clients').then(c => setClients(c || [])).catch(()=>{}); }, []);

  const loadData = async () => {
    try {
      const [devs, pos] = await Promise.all([getDevices(), getPositions()]);
      const merged = devs.map(d => {
        const p = pos.find(x => x.deviceId === d.id) || {};
        const attrs = { ...d.attributes, ...p.attributes };
        return { 
          ...d, ...p, 
          latitude: p.latitude || null, longitude: p.longitude || null,
          status: p.speed > 0 ? 'moving' : (d.status === 'online' ? 'online' : 'offline'),
          lastUpdate: p.serverTime || d.lastUpdate,
          attributes: attrs,
          course: p.course || 0 
        };
      });
      setDevices(merged);
    } catch (e) { console.error("Erro mapa:", e); }
  };

  useEffect(() => { loadData(); const i = setInterval(loadData, 3000); return () => clearInterval(i); }, []);

  // Busca Rastro ao selecionar
  useEffect(() => {
    if (selectedId) {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 10 * 60000).toISOString();
      getRoute(selectedId, from, to).then(r => setTrail(r && Array.isArray(r) ? r.map(p=>[p.latitude, p.longitude]) : [])).catch(()=>{});
    } else {
      setTrail([]);
    }
  }, [selectedId]);

  const sendCmd = async (type) => {
    if (!selectedId) return;
    if(!confirm(`Confirma o envio do comando?`)) return;
    
    setLoadingCmd(true);
    const toastId = toast.loading('Enviando comando...');
    try {
      await sendCommand(parseInt(selectedId), type, {});
      toast.success('Comando enviado com sucesso!', {id: toastId});
    } catch (e) { 
      toast.error('Falha ao enviar comando.', {id: toastId}); 
    } finally { setLoadingCmd(false); }
  };

  const handleSelect = (d) => {
    if(!d.latitude) return toast.error('Sem localização GPS');
    setSelectedId(d.id);
    if(mapRef.current) mapRef.current.flyTo([d.latitude, d.longitude], 17, { duration: 1.5 });
  };

  const filtered = devices.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex bg-slate-100 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* --- SIDEBAR DE LISTA (ESQUERDA) --- */}
      <div className={`absolute left-4 top-4 bottom-4 z-[900] w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-2xl rounded-2xl flex flex-col transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        {/* Header da Lista */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-slate-800 dark:text-white">Minha Frota</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{filtered.length}</span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
            <input 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="Buscar placa ou nome..." 
              value={search} 
              onChange={e=>setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Lista de Veículos */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
          {filtered.map(d => (
            <div 
              key={d.id} 
              onClick={() => handleSelect(d)} 
              className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all border ${String(selectedId) === String(d.id) ? 'bg-blue-50 border-blue-500 shadow-md dark:bg-blue-900/20' : 'bg-white dark:bg-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-500 relative">
                  {d.attributes.ignition && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-slate-800"></div>}
                  {getVehicleImage(d) ? <img src={getVehicleImage(d)} className="w-full h-full object-contain"/> : <Truck size={18} className="text-slate-500 dark:text-slate-300"/>}
                </div>
                <div>
                  <span className="font-bold text-slate-700 dark:text-white text-sm block">{d.name}</span>
                  <span className={`text-[10px] font-bold uppercase ${d.status === 'online' ? 'text-green-600' : d.status === 'moving' ? 'text-blue-600' : 'text-red-500'}`}>{d.status}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300"/>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botões Flutuantes (Sidebar Toggle & Map Layer) */}
      {!sidebarOpen && <button onClick={()=>setSidebarOpen(true)} className="absolute left-4 top-4 z-[900] bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl text-blue-600 hover:scale-105 transition-transform"><ChevronRight size={24}/></button>}
      <div className="absolute right-4 top-4 z-[900]"><button onClick={()=>setMapStyle(mapStyle==='streets'?'satellite':'streets')} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl text-slate-600 dark:text-white hover:scale-105 transition-transform"><Layers size={24}/></button></div>

      {/* MAPA */}
      <MapContainer center={[-14.235, -51.925]} zoom={4} style={{width:'100%', height:'100%', zIndex:0}} zoomControl={false} ref={mapRef}>
        <TileLayer url={mapStyle==='streets'?"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png":"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"} attribution="FleetVision"/>
        <MapController selectedDevice={selectedDevice} devices={devices} />
        {trail.length > 0 && <Polyline positions={trail} color="#3b82f6" weight={5} opacity={0.7}/>}
        {filtered.map(d => (d.latitude) && <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createIcon(d)} eventHandlers={{click:()=>handleSelect(d)}}/>)}
      </MapContainer>

      {/* --- BOTTOM BAR (STATUS & COMANDOS) --- */}
      {selectedDevice && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[1000] p-4 flex flex-col md:flex-row gap-6 animate-in slide-in-from-bottom duration-300">
          
          {/* Info do Veículo */}
          <div className="flex items-center gap-4 border-r border-slate-100 dark:border-slate-700 pr-6 min-w-[200px]">
            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 relative flex-shrink-0">
               {getVehicleImage(selectedDevice) ? <img src={getVehicleImage(selectedDevice)} className="w-full h-full object-contain p-1"/> : <div className="w-full h-full flex items-center justify-center"><Truck size={32} className="text-slate-400"/></div>}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={selectedDevice.name}>{selectedDevice.name}</h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock size={10}/> {new Date(selectedDevice.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Grid de Status */}
          <div className="flex-1 flex gap-3 overflow-x-auto pb-2 md:pb-0 items-center">
            <StatItem icon={Gauge} label="Velocidade" value={Math.round(selectedDevice.speed * 1.852) + ' km/h'} color="text-blue-500"/>
            <StatItem icon={selectedDevice.attributes.ignition ? Zap : ZapOff} label="Ignição" value={selectedDevice.attributes.ignition ? 'LIGADA' : 'DESLIGADA'} color={selectedDevice.attributes.ignition ? 'text-amber-500' : 'text-slate-400'}/>
            <StatItem icon={Battery} label="Bateria" value={selectedDevice.attributes.power ? selectedDevice.attributes.power+' V' : '--'} color="text-green-500"/>
            <StatItem icon={Signal} label="Sats" value={selectedDevice.attributes.sat || 0} color="text-indigo-500"/>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col justify-center gap-2 min-w-[140px] border-l border-slate-100 dark:border-slate-700 pl-6">
             <div className="flex gap-2 w-full">
               <button disabled={loadingCmd} onClick={() => sendCmd('engineStop')} className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 py-2.5 rounded-lg font-bold text-xs flex justify-center items-center gap-1 border border-red-200 dark:border-red-900/30 transition-colors shadow-sm"><Lock size={14}/> BLOQ</button>
               <button disabled={loadingCmd} onClick={() => sendCmd('engineResume')} className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 py-2.5 rounded-lg font-bold text-xs flex justify-center items-center gap-1 border border-green-200 dark:border-green-900/30 transition-colors shadow-sm"><Unlock size={14}/> LIB</button>
             </div>
             <button onClick={() => setSelectedId(null)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center gap-1 mt-1 transition-colors"><X size={12}/> Fechar</button>
          </div>
        </div>
      )}

    </div>
  );
}
