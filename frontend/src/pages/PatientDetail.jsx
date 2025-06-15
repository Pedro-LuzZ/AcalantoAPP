import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

// Importando nossos novos componentes
import ReportList from '../components/ReportList';
import AddReportForm from '../components/AddReportForm';

function PatientDetail() {
  const { id } = useParams();
  
  const [paciente, setPaciente] = useState(null);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para o modal de edição do paciente
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Função para buscar todos os dados da página
  const fetchData = () => {
    setLoading(true);
    const fetchPatientDetail = axios.get(`http://localhost:3001/api/pacientes/${id}`);
    const fetchPatientReports = axios.get(`http://localhost:3001/api/pacientes/${id}/relatorios`);

    Promise.all([fetchPatientDetail, fetchPatientReports])
      .then(responses => {
        setPaciente(responses[0].data);
        setRelatorios(responses[1].data);
      })
      .catch(err => {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os dados.');
        toast.error('Não foi possível carregar os dados da página.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // A função de submit agora recebe os dados do componente filho (AddReportForm)
  const handleRelatorioSubmit = (dadosDoFormulario) => {
    axios.post(`http://localhost:3001/api/pacientes/${id}/relatorios`, dadosDoFormulario)
      .then(() => {
        toast.success('Relatório salvo com sucesso!');
        fetchData(); // Recarrega os dados para mostrar o novo relatório na lista
      })
      .catch(err => {
        console.error('Erro ao cadastrar relatório:', err);
        toast.error('Falha ao cadastrar relatório.');
      });
  };

  // Funções para o modal de EDIÇÃO DE PACIENTE
  const handleEditPatientClick = () => {
    setEditFormData(paciente);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditFormData({ ...editFormData, [name]: value });
  };
  
  const handleUpdatePatientSubmit = (event) => {
    event.preventDefault();
    axios.put(`http://localhost:3001/api/pacientes/${id}`, editFormData)
      .then(() => {
        toast.success('Dados do paciente atualizados com sucesso!');
        fetchData();
        setIsEditing(false);
      })
      .catch(err => {
        console.error('Erro ao atualizar o paciente:', err);
        toast.error('Falha ao atualizar paciente.');
      });
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) return <div>{error}</div>;
  if (!paciente) return <div>Paciente não encontrado.</div>;

  return (
    <div>
      {/* Modal de Edição do Paciente (lógica inalterada) */}
      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Editando Paciente: {paciente.nome}</h2>
            <form onSubmit={handleUpdatePatientSubmit} className="report-form">
                <input type="text" name="nome" placeholder="Nome" value={editFormData.nome || ''} onChange={handleEditFormChange} required />
                <input type="number" name="idade" placeholder="Idade" value={editFormData.idade || ''} onChange={handleEditFormChange} />
                <input type="text" name="quarto" placeholder="Quarto" value={editFormData.quarto || ''} onChange={handleEditFormChange} />
                <input type="text" name="diagnostico" placeholder="Diagnóstico" value={editFormData.diagnostico || ''} onChange={handleEditFormChange} />
                <input type="text" name="medicamentos" placeholder="Medicamentos" value={editFormData.medicamentos || ''} onChange={handleEditFormChange} />
                <input type="text" name="contato_emergencia" placeholder="Contato de Emergência" value={editFormData.contato_emergencia || ''} onChange={handleEditFormChange} />
                <input type="date" name="data_internacao" placeholder="Data de Internação" value={editFormData.data_internacao ? editFormData.data_internacao.split('T')[0] : ''} onChange={handleEditFormChange} />
                <input type="text" name="responsavel_familiar_nome" placeholder="Nome do Familiar Responsável" value={editFormData.responsavel_familiar_nome || ''} onChange={handleEditFormChange} />
                <input type="text" name="responsavel_familiar_contato" placeholder="Contato do Familiar" value={editFormData.responsavel_familiar_contato || ''} onChange={handleEditFormChange} />
                <div className="modal-actions">
                    <button type="button" onClick={handleCancelEdit}>Cancelar</button>
                    <button type="submit" className="save-btn">Salvar Alterações</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Card de Detalhes do Paciente (lógica inalterada) */}
      <div className="patient-detail-card">
        <h1>{paciente.nome}</h1>
        <button onClick={handleEditPatientClick} className="edit-btn" style={{marginBottom: '1rem', padding: '10px 15px'}}>Editar Dados do Paciente</button>
        <ul>
            <li><strong>ID:</strong> {paciente.id}</li>
            <li><strong>Idade:</strong> {paciente.idade} anos</li>
            <li><strong>Quarto:</strong> {paciente.quarto}</li>
            <li><strong>Diagnóstico:</strong> {paciente.diagnostico}</li>
            <li><strong>Medicamentos:</strong> {paciente.medicamentos}</li>
            <li><strong>Contato de Emergência (Equipe):</strong> {paciente.contato_emergencia}</li>
            <li><strong>Data de Internação:</strong> {paciente.data_internacao ? new Date(paciente.data_internacao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</li>
            <li className="highlight-section"><strong>Familiar Responsável:</strong> {paciente.responsavel_familiar_nome || 'Não informado'}</li>
            <li className="highlight-section"><strong>Contato do Responsável:</strong> {paciente.responsavel_familiar_contato || 'Não informado'}</li>
        </ul>
        <Link to="/pacientes" className="back-link">Voltar para a Lista de Pacientes</Link>
      </div>

      {/* O formulário de relatório agora é um componente separado */}
      <AddReportForm onReportSubmit={handleRelatorioSubmit} />

      {/* A lista de relatórios agora é um componente separado */}
      <ReportList relatorios={relatorios} />
    </div>
  );
}

export default PatientDetail;