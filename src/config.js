// Tenta ler do armazenamento local, se não existir, usa o padrão
const savedConfig = localStorage.getItem('fleetConfig');
const parsedConfig = savedConfig ? JSON.parse(savedConfig) : null;

export const systemConfig = {
  appName: parsedConfig?.appName || "FleetVision",
  logo: parsedConfig?.logo || "Truck", 
  
  theme: {
    sidebarBg: parsedConfig?.theme?.sidebarBg || "#0f172a",
    sidebarActive: parsedConfig?.theme?.sidebarActive || "#1e293b",
    primaryColor: parsedConfig?.theme?.primaryColor || "#3b82f6",
    logoColor: parsedConfig?.theme?.logoColor || "#3b82f6"
  }
};
