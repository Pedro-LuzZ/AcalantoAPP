import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import AllReports from './pages/AllReports';
import './App.css'; 

function App() {
  return (
    <div className="App">
      <h1>Acalanto Residence - Gestão de Pacientes</h1>
      
      <nav className="main-nav">
        <Link to="/">Cadastrar Paciente</Link>
        <Link to="/pacientes">Ver Lista de Pacientes</Link>
        <Link to="/relatorios">Todos os Relatórios</Link>
      </nav>

      <hr />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pacientes" element={<PatientList />} />
          <Route path="/relatorios" element={<AllReports />} />
          <Route path="/paciente/:id" element={<PatientDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;