import React, { useState, useEffect, useMemo } from 'react';
import { getSummary, getTrips, getStops, getEvents, getDevices } from '../services/api';
import { 
  FileText, Search, Calendar, Download, Loader2, MapPin, 
  Navigation, Clock, AlertTriangle, Truck, BarChart3, Gauge 
} from 'lucide-react';
import { formatISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';

const KPICard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-full ${colorClass} text-white shadow-md`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4"><FileText size={48}/></div>
    <p className="font-bold text-lg">Nenhum relatório gerado</p>
  </div>
);

export default function Relatorios() {
  const [type, setType] = useState('summary');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [dateFrom, setDateFrom] = useState(formatISO(startOfDay(new Date())).slice(0,16));
  const [dateTo, setDateTo] = useState(formatISO(endOfDay(new Date())).slice(0,16));

  useEffect(() => { getDevices().then(setDevices).catch(()=>{}); }, []);

  const handleGenerate = async () => {
    if (type !== 'events' && !selectedDevice) return toast.error('Selecione um veículo!');
    setLoading(true); setData([]);
    try {
      const from = new Date(dateFrom).toISOString();
      const to = new Date(dateTo).toISOString();
      let res = [];
      if(type === 'summary') res = await getSummary(selectedDevice, from, to);
      else if(type === 'trips') res = await getTrips(selectedDevice, from, to);
      else if(type === 'stops') res = await getStops(selectedDevice, from, to);
      else if(type === 'events') res = await getEvents(from, to); 
      const finalData = Array.isArray(res) ? res : [res];
      setData(finalData);
      if(finalData.length > 0) toast.success(`${finalData.length} registros!`); else toast('Sem dados.');
    } catch (e) { toast.error('Erro ao gerar relatório.'); } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    if (!data.length) return null;
    if (type === 'summary') {
      const totalDist = data.reduce((acc, curr) => acc + (curr.distance || 0), 0);
      const maxSpeed = Math.max(...data.map(d => d.maxSpeed || 0));
      return [
        { title: 'Distância Total', value: (totalDist / 1000).toFixed(2) + ' km', icon: Navigation, colorClass: 'bg-blue-600' },
        { title: 'Velocidade Max', value: (maxSpeed * 1.852).toFixed(0) + ' km/h', icon: Gauge, colorClass: 'bg-red-500' },
        { title: 'Média de Consumo', value: '--', icon: Truck, colorClass: 'bg-green-500' }
      ];
    }
    if (type === 'trips') {
      const totalTrips = data.length;
      const totalDuration = data.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      return [
        { title: 'Total Viagens', value: totalTrips, icon: Navigation, colorClass: 'bg-blue-600' },
        { title: 'Duração Total', value: (totalDuration / 1000 / 60 / 60).toFixed(1) + ' h', icon: Clock, colorClass: 'bg-purple-500' },
        { title: 'Média/Viagem', value: (totalDuration / totalTrips / 1000 / 60).toFixed(0) + ' min', icon: BarChart3, colorClass: 'bg-orange-500' }
      ];
    }
    if (type === 'stops') {
      const totalStops = data.length;
      const totalTime = data.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      return [
        { title: 'Total Paradas', value: totalStops, icon: MapPin, colorClass: 'bg-red-500' },
        { title: 'Tempo Parado', value: (totalTime / 1000 / 60 / 60).toFixed(1) + ' h', icon: Clock, colorClass: 'bg-slate-500' }
      ];
    }
    return null;
  }, [data, type]);

  const tabs = [
    { id: 'summary', label: 'Resumo', icon: FileText },
    { id: 'trips', label: 'Viagens', icon: Navigation },
    { id: 'stops', label: 'Paradas', icon: MapPin },
    { id: 'events', label: 'Eventos', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><BarChart3 className="text-blue-600"/> Relatórios</h1>
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">{tabs.map(tab => (<button key={tab.id} onClick={() => setType(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><tab.icon size={16}/> {tab.label}</button>))}</div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Veículo</label><select className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" value={selectedDevice} onChange={e=>setSelectedDevice(e.target.value)}><option value="">Selecione...</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div className="min-w-[160px]"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Início</label><input type="datetime-local" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></div>
        <div className="min-w-[160px]"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fim</label><input type="datetime-local" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></div>
        <button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg flex gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin"/> : <Search size={20}/>} Gerar</button>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {stats && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4">{stats.map((stat, i) => <KPICard key={i} {...stat} />)}</div>}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {!data.length ? <EmptyState /> : (
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 border-b dark:border-slate-700">
                  <tr>
                    {type==='summary' && <><th className="p-4">Veículo</th><th className="p-4">Distância</th><th className="p-4">Vel. Max</th><th className="p-4">Média</th><th className="p-4">Motor</th></>}
                    {type==='trips' && <><th className="p-4">Início</th><th className="p-4">Fim</th><th className="p-4">Duração</th><th className="p-4">Distância</th><th className="p-4">Vel. Média</th></>}
                    {type==='stops' && <><th className="p-4">Início</th><th className="p-4">Duração</th><th className="p-4">Motor</th><th className="p-4">Endereço</th></>}
                    {type==='events' && <><th className="p-4">Data/Hora</th><th className="p-4">Tipo</th><th className="p-4">Veículo</th><th className="p-4">Dados</th></>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      {type==='summary' && <><td className="p-4 font-bold">{item.deviceName}</td><td className="p-4 text-blue-600 font-bold">{(item.distance/1000).toFixed(2)} km</td><td className="p-4">{(item.maxSpeed*1.852).toFixed(0)} km/h</td><td className="p-4">{(item.averageSpeed*1.852).toFixed(0)} km/h</td><td className="p-4">{(item.engineHours/1000/60/60).toFixed(1)} h</td></>}
                      {type==='trips' && <><td className="p-4">{new Date(item.startTime).toLocaleString()}</td><td className="p-4">{new Date(item.endTime).toLocaleString()}</td><td className="p-4">{(item.duration/1000/60).toFixed(0)} min</td><td className="p-4 text-blue-600">{(item.distance/1000).toFixed(2)} km</td><td className="p-4">{(item.averageSpeed*1.852).toFixed(0)} km/h</td></>}
                      {type==='stops' && <><td className="p-4">{new Date(item.startTime).toLocaleString()}</td><td className="p-4 text-red-500 font-bold">{(item.duration/1000/60).toFixed(0)} min</td><td className="p-4">{item.engineHours>0?'Ligado':'Desligado'}</td><td className="p-4 text-xs truncate max-w-xs">{item.address||'-'}</td></>}
                      {type==='events' && <><td className="p-4">{new Date(item.eventTime).toLocaleString()}</td><td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold">{item.type}</span></td><td className="p-4">{devices.find(d=>d.id===item.deviceId)?.name}</td><td className="p-4 text-xs font-mono text-slate-500">{JSON.stringify(item.attributes)}</td></>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
