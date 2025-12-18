import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getRoute, getDevices } from '../services/api';
import { 
  Play, Pause, RotateCcw, FastForward, Calendar, Clock, 
  MapPin, Navigation, Truck, Search, ChevronRight 
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-hot-toast';

// --- HELPERS ---
const getVehicleImage = (d) => d?.attributes?.customIconUrl || d?.attributes?.vehicleImage || d?.attributes?.iconUrl || null;

const MoveCar = ({ route, index, vehicle }) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (route[index] && markerRef.current) {
      // Pan suave para seguir o carro
      map.panTo([route[index].latitude, route[index].longitude], { animate: true, duration: 0.5 });
    }
  }, [index, route, map]);
  
  if (!route[index]) return null;

  const point = route[index];
  const rotation = point.course || 0;
  const img = getVehicleImage(vehicle);
  
  // Estilo de Rotação
  const rotStyle = `transform: rotate(${rotation}deg); transition: transform 0.2s linear; display: block;`;
  
  let iconHtml;
  if(img) {
    iconHtml = `<div style="${rotStyle} width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><img src="${img}" style="width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.4));"/></div>`;
  } else {
    const color = point.speed > 0 ? '#3b82f6' : '#ef4444';
    iconHtml = `<div style="${rotStyle} width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" style="width:40px; height:40px; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.4));"><path d="M12 2L2 22L12 18L22 22L12 2Z"/></svg></div>`;
  }

  const icon = L.divIcon({ className: 'bg-transparent', html: iconHtml, iconSize: [48, 48], iconAnchor: [24, 24] });

  return <Marker ref={markerRef} position={[point.latitude, point.longitude]} icon={icon} zIndexOffset={1000} />;
};

// Componente para Ajustar Zoom na Rota
const FitBounds = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
};

