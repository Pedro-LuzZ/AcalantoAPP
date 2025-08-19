import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import ResidentList from './pages/ResidentList';
import ResidentDetail from './pages/ResidentDetail';
import AllReports from './pages/AllReports';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import AddReportModal from './components/AddReportModal';
import { useAuth } from './context/AuthContext';
import Principal from './pages/Principal'; // <- NOVO
import './App.css';
import './styles/ui.css';


function App() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {isReportModalOpen && (
        <AddReportModal closeModal={() => setIsReportModalOpen(false)} />
      )}

      <h1>Acalanto Residence - Gestão de Residentes</h1>

      <nav className="main-nav">
        {isLoggedIn && (
          <>
            {/* NOVO: link para a Dashboard */}
            <Link to="/principal">Principal</Link>

            {/* Mantive teu fluxo original */}
            <Link to="/">Cadastrar Residente</Link>
            <Link to="/pacientes">Ver Lista de Residentes</Link>
            <Link to="/relatorios">Todos os Relatórios</Link>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="quick-action-btn"
            >
              Adicionar Relatório
            </button>
          </>
        )}

        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">
            Sair
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login">Login</Link>
            <Link to="/registrar">Registrar</Link>
          </div>
        )}
      </nav>

      <hr />

      <main>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrar" element={<RegisterPage />} />

          {/* Rotas Protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* Mantido: Home em "/" */}
            <Route path="/" element={<Home />} />

            {/* NOVO: Dashboard em /principal */}
            <Route path="/principal" element={<Principal />} />

            {/* Lista e detalhe */}
            <Route path="/pacientes" element={<ResidentList />} />
            <Route path="/paciente/:id" element={<ResidentDetail />} />

            {/* Todos os relatórios */}
            <Route path="/relatorios" element={<AllReports />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
