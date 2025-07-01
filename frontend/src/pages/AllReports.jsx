import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api'; // substitui axios
import { toast } from 'react-toastify';
import '../App.css';

function AllReports() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todosResidentes, setTodosResidentes] = useState([]);
  const [filtros, setFiltros] = useState({
    pacienteId: '',
    data: '',
    tipo: ''
  });

  const fetchFeed = (filtrosAtuais) => {
    setLoading(true);
        api.get('/relatorios', { params: filtrosAtuais })
      .then(response => {
        setFeedItems(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar o feed de atividades:", error);
        toast.error("Não foi possível carregar o feed de atividades.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeed({}); 
      api.get('/pacientes').then(response => {
      setTodosResidentes(response.data);
    });
  }, []);

  const handleFiltroChange = (event) => {
    const { name, value } = event.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleAplicarFiltros = (event) => {
    event.preventDefault();
    fetchFeed(filtros);
  };

  const handleLimparFiltros = () => {
    const filtrosVazios = { pacienteId: '', data: '', tipo: '' };
    setFiltros(filtrosVazios);
    fetchFeed(filtrosVazios);
  };

  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <h2>Feed de Atividades Recentes</h2>
      <form onSubmit={handleAplicarFiltros} className="filter-form">
        <div className="form-group">
          <label htmlFor="pacienteId">Filtrar por Residente:</label>
          <select name="pacienteId" id="pacienteId" value={filtros.pacienteId} onChange={handleFiltroChange}>
            <option value="">Todos os Residentes</option>
            {todosResidentes.map(r => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="data">Filtrar por Data:</label>
          <input type="date" name="data" id="data" value={filtros.data} onChange={handleFiltroChange} />
        </div>
        <div className="form-group">
          <label htmlFor="tipo">Filtrar por Tipo de Relatório:</label>
          <select name="tipo" id="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
            <option value="">Todos os Tipos</option>
            <option value="relatorio_diario">Relatório Diário</option>
            <option value="evolucao_enfermagem">Evolução de Enfermagem</option>
            <option value="higiene">Relatório de Higiene</option>
          </select>
        </div>
        <div className="filter-actions">
          <button type="submit" className="save-btn">Filtrar</button>
          <button type="button" onClick={handleLimparFiltros}>Limpar Filtros</button>
        </div>
      </form>

      {feedItems.length > 0 ? (
        <ul className="report-list">
          {feedItems.map(item => (
            <li key={`${item.tipo}-${item.id}`} className="report-item">
              
              {item.tipo === 'relatorio_diario' && (
                <>
                  <h3 style={{color: '#198754'}}>Relatório Diário</h3>
                  <p><strong>Data:</strong> {new Date(item.data_universal).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {item.hora} - {item.periodo}</p>
                </>
              )}

              {item.tipo === 'evolucao_enfermagem' && (
                <>
                  <h3 style={{color: '#0d6efd'}}>Evolução de Enfermagem</h3>
                   <p><strong>Data:</strong> {new Date(item.data_universal).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                </>
              )}

              {item.tipo === 'higiene' && (
                <>
                  <h3 style={{color: '#6c757d'}}>Relatório de Higiene</h3>
                   <p><strong>Data:</strong> {new Date(item.data_universal).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {item.hora}</p>
                </>
              )}

              <p><strong>Residente:</strong> <Link to={`/paciente/${item.paciente_id}`}>{item.residente_nome}</Link></p>
              <p><strong>Observações:</strong> {item.observacoes}</p>
              <p><small>Responsável: {item.responsavel_nome}</small></p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma atividade encontrada para os filtros selecionados.</p>
      )}
    </div>
  );
}

export default AllReports;