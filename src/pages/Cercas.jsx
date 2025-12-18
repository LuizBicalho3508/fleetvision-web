import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getGeofences, addGeofence, deleteGeofence } from '../services/api';
import { Map as MapIcon, Trash2, Save, Plus, AlertTriangle } from 'lucide-react';

// Fix Ícones Leaflet Draw
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize:[25,41], iconAnchor:[12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Cercas() {
  const [geofences, setGeofences] = useState([]);
  const [newFence, setNewFence] = useState(null); // Temporário ao desenhar
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { setGeofences(await getGeofences()); } catch(e){} };

  const handleCreated = (e) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0]; // Pega array de {lat, lng}
    setNewFence(latlngs);
    setIsModalOpen(true);
    // Remove do mapa visual imediatamente para não duplicar quando salvar e recarregar
    // (O banco é a fonte da verdade)
    // e.layer.remove(); // Comentado: deixamos o usuario ver o que desenhou enquanto preenche o form
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await addGeofence({ ...formData, area: newFence });
      alert('Cerca criada com sucesso!');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', color: '#3b82f6' });
      setNewFence(null);
      loadData();
      window.location.reload(); // Força limpar o mapa de desenho temporário
    } catch(e) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => { if(confirm('Excluir cerca?')) { await deleteGeofence(id); loadData(); } };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* SIDEBAR LISTA */}
      <div className="w-80 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 flex flex-col shrink-0">
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><MapIcon className="text-blue-500"/> Cercas Virtuais</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Desenhe áreas de controle no mapa.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {geofences.length === 0 && <div className="text-center py-8 text-slate-400 text-xs">Nenhuma cerca criada.</div>}
          {geofences.map(g => (
            <div key={g.id} className="p-3 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: g.color}}/>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{g.name}</span>
                </div>
                <button onClick={()=>handleDelete(g.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{g.description}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-xs text-yellow-800 dark:text-yellow-400 border-t border-yellow-100 dark:border-yellow-800 rounded-b-xl flex gap-2">
          <AlertTriangle size={16} className="shrink-0"/>
          <span>Use a barra de ferramentas no mapa para desenhar novas áreas (Polígonos).</span>
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <MapContainer center={[-14.2350, -51.9253]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          <FeatureGroup>
            <EditControl 
              position="topright" 
              onCreated={handleCreated} 
              draw={{ 
                rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false,
                polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: '#3b82f6' } }
              }} 
            />
          </FeatureGroup>

          {geofences.map(g => {
            try {
              const positions = JSON.parse(g.area); // Array de {lat, lng}
              // Leaflet Polygon espera array de [lat, lng]
              const poly = positions.map(p => [p.lat, p.lng]);
              return (
                <Polygon key={g.id} positions={poly} pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.2 }}>
                  <Popup><strong>{g.name}</strong><br/>{g.description}</Popup>
                </Polygon>
              );
            } catch(e) { return null; }
          })}
        </MapContainer>
      </div>

      {/* MODAL SALVAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border dark:border-slate-700 animate-in fade-in zoom-in">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Salvar Nova Cerca</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input required placeholder="Nome (Ex: Garagem)" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
              <input placeholder="Descrição" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} />
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Cor:</label>
                <input type="color" className="h-8 w-16 cursor-pointer rounded" value={formData.color} onChange={e=>setFormData({...formData, color:e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={()=>{setIsModalOpen(false); window.location.reload()}} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2 rounded text-slate-600 dark:text-slate-300">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
