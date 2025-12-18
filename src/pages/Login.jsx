import React, { useState, useCallback } from 'react';
import { login } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { Truck, ArrowRight, Loader2 } from 'lucide-react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function Login() {
  const { config } = useConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      localStorage.setItem('isAuthenticated', 'true');
      window.location.href = '/dashboard';
    } catch (err) {
      alert('Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  // Configuração do Fundo Animado (Particles)
  const particlesOptions = {
    background: { color: { value: "#0f172a" } }, // Fundo Slate-900 base
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" },
        resize: true,
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 100, duration: 0.4 },
      },
    },
    particles: {
      color: { value: "#3b82f6" }, // Azul FleetVision
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.2,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: 1,
        straight: false,
      },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 0.5 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      
      {/* 1. FUNDO PARTICLES (Prioridade 0) */}
      <div className="absolute inset-0 z-0">
        <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
      </div>

      {/* 2. FUNDO IMAGEM (Opcional, com overlay, se configurado) */}
      {config.theme?.loginBg && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${config.theme.loginBg})` }}
        />
      )}

      {/* 3. CARD DE LOGIN */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 relative z-10 animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          {/* LOGO LIMPA (Sem fundo redondo) */}
          <div className="flex justify-center mb-4">
            {config.logo ? (
              <img src={config.logo} className="h-20 object-contain drop-shadow-md"/>
            ) : (
              <Truck size={48} className="text-blue-600" />
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{config.appName}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Entre para gerenciar sua frota</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">E-mail</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">Senha</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
            // O estilo inline abaixo garante que a cor primária configurada sobrescreva o bg-blue-600
            style={{ backgroundColor: config.theme?.primaryColor }}
          >
            {loading ? <Loader2 className="animate-spin"/> : <>Acessar Sistema <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></>}
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {config.appName}.
        </p>
      </div>
    </div>
  );
}
