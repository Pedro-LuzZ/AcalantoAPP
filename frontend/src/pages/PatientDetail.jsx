import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

// Função para pegar a data de hoje no formato YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para pegar a hora atual no formato HH:MM
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

function PatientDetail() {
  const { id } = useParams();
  
  const [paciente, setPaciente] = useState(null);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [novoRelatorio, setNovoRelatorio] = useState({
    data: getTodayDateString(),
    hora: getCurrentTimeString(),
    periodo: 'Manhã',
    alimentacao: '',
    temperatura: '',
    pressao: '',
    observacoes: '',
    responsavel: ''
  });

  const fetchData = () => {
    const fetchPatientDetail = axios.get(`http://localhost:3001/api/pacientes/${id}`);
    const fetchPatientReports = axios.get(`http://localhost:3001/api/pacientes/${id}/relatorios`);

    Promise.all([fetchPatientDetail, fetchPatientReports])
      .then(responses => {
        setPaciente(responses[0].data);
        setRelatorios(responses[1].data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os dados.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRelatorioInputChange = (event) => {
    const { name, value } = event.target;
    setNovoRelatorio({ ...novoRelatorio, [name]: value });
  };

  const handleRelatorioSubmit = (event) => {
    event.preventDefault();
    axios.post(`http://localhost:3001/api/pacientes/${id}/relatorios`, novoRelatorio)
      .then(() => {
        fetchData(); 
        setNovoRelatorio({ 
          data: getTodayDateString(), 
          hora: getCurrentTimeString(),
          periodo: 'Manhã', 
          alimentacao: '', 
          temperatura: '', 
          pressao: '', 
          observacoes: '', 
          responsavel: '' 
        });
      })
      .catch(err => {
        console.error('Erro ao cadastrar relatório:', err);
        alert('Falha ao cadastrar relatório.');
      });
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!paciente) return <div>Paciente não encontrado.</div>;

  return (
    <div className="App-header">
      <div className="patient-detail-card">
        <h1>{paciente.nome}</h1>
        <ul>
            <li><strong>ID:</strong> {paciente.id}</li>
            <li><strong>Idade:</strong> {paciente.idade} anos</li>
            <li><strong>Quarto:</strong> {paciente.quarto}</li>
            <li><strong>Diagnóstico:</strong> {paciente.diagnostico}</li>
            <li><strong>Medicamentos:</strong> {paciente.medicamentos}</li>
        </ul>
        <Link to="/" className="back-link">Voltar para a Lista</Link>
      </div>

      <form onSubmit={handleRelatorioSubmit} className="report-form">
        <h2>Adicionar Relatório Diário</h2>
        <div className="form-row">
          <input type="date" name="data" value={novoRelatorio.data} onChange={handleRelatorioInputChange} />
          <input type="time" name="hora" value={novoRelatorio.hora} onChange={handleRelatorioInputChange} />
          <select name="periodo" value={novoRelatorio.periodo} onChange={handleRelatorioInputChange}>
            <option value="Manhã">Manhã</option>
            <option value="Noite">Noite</option>
          </select>
        </div>
        <textarea name="alimentacao" placeholder="Alimentação" value={novoRelatorio.alimentacao} onChange={handleRelatorioInputChange}></textarea>
        <div className="form-row">
          <input type="text" name="temperatura" placeholder="Temperatura (ex: 36.5)" value={novoRelatorio.temperatura} onChange={handleRelatorioInputChange} />
          <input type="text" name="pressao" placeholder="Pressão (ex: 120/80)" value={novoRelatorio.pressao} onChange={handleRelatorioInputChange} />
        </div>
        <textarea name="observacoes" placeholder="Observações gerais..." value={novoRelatorio.observacoes} onChange={handleRelatorioInputChange} required></textarea>
        <input type="text" name="responsavel" placeholder="Responsável (ex: Enf. Ana)" value={novoRelatorio.responsavel} onChange={handleRelatorioInputChange} />
        <button type="submit" className="save-btn">Salvar Relatório</button>
      </form>

      <div className="reports-section">
        <h2>Histórico de Relatórios Diários</h2>
        {relatorios.length > 0 ? (
          <ul className="report-list">
            {relatorios.map(relatorio => (
              <li key={relatorio.id} className="report-item">
                <h3>{new Date(relatorio.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {relatorio.hora} - {relatorio.periodo}</h3>
                <p><strong>Alimentação:</strong> {relatorio.alimentacao}</p>
                <p><strong>Temperatura:</strong> {relatorio.temperatura} °C</p>
                <p><strong>Pressão:</strong> {relatorio.pressao}</p>
                <p><strong>Observações:</strong> {relatorio.observacoes}</p>
                <p><small>Responsável: {relatorio.responsavel}</small></p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum relatório cadastrado para este paciente.</p>
        )}
      </div>
    </div>
  );
}

export default PatientDetail;