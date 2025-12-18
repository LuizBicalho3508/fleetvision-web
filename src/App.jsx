import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mapa from './pages/Mapa';
import Alertas from './pages/Alertas';
import Relatorios from './pages/Relatorios';
import Ranking from './pages/Ranking';
import Replay from './pages/Replay';
import Jornada from './pages/Jornada';
import Checklist from './pages/Checklist'; // IMPORTAÇÃO DA PÁGINA
import Roteirizador from './pages/Roteirizador';
import Rotas from './pages/Rotas';
import Manutencao from './pages/Manutencao';
import Financeiro from './pages/Financeiro';
import Frota from './pages/Frota';
import Pneus from './pages/Pneus';
import Clientes from './pages/Clientes';
import Motoristas from './pages/Motoristas';
import Usuarios from './pages/Usuarios';
import Perfis from './pages/Perfis';
import Config from './pages/Config';
import Testador from './pages/Testador';
import Admin from './pages/Admin';

const PrivateRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuthenticated');
  return isAuth ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mapa" element={<Mapa />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="replay" element={<Replay />} />
        <Route path="jornada" element={<Jornada />} />
        <Route path="checklist" element={<Checklist />} /> {/* ROTA REGISTRADA */}
        <Route path="roteirizador" element={<Roteirizador />} />
        <Route path="rotas" element={<Rotas />} />
        <Route path="manutencao" element={<Manutencao />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="frota" element={<Frota />} />
        <Route path="pneus" element={<Pneus />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="motoristas" element={<Motoristas />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="perfis" element={<Perfis />} />
        <Route path="config" element={<Config />} />
        <Route path="testador" element={<Testador />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
