import React, { useState, useEffect, useRef } from 'react';
import { getDevices, getTrips, getRoute } from '../services/api';
import { 
  Clock, Search, Calendar, MapPin, Play, Square, 
  Timer, Truck, Navigation, Map as MapIcon, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { startOfDay, endOfDay, formatISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- COMPONENTES AUXILIARES ---

// Ajusta o zoom do mapa para caber a rota
const FitBounds = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
};

// Card de Estatística (KPI)
const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-all hover:shadow-md group">
    <div className="flex justify-between items-start z-10 relative">
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-xl font-black text-slate-800 dark:text-white">{value}</h3>
        {subtext && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${colorClass} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

export default function Jornada() {
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  
  // Data local correta
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });
  
  const [jornadaData, setJornadaData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal de Mapa
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [tripRoute, setTripRoute] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => { 
    getDevices().then(setDevices).catch(() => toast.error('Erro ao carregar veículos')); 
  }, []);

  const handleSearch = async () => {
    if(!selectedId) return toast.error('Selecione um veículo');
    
    setLoading(true);
    setJornadaData(null);
    setCurrentPage(1); // Resetar página ao buscar
    
    try {
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);

      const from = formatISO(startOfDay(localDate));
      const to = formatISO(endOfDay(localDate));
      
      const trips = await getTrips(selectedId, from, to);
      
      // Cálculos
      const totalMs = trips.reduce((acc, trip) => acc + trip.duration, 0);
      const totalDist = trips.reduce((acc, trip) => acc + trip.distance, 0);
      
      const h = Math.floor(totalMs / 3600000);
      const min = Math.floor((totalMs % 3600000) / 60000);
      
      setJornadaData({
        totalTime: `${h}h ${min}m`,
        totalKm: (totalDist / 1000).toFixed(1),
        tripsCount: trips.length,
        firstStart: trips.length > 0 ? new Date(trips[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
        lastStop: trips.length > 0 ? new Date(trips[trips.length-1].endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
        details: trips
      });
      
      if(trips.length > 0) toast.success(`${trips.length} trechos encontrados!`);
      else toast('Nenhuma atividade encontrada nesta data.');

    } catch(e) { 
      toast.error('Erro ao calcular jornada.');
    } finally { 
      setLoading(false); 
    }
  };

  const handleViewRoute = async (trip) => {
    setIsMapOpen(true);
    setLoadingRoute(true);
    setTripRoute([]);
    try {
      const routeData = await getRoute(selectedId, trip.startTime, trip.endTime);
      if(routeData && Array.isArray(routeData) && routeData.length > 0) {
        setTripRoute(routeData);
      } else {
        toast.error('Sem dados de GPS para este trecho.');
      }
    } catch(e) {
      toast.error('Erro ao carregar rota.');
    } finally {
      setLoadingRoute(false);
    }
  };

  // Lógica de Paginação
  const paginatedDetails = jornadaData ? jornadaData.details.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  const totalPages = jornadaData ? Math.ceil(jornadaData.details.length / itemsPerPage) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] space-y-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="text-blue-600"/> Controle de Jornada
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Auditoria de tempo e deslocamento diário</p>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-end shrink-0">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Veículo</label>
          <div className="relative">
            <Truck className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            <select 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={selectedId} 
              onChange={e=>setSelectedId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            <input 
              type="date" 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={date} 
              onChange={e=>setDate(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={handleSearch} 
          disabled={loading} 
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? 'Calculando...' : <><Search size={16}/> Buscar</>}
        </button>
      </div>

      {jornadaData && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <StatCard title="Tempo Total" value={jornadaData.totalTime} icon={Timer} colorClass="bg-blue-600" />
            <StatCard title="Distância" value={`${jornadaData.totalKm} km`} icon={Navigation} colorClass="bg-emerald-500" />
            <StatCard title="Primeira Ignição" value={jornadaData.firstStart} icon={Play} colorClass="bg-indigo-500" />
            <StatCard title="Último Desligamento" value={jornadaData.lastStop} icon={Square} colorClass="bg-rose-500" />
          </div>

          {/* Tabela Detalhada com Scroll e Paginação */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-slate-700 dark:text-white">Detalhamento dos Trechos</h3>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="p-3 pl-6">Seq</th>
                    <th className="p-3">Início</th>
                    <th className="p-3">Fim</th>
                    <th className="p-3">Duração</th>
                    <th className="p-3">Distância</th>
                    <th className="p-3">Vel. Média</th>
                    <th className="p-3 text-right pr-6">Rota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paginatedDetails.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 pl-6 font-mono text-slate-400">#{((currentPage-1)*itemsPerPage) + i + 1}</td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                        {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {new Date(t.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                          {Math.floor(t.duration/60000)} min
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-white">
                        {(t.distance / 1000).toFixed(1)} km
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        {Math.round(t.averageSpeed * 1.852)} km/h
                      </td>
                      <td className="p-3 text-right pr-6">
                        <button 
                          onClick={() => handleViewRoute(t)}
                          className="bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 p-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-600" 
                          title="Ver Rota no Mapa"
                        >
                          <MapIcon size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé de Paginação */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-500">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft size={16} className="dark:text-white"/>
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight size={16} className="dark:text-white"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DO MAPA */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapIcon className="text-blue-600" size={20}/> Detalhes do Trecho
              </h3>
              <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={20} className="dark:text-white"/>
              </button>
            </div>
            
            <div className="flex-1 relative bg-slate-100">
              {loadingRoute ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">Carregando trajeto...</p>
                </div>
              ) : (
                <MapContainer center={[-14.235, -51.925]} zoom={4} style={{width:'100%', height:'100%'}}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  {tripRoute.length > 0 && (
                    <>
                      <Polyline positions={tripRoute.map(p=>[p.latitude, p.longitude])} color="#3b82f6" weight={5}/>
                      <Marker position={[tripRoute[0].latitude, tripRoute[0].longitude]} icon={L.divIcon({html: '<div class="w-3 h-3 bg-green-500 rounded-full border border-white shadow"></div>', className: 'bg-transparent'})}/>
                      <Marker position={[tripRoute[tripRoute.length-1].latitude, tripRoute[tripRoute.length-1].longitude]} icon={L.divIcon({html: '<div class="w-3 h-3 bg-red-500 rounded-full border border-white shadow"></div>', className: 'bg-transparent'})}/>
                      <FitBounds route={tripRoute} />
                    </>
                  )}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