export default function Replay() {
  const [route, setRoute] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  
  // Datas Padrão (Hoje 00:00 até Agora)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  
  // Ajuste para formato do input datetime-local (YYYY-MM-DDTHH:MM)
  const formatDateTime = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [from, setFrom] = useState(formatDateTime(startOfDay));
  const [to, setTo] = useState(formatDateTime(now));
  
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // Multiplicador de velocidade (1x, 2x, etc)

  // Estatísticas da Rota
  const stats = useMemo(() => {
    if (!route.length) return { distance: 0, maxSpeed: 0, duration: 0 };
    let maxSpeed = 0;
    let distance = 0; // Aproximação ou pegar do servidor se disponível
    
    // Cálculo simples de stats
    route.forEach(p => {
      if (p.speed > maxSpeed) maxSpeed = p.speed;
      if (p.attributes?.totalDistance) distance = p.attributes.totalDistance; // Se tiver odômetro
    });
    
    // Se não tiver odômetro, calcular distância euclidiana (simplificado) ou pegar do endpoint de summary
    // Por enquanto, vamos usar velocidade máxima e duração
    const startTime = new Date(route[0].serverTime);
    const endTime = new Date(route[route.length - 1].serverTime);
    const duration = (endTime - startTime) / 1000 / 60; // minutos

    return { maxSpeed: Math.round(maxSpeed * 1.852), duration: Math.round(duration) };
  }, [route]);

  useEffect(() => { getDevices().then(setDevices).catch(()=>{}); }, []);

  // Loop do Player
  useEffect(() => {
    let interval;
    if (playing && index < route.length - 1) {
      // A velocidade do intervalo diminui conforme o multiplicador aumenta
      // Base: 500ms entre pontos. Speed 2x -> 250ms.
      const intervalMs = 500 / speed; 
      interval = setInterval(() => {
        setIndex(prev => {
          if (prev >= route.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (index >= route.length - 1) {
      setPlaying(false);
    }
    return () => clearInterval(interval);
  }, [playing, index, route, speed]);

  const handleSearch = async () => {
    if(!selectedId) return toast.error('Selecione um veículo');
    setLoading(true); setPlaying(false); setIndex(0); setRoute([]);
    try {
      const data = await getRoute(selectedId, new Date(from).toISOString(), new Date(to).toISOString());
      if(data && Array.isArray(data) && data.length > 0) {
        setRoute(data);
        toast.success(`Rota carregada: ${data.length} pontos`);
      } else {
        toast.error('Nenhuma rota encontrada neste período.');
        setRoute([]);
      }
    } catch(e) { toast.error('Erro ao buscar rota'); } 
    finally { setLoading(false); }
  };

  const selectedVehicle = devices.find(d => String(d.id) === String(selectedId));
  const currentPoint = route[index];

  // Alternar Velocidade
  const toggleSpeed = () => {
    const speeds = [1, 2, 5, 10];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex bg-slate-100 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR DE CONFIGURAÇÃO (FIXA NA ESQUERDA) */}
      <div className="absolute left-4 top-4 bottom-4 z-[1000] w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl rounded-2xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Navigation className="text-blue-600" size={20}/> Replay de Rota
          </h2>
          <p className="text-xs text-slate-500 mt-1">Histórico de deslocamento</p>
        </div>

        {/* Formulário */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Truck size={14}/> Veículo</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={selectedId} 
              onChange={e=>setSelectedId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Calendar size={14}/> Início</label>
            <input 
              type="datetime-local" 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={from} 
              onChange={e=>setFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Clock size={14}/> Fim</label>
            <input 
              type="datetime-local" 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={to} 
              onChange={e=>setTo(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSearch} 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Search size={18}/>}
            {loading ? 'Carregando...' : 'Buscar Rota'}
          </button>

          {/* Resumo da Rota Carregada */}
          {route.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">Resumo da Viagem</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Duração</p>
                  <p className="font-bold text-slate-700 dark:text-white">{stats.duration} min</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Vel. Máxima</p>
                  <p className="font-bold text-slate-700 dark:text-white">{stats.maxSpeed} km/h</p>
                </div>
                <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Pontos GPS</p>
                  <p className="font-bold text-slate-700 dark:text-white">{route.length} registros</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MAPA */}
      <MapContainer center={[-14.235, -51.925]} zoom={4} style={{width:'100%', height:'100%', zIndex:0}} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {route.length > 0 && <Polyline positions={route.map(p=>[p.latitude, p.longitude])} color="#3b82f6" weight={5} opacity={0.7}/>}
        {/* Marcadores de Início e Fim */}
        {route.length > 0 && (
          <>
            <Marker position={[route[0].latitude, route[0].longitude]} icon={L.divIcon({html: '<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>', className: 'bg-transparent'})} />
            <Marker position={[route[route.length-1].latitude, route[route.length-1].longitude]} icon={L.divIcon({html: '<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>', className: 'bg-transparent'})} />
          </>
        )}
        <FitBounds route={route} />
        <MoveCar route={route} index={index} vehicle={selectedVehicle} />
      </MapContainer>

      {/* --- PLAYER FLUTUANTE (BOTTOM BAR) --- */}
      {route.length > 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-3xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[1000] p-4 flex flex-col gap-2 animate-in slide-in-from-bottom duration-500">
          
          {/* Info Line */}
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Momento</p>
              <p className="text-sm font-mono font-bold text-slate-700 dark:text-white">
                {currentPoint ? new Date(currentPoint.serverTime).toLocaleString() : '--/--/-- --:--'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Velocidade</p>
              <p className="text-xl font-bold text-blue-600">
                {currentPoint ? Math.round(currentPoint.speed * 1.852) : 0} <span className="text-sm text-slate-500">km/h</span>
              </p>
            </div>
          </div>

          {/* Slider */}
          <input 
            type="range" 
            min="0" 
            max={route.length - 1} 
            value={index} 
            onChange={(e) => { setIndex(parseInt(e.target.value)); setPlaying(false); }}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
          />

          {/* Controls */}
          <div className="flex justify-center items-center gap-6 mt-1">
            <button onClick={() => { setIndex(0); setPlaying(true); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" title="Reiniciar">
              <RotateCcw size={20}/>
            </button>
            
            <button 
              onClick={() => setPlaying(!playing)} 
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 transition-all hover:scale-105 active:scale-95"
            >
              {playing ? <Pause size={28} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
            </button>

            <button 
              onClick={toggleSpeed} 
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="Velocidade de Reprodução"
            >
              <FastForward size={14}/> {speed}x
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
