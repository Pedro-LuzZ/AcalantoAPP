import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function AllReports() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/api/relatorios')
      .then(response => {
        setRelatorios(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar todos os relatórios:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando relatórios...</div>;

  return (
    <div>
      <h2>Feed de Todos os Relatórios</h2>
      {relatorios.length > 0 ? (
        <ul className="report-list">
          {relatorios.map(relatorio => (
            <li key={relatorio.id} className="report-item">
              <h3>
                {new Date(relatorio.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {relatorio.hora} - {relatorio.periodo}
              </h3>
              {/* Adicionamos o nome do paciente com um link para sua página de detalhes */}
              <h4>
                Paciente: <Link to={`/paciente/${relatorio.paciente_id}`}>{relatorio.paciente_nome}</Link>
              </h4>
              <p><strong>Observações:</strong> {relatorio.observacoes}</p>
              <p><small>Responsável: {relatorio.responsavel}</small></p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum relatório encontrado no sistema.</p>
      )}
    </div>
  );
}

export default AllReports;