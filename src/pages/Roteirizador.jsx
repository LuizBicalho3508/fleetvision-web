import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, Plus, Trash2, Route, Clock, Truck, Calendar, Save, ArrowRight, Flag } from 'lucide-react';
import { searchAddress, calculateRoute, getDevices, saveSchedule } from '../services/api';

const startIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const endIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const midIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', iconSize: [25, 41], iconAnchor: [12, 41] });

const MapEvents = ({ onAddPoint }) => {
  useMapEvents({ click(e) { onAddPoint({ lat: e.latlng.lat, lng: e.latlng.lng, name: `Ponto (${e.latlng.lat.toFixed(4)})` }); } });
  return null;
};
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 15); }, [center]);
  return null;
};

export default function Roteirizador() {
  const [points, setPoints] = useState([]);
  const [addressInput, setAddressInput] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  
  const [devices, setDevices] = useState([]);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({ deviceId: '', routeName: '', scheduledStart: '', scheduledEnd: '', startTolerance: '15' });

  useEffect(() => { 
    getDevices()
      .then(setDevices)
      .catch(err => console.error("Erro ao carregar dispositivos:", err)); 
  }, []);

  const addPoint = (p) => { setPoints(prev => [...prev, p]); setMapCenter([p.lat, p.lng]); setRouteData(null); };
  
  const handleSearch = async () => {
    if (!addressInput) return; setLoading(true);
    try {
      const res = await searchAddress(addressInput);
      if (res && res.length) { addPoint({ lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon), name: res[0].display_name.split(',')[0] }); setAddressInput(''); }
      else alert('Endereço não encontrado.');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCalculateRoute = async () => {
    if (points.length < 2) return alert('Adicione pelo menos Origem e Destino.'); setLoading(true);
    try {
      const res = await calculateRoute(points);
      if (res && res.routes && res.routes.length) {
        setRouteData(res.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
        setRouteInfo({ distance: (res.routes[0].distance / 1000).toFixed(1), duration: Math.round(res.routes[0].duration / 60) });
      }
    } catch (e) { alert('Erro na rota.'); } finally { setLoading(false); }
  };
  
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleData.deviceId || !scheduleData.scheduledStart) return alert('Preencha os campos obrigatórios.');
    try {
      await saveSchedule(scheduleData);
      alert('Rota agendada com sucesso!'); setIsScheduleOpen(false);
    } catch (e) { 
      alert('Erro ao agendar: ' + (e.response?.data?.error || e.message)); 
    }
  };

  return (
    <div className="flex h-full gap-4 relative">
      {/* SIDEBAR */}
      <div className="w-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col z-10 h-[calc(100vh-8rem)]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Route className="text-blue-600"/> Planejador de Rotas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Desenhe o trajeto e agende a operação.</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <input className="flex-1 border dark:border-slate-600 p-2.5 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Buscar endereço..." value={addressInput} onChange={e=>setAddressInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
            <button onClick={handleSearch} disabled={loading} className="bg-slate-800 dark:bg-slate-700 text-white p-2.5 rounded-lg hover:bg-black dark:hover:bg-slate-600 transition-colors">{loading ? '...' : <Search size={20}/>}</button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-2 max-h-[300px]">
            {points.length === 0 && (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <MapPin size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">Adicione pontos no mapa<br/>ou busque acima.</p>
              </div>
            )}
            
            {points.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm group hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                <div className="flex flex-col items-center gap-1">
                  {i===0 ? <div className="bg-green-100 text-green-700 p-1 rounded-full"><Flag size={12}/></div> : i===points.length-1 ? <div className="bg-red-100 text-red-700 p-1 rounded-full"><Flag size={12}/></div> : <div className="w-2 h-2 rounded-full bg-blue-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{i===0?'Origem':i===points.length-1?'Destino':`Parada ${i}`}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={p.name}>{p.name}</p>
                </div>
                <button onClick={() => { setPoints(prev=>prev.filter((_,idx)=>idx!==i)); setRouteData(null); setRouteInfo(null); }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-xl space-y-3">
          {routeInfo && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Distância Total</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{routeInfo.distance} <span className="text-xs text-slate-500">km</span></p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo Estimado</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{routeInfo.duration} <span className="text-xs text-slate-500">min</span></p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
             <button onClick={handleCalculateRoute} disabled={points.length<2||loading} className="bg-white dark:bg-slate-800 border border-blue-600 text-blue-600 dark:text-blue-400 py-3 rounded-lg font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 flex justify-center gap-2 items-center text-sm">
               <Navigation size={16}/> Calcular
             </button>
             <button onClick={()=>setIsScheduleOpen(true)} disabled={!routeInfo} className="bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 flex justify-center gap-2 items-center text-sm">
               <Calendar size={16}/> Agendar
             </button>
          </div>
        </div>
      </div>
      
      {/* MAPA */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 relative z-0">
        <MapContainer center={[-14.2350, -51.9253]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap"/>
          <MapEvents onAddPoint={addPoint} />
          {mapCenter && <MapRecenter center={mapCenter} />}
          {routeData && <Polyline positions={routeData} color="#3b82f6" weight={6} opacity={0.8} />}
          {points.map((p, i) => <Marker key={i} position={[p.lat, p.lng]} icon={i===0?startIcon:i===points.length-1?endIcon:midIcon}><Popup>{p.name}</Popup></Marker>)}
        </MapContainer>
      </div>

      {/* MODAL COM Z-INDEX MÁXIMO (FIX TELA TRAVADA) */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
            <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-white flex items-center gap-2"><Calendar className="text-blue-600"/> Agendar Execução</h3>
            <form onSubmit={handleSaveSchedule} className="space-y-5">
              <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Nome da Rota</label><input required className="w-full border dark:border-slate-600 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={scheduleData.routeName} onChange={e=>setScheduleData({...scheduleData, routeName:e.target.value})} placeholder="Ex: Entrega Zona Norte"/></div>
              <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Veículo Responsável</label><select className="w-full border dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={scheduleData.deviceId} onChange={e=>setScheduleData({...scheduleData, deviceId:e.target.value})}><option value="">Selecione...</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Saída Prevista</label><input required type="datetime-local" className="w-full border dark:border-slate-600 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={scheduleData.scheduledStart} onChange={e=>setScheduleData({...scheduleData, scheduledStart:e.target.value})}/></div>
                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Chegada Prevista</label><input required type="datetime-local" className="w-full border dark:border-slate-600 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={scheduleData.scheduledEnd} onChange={e=>setScheduleData({...scheduleData, scheduledEnd:e.target.value})}/></div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800"><label className="text-xs font-bold text-amber-700 dark:text-amber-500 block mb-1">Tolerância de Atraso (min)</label><input type="number" className="w-full border border-amber-300 dark:border-amber-700 p-2 rounded-lg text-sm text-amber-900 dark:text-amber-400 font-bold bg-white dark:bg-slate-900" value={scheduleData.startTolerance} onChange={e=>setScheduleData({...scheduleData, startTolerance:e.target.value})}/><p className="text-[10px] text-amber-600 dark:text-amber-500/80 mt-1">Atrasos maiores gerarão alertas e penalidade no ranking.</p></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setIsScheduleOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-3 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700">Confirmar Agendamento</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
