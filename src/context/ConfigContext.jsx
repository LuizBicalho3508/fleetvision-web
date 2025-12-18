import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorage } from '../services/api';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    appName: 'FleetVision',
    primaryColor: '#3b82f6',
    sidebarBg: '#1e293b',
    theme: { mode: 'light' }
  });

  useEffect(() => {
    // 1. Carrega tema salvo
    const localTheme = localStorage.getItem('themeMode');
    if (localTheme) {
      if(localTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      setConfig(prev => ({ ...prev, theme: { mode: localTheme } }));
    }

    // 2. Carrega do servidor
    getStorage('config').then(res => {
      if (res && res.system) {
        setConfig(prev => ({ 
          ...prev, 
          ...res.system,
          // Mantém preferência local de tema se existir, senão usa do servidor
          theme: { mode: localTheme || res.system.theme?.mode || 'light' } 
        }));
      }
    }).catch(() => {});
  }, []);

  const updateConfig = (newConfig) => {
    setConfig(newConfig);
    // Salva tema localmente
    if (newConfig.theme?.mode) {
      localStorage.setItem('themeMode', newConfig.theme.mode);
      if (newConfig.theme.mode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ConfigContext.Provider value={{ config, setConfig: updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
