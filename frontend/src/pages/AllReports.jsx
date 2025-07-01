import { useState, useEffect } from 'react';
import api from '../api'; // axios configurado
import { toast } from 'react-toastify';

function AllReports() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todosResidentes, setTodosResidentes] = useState([]);
  const [filtros, setFiltros] = useState({
    pacienteId: '',
    data: '',
    tipo: ''
  });

  useEffect(() => {
    api.get('/pacientes').then(res => setTodosResidentes(res.data));
    fetchFeed({}); // carrega tudo no começo
  }, []);

  const fetchFeed = (filtrosAtuais) => {
    setLoading(true);
    api.get('/relatorios', { params: filtrosAtuais })
      .then(response => {
        setFeedItems(response.data);
      })
      .catch(() => {
        toast.error("Não foi possível carregar o feed de atividades.");
      })
      .finally(() => setLoading(false));
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleAplicarFiltros = (e) => {
    e.preventDefault();
    fetchFeed(filtros);
  };

  const handleLimparFiltros = () => {
    const reset = { pacienteId: '', data: '', tipo: '' };
    setFiltros(reset);
    fetchFeed(reset);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Feed de Atividades Recentes</h2>
      <form onSubmit={handleAplicarFiltros}>
        <label>Residente:
          <select name="pacienteId" value={filtros.pacienteId} onChange={handleFiltroChange}>
            <option value="">Todos os Residentes</option>
            {todosResidentes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </label>

        <label>Data:
          <input type="date" name="data" value={filtros.data} onChange={handleFiltroChange} />
        </label>

        <label>Tipo de Relatório:
          <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
            <option value="">Todos os Tipos</option>
            <option value="relatorio_diario">Relatório Diário</option>
            <option value="evolucao_enfermagem">Evolução de Enfermagem</option>
            <option value="evolucao_tecnico">Evolução Técnico</option>
            <option value="higiene">Relatório de Higiene</option>
          </select>
        </label>

        <button type="submit">Filtrar</button>
        <button type="button" onClick={handleLimparFiltros}>Limpar</button>
      </form>

      <ul>
        {feedItems.length > 0 ? feedItems.map(item => (
          <li key={`${item.tipo}-${item.id}`}>
            <strong>{item.tipo}</strong> - {new Date(item.data_universal).toLocaleDateString()} {item.hora || ''}
            <br />
            Obs: {item.observacoes}
            <br />
            Responsável: {item.responsavel}
          </li>
        )) : <p>Nenhum relatório encontrado.</p>}
      </ul>
    </div>
  );
}

export default AllReports;