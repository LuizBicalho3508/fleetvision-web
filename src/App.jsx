import Estoque from './pages/Estoque';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from './context/ConfigContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mapa from './pages/Mapa';
import Frota from './pages/Frota';
import Relatorios from './pages/Relatorios';
import Config from './pages/Config';
import Alertas from './pages/Alertas';
import Ranking from './pages/Ranking';
import Replay from './pages/Replay';
import Jornada from './pages/Jornada';
import Checklist from './pages/Checklist';
import Roteirizador from './pages/Roteirizador';
import Rotas from './pages/Rotas';
import Manutencao from './pages/Manutencao';
import Financeiro from './pages/Financeiro';
import Pneus from './pages/Pneus';
import Clientes from './pages/Clientes';
import Motoristas from './pages/Motoristas';
import Usuarios from './pages/Usuarios';
import Perfis from './pages/Perfis';
import Admin from './pages/Admin';
import Teste from './pages/Teste';

const PrivateRoute = ({ children }) => {
  const auth = localStorage.getItem('isAuthenticated');
  return auth ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }}/>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="mapa" element={<Mapa />} />
            <Route path="frota" element={<Frota />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="config" element={<Config />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="replay" element={<Replay />} />
            <Route path="jornada" element={<Jornada />} />
            <Route path="checklist" element={<Checklist />} />
            <Route path="roteirizador" element={<Roteirizador />} />
            <Route path="rotas" element={<Rotas />} />
            <Route path="manutencao" element={<Manutencao />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="pneus" element={<Pneus />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="motoristas" element={<Motoristas />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="perfis" element={<Perfis />} />
            <Route path="admin" element={<Admin />} />
            <Route path="teste" element={<Teste />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
