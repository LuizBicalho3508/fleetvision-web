import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorage } from '../services/api';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    appName: 'FleetVision',
    logo: '',
    primaryColor: '#3b82f6',
    sidebarBg: '#1e293b'
  });

  useEffect(() => {
    getStorage('config').then(res => {
      if (res && res.system) {
        setConfig(prev => ({ ...prev, ...res.system }));
        // Aplicar Favicon Dinâmico
        if (res.system.logo) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          const logoUrl = res.system.logo.startsWith('http') || res.system.logo.startsWith('/') 
            ? res.system.logo 
            : `/storage/uploads/${res.system.logo}`;
          link.href = logoUrl;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        // Aplicar Título
        if (res.system.appName) {
          document.title = res.system.appName;
        }
      }
    }).catch(err => console.error("Erro config load:", err));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
