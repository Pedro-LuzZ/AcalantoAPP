// frontend/src/pages/AllReports.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

function AllReports() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todosPacientes, setTodosPacientes] = useState([]);
  const [filtros, setFiltros] = useState({
    pacienteId: '',
    data: ''
  });

  const fetchRelatorios = (filtrosAtuais) => {
    setLoading(true);
    axios.get('http://localhost:3001/api/relatorios', { params: filtrosAtuais })
      .then(response => {
        setRelatorios(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar relatórios:", error);
        toast.error("Não foi possível carregar os relatórios.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    const requestRelatoriosIniciais = axios.get('http://localhost:3001/api/relatorios');
    const requestPacientes = axios.get('http://localhost:3001/api/pacientes');

    Promise.all([requestRelatoriosIniciais, requestPacientes])
      .then(responses => {
        setRelatorios(responses[0].data);
        setTodosPacientes(responses[1].data);
      })
      .catch(error => {
        console.error("Erro ao buscar dados iniciais:", error);
        toast.error("Falha ao carregar dados da página.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleFiltroChange = (event) => {
    const { name, value } = event.target;
    setFiltros(filtrosAnteriores => ({
      ...filtrosAnteriores,
      [name]: value
    }));
  };

  const handleAplicarFiltros = (event) => {
    event.preventDefault();
    fetchRelatorios(filtros);
  };

  const handleLimparFiltros = () => {
    const filtrosVazios = { pacienteId: '', data: '' };
    setFiltros(filtrosVazios);
    fetchRelatorios(filtrosVazios);
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2>Feed de Todos os Relatórios</h2>

      <form onSubmit={handleAplicarFiltros} className="filter-form">
        <div className="form-group">
          <label htmlFor="pacienteId">Filtrar por Paciente:</label>
          <select 
            name="pacienteId" 
            id="pacienteId"
            value={filtros.pacienteId} 
            onChange={handleFiltroChange}
          >
            <option value="">Todos os Pacientes</option>
            {todosPacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="data">Filtrar por Data:</label>
          <input 
            type="date" 
            name="data" 
            id="data"
            value={filtros.data}
            onChange={handleFiltroChange}
          />
        </div>

        {/* MUDANÇA AQUI NOS BOTÕES */}
        <div className="filter-actions">
          <button type="submit" className="save-btn">Filtrar</button>
          <button type="button" onClick={handleLimparFiltros}>Limpar Filtros</button>
        </div>
      </form>

      {relatorios.length > 0 ? (
        <ul className="report-list">
          {relatorios.map(relatorio => (
            <li key={relatorio.id} className="report-item">
              <h3>
                {new Date(relatorio.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {relatorio.hora} - {relatorio.periodo}
              </h3>
              <h4>
                Paciente: <Link to={`/paciente/${relatorio.paciente_id}`}>{relatorio.paciente_nome}</Link>
              </h4>
              <p><strong>Observações:</strong> {relatorio.observacoes}</p>
              <p><small>Responsável: {relatorio.responsavel}</small></p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum relatório encontrado para os filtros selecionados.</p>
      )}
    </div>
  );
}

export default AllReports;