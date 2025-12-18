import axios from 'axios';

const api = axios.create({ baseURL: '/' });

export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('password', password);
  return api.post('/api/session', params).then(r => r.data);
};
export const getSession = async () => api.get('/api/session').then(r => r.data);
export const deleteSession = async () => api.delete('/api/session').then(r => r.data);

export const getDevices = async () => api.get('/api/devices').then(r => r.data);
export const addDevice = async (data) => api.post('/api/devices', data).then(r => r.data);
export const updateDevice = async (id, data) => api.put('/api/devices/' + id, data).then(r => r.data);
export const deleteDevice = async (id) => api.delete('/api/devices/' + id).then(r => r.data);
export const getPositions = async () => api.get('/api/positions').then(r => r.data);

export const sendCommand = async (deviceId, type, attributes = {}) => {
  return api.post('/api/commands/send', { 
    deviceId: parseInt(deviceId), 
    type: type, 
    attributes: attributes || {} 
  }).then(r => r.data);
};

export const getDrivers = async () => api.get('/api/drivers').then(r => r.data);
export const addDriver = async (data) => api.post('/api/drivers', data).then(r => r.data);
export const updateDriver = async (id, data) => api.put('/api/drivers/' + id, data).then(r => r.data);
export const deleteDriver = async (id) => api.delete('/api/drivers/' + id).then(r => r.data);

export const getUsers = async () => api.get('/api/users').then(r => r.data);
export const addUser = async (data) => api.post('/api/users', data).then(r => r.data);
export const updateUser = async (id, data) => api.put('/api/users/' + id, data).then(r => r.data);
export const deleteUser = async (id) => api.delete('/api/users/' + id).then(r => r.data);

// --- CORREÇÃO CRÍTICA: USAR /api/devices PARA PEGAR VÍNCULOS ---
// Antes estava /api/permissions, que o Traccar bloqueiava ou retornava 405 no GET
export const getUserDevices = async (userId) => api.get('/api/devices?userId=' + userId).then(r => r.data);

export const linkDeviceToUser = async (userId, deviceId) => api.post('/api/permissions', { userId, deviceId }).then(r => r.data);
export const unlinkDeviceFromUser = async (userId, deviceId) => api.delete('/api/permissions', { data: { userId, deviceId } }).then(r => r.data);

export const getGeofences = async () => api.get('/api/geofences').then(r => r.data);
export const addGeofence = async (data) => api.post('/api/geofences', data).then(r => r.data);
export const updateGeofence = async (id, data) => api.put('/api/geofences/' + id, data).then(r => r.data);
export const deleteGeofence = async (id) => api.delete('/api/geofences/' + id).then(r => r.data);

export const getSummary = async (deviceId, from, to) => api.get(`/api/reports/summary?deviceId=${Array.isArray(deviceId)?deviceId.join('&deviceId='):deviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.data);
export const getRoute = async (deviceId, from, to) => api.get(`/api/reports/route?deviceId=${Array.isArray(deviceId)?deviceId.join('&deviceId='):deviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.data);
export const getEvents = async (from, to) => api.get(`/api/reports/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.data);
export const getTrips = async (deviceId, from, to) => api.get(`/api/reports/trips?deviceId=${Array.isArray(deviceId)?deviceId.join('&deviceId='):deviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.data);
export const getStops = async (deviceId, from, to) => api.get(`/api/reports/stops?deviceId=${Array.isArray(deviceId)?deviceId.join('&deviceId='):deviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.data);

export const searchAddress = async (query) => axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`).then(r => r.data);
export const calculateRoute = async (coordinates) => axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`).then(r => r.data);
export const saveSchedule = async (data) => api.post('/storage/route_schedules', data).then(r => r.data);
export const getSchedules = async () => api.get('/storage/route_schedules').then(r => r.data);
export const deleteSchedule = async (id) => api.delete('/storage/route_schedules/' + id).then(r => r.data);

export const getMaintPlans = async () => api.get('/storage/maint_plans').then(r => r.data);
export const addMaintPlan = async (data) => api.post('/storage/maint_plans', data).then(r => r.data);
export const deleteMaintPlan = async (id) => api.delete('/storage/maint_plans/' + id).then(r => r.data);
export const getMaintLogs = async () => api.get('/storage/maint_logs').then(r => r.data);
export const addMaintLog = async (data) => api.post('/storage/maint_logs', data).then(r => r.data);
export const deleteMaintLog = async (id) => api.delete('/storage/maint_logs/' + id).then(r => r.data);
export const getChecklists = async () => api.get('/storage/checklists').then(r => r.data);
export const saveChecklist = async (data) => api.post('/storage/checklists', data).then(r => r.data);
export const deleteChecklist = async (id) => api.delete('/storage/checklists/' + id).then(r => r.data);
export const getChecklistTemplates = async () => api.get('/storage/checklist_templates').then(r => r.data);
export const saveChecklistTemplate = async (data) => api.post('/storage/checklist_templates', data).then(r => r.data);
export const getClients = async () => api.get('/storage/clients').then(r => r.data);
export const addClient = async (data) => api.post('/storage/clients', data).then(r => r.data);
export const deleteClient = async (id) => api.delete('/storage/clients/' + id).then(r => r.data);
export const saveStorage = async (key, data) => api.post('/storage/' + key, data).then(r => r.data);
export const getStorage = async (key) => api.get('/storage/' + key).then(r => r.data);
export const uploadFile = async (formData) => api.post('/storage/upload', formData).then(r => r.data);
export const getCustomEvents = async () => api.get('/storage/custom_events').then(r => r.data);
export const getAlertRules = async () => api.get('/storage/alert_rules').then(r => r.data);
export const saveAlertRules = async (data) => api.post('/storage/alert_rules', data).then(r => r.data);
export const getCustomIcons = async () => api.get('/storage/icons').then(r => r.data);
export const addCustomIcon = async (name, url) => api.post('/storage/icons', { name, url }).then(r => r.data);
export const deleteCustomIcon = async (id) => api.delete('/storage/icons/' + id).then(r => r.data);
export const getProfiles = async () => api.get('/storage/profiles').then(r => r.data);
export const addProfile = async (data) => api.post('/storage/profiles', data).then(r => r.data);
export const updateProfile = async (id, data) => api.put('/storage/profiles/' + id, data).then(r => r.data);
export const deleteProfile = async (id) => api.delete('/storage/profiles/' + id).then(r => r.data);
export const getUserPermissions = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if(user.administrator) return ['all'];
  return [];
};
export const asaasListCustomers = async () => api.get('/storage/asaas/customers').then(r => r.data);
export const asaasCreateCustomer = async (data) => api.post('/storage/asaas/customers', data).then(r => r.data);
export const asaasGetPayments = async (customer, params) => api.get('/storage/asaas/payments', { params }).then(r => r.data);
export const getWhatsappStatus = async () => api.get('/notifications/status').then(r => r.data);
export const getWhatsappQr = async () => api.get('/notifications/qrcode').then(r => r.data);
export const sendNotificationTest = async (msg) => api.post('/notifications/test', { message: msg }).then(r => r.data);
export const getServerStatus = async () => api.get('/storage/status').then(r => r.data);

export default api;
