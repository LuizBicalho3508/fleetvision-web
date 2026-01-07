import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getStorage } from '../services/api';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getStorage('config').then(res => {
      if (res && res.system && res.system.logo) {
        const url = res.system.logo.startsWith('http') || res.system.logo.startsWith('/') 
          ? res.system.logo 
          : `/storage/uploads/${res.system.logo}`;
        setLogoUrl(url);
      }
    }).catch(()=>{});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Bem-vindo!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/10">
        <div className="text-center mb-8">
          {logoUrl ? (
             <img src={logoUrl} className="h-16 mx-auto mb-4 object-contain filter drop-shadow-lg" alt="Logo"/>
          ) : (
             <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
               <Lock className="text-white" size={32} />
             </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">Acesso ao Sistema</h1>
          <p className="text-slate-400">Entre com suas credenciais para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="email" 
                required
                className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="password" 
                required
                className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={20}/></>}
          </button>
        </form>
      </div>
    </div>
  );
}
