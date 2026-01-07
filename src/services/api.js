import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.auth = { username: token, password: '' }; 
  return config;
});

// --- AUTH ---
export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('password', password);
  return api.post('/session', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(r => r.data);
};

// --- TRACCAR CORE ---
export const getDevices = async () => api.get('/devices').then(r => r.data);
export const addDevice = async (data) => api.post('/devices', data).then(r => r.data);
export const updateDevice = async (id, data) => api.put(`/devices/${id}`, data).then(r => r.data);
export const deleteDevice = async (id) => api.delete(`/devices/${id}`).then(r => r.data);
export const getPositions = async () => api.get('/positions').then(r => r.data);
export const sendCommand = async (deviceId, type, attributes = {}) => api.post('/commands/send', { deviceId, type, attributes }).then(r => r.data);

// --- RELATÓRIOS & RANKING ---
export const getEvents = async (from, to) => api.get(`/reports/events?from=${from}&to=${to}`).then(r => r.data);
export const getRoute = async (deviceId, from, to) => api.get(`/reports/route?deviceId=${deviceId}&from=${from}&to=${to}`).then(r => r.data);
export const getSummary = async (deviceId, from, to) => api.get(`/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`).then(r => r.data);
export const getTrips = async (deviceId, from, to) => api.get(`/reports/trips?deviceId=${deviceId}&from=${from}&to=${to}`).then(r => r.data);
export const getStops = async (deviceId, from, to) => api.get(`/reports/stops?deviceId=${deviceId}&from=${from}&to=${to}`).then(r => r.data);

// Função para Ranking (Alias para getEvents, pois o ranking usa eventos para pontuar)
export const getCustomEvents = getEvents; 

// --- ADMIN ---
export const getServerStatus = async () => api.get('/monitor/stats').then(r => r.data);

// --- ESTOQUE ---
export const getTrackerStock = async () => axios.get('/storage/trackers').then(r => r.data);
export const addTrackerStock = async (data) => axios.post('/storage/trackers', data).then(r => r.data);
export const updateTrackerStock = async (id, data) => axios.put('/storage/trackers/' + id, data).then(r => r.data);
export const deleteTrackerStock = async (id) => axios.delete('/storage/trackers/' + id).then(r => r.data);

// --- ALERTAS ---
export const getAlertRules = async () => axios.get('/storage/alerts').then(r => r.data).catch(() => []);
export const saveAlertRules = async (data) => axios.post('/storage/alerts', data).then(r => r.data);

// --- MANUTENÇÃO (Previne erro futuro) ---
export const getMaintenances = async () => axios.get('/storage/maintenance').then(r => r.data).catch(() => []);
export const addMaintenance = async (data) => axios.post('/storage/maintenance', data).then(r => r.data);
export const updateMaintenance = async (id, data) => axios.put('/storage/maintenance/' + id, data).then(r => r.data);
export const deleteMaintenance = async (id) => axios.delete('/storage/maintenance/' + id).then(r => r.data);

// --- FINANCEIRO (Previne erro futuro) ---
export const getExpenses = async () => axios.get('/storage/finance').then(r => r.data).catch(() => []);
export const addExpense = async (data) => axios.post('/storage/finance', data).then(r => r.data);
export const updateExpense = async (id, data) => axios.put('/storage/finance/' + id, data).then(r => r.data);
export const deleteExpense = async (id) => axios.delete('/storage/finance/' + id).then(r => r.data);

// --- CONFIG ---
export const getStorage = async (key) => axios.get(`/storage/settings/${key}`).then(r => r.data).catch(() => null);
export const updateStorage = async (key, value) => axios.post('/storage/settings', { key, value }).then(r => r.data);
export const saveStorage = updateStorage;
export const uploadFile = async (formData) => new Promise(r => setTimeout(() => r({ url: '#' }), 500));

export default api;
