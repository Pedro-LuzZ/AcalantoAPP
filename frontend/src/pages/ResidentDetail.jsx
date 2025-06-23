import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

// Importando todos os nossos componentes filhos que esta página utiliza
import ReportList from '../components/ReportList';
import EvolucaoEnfermagemModal from '../components/EvolucaoEnfermagemModal';
import HigieneReportModal from '../components/HigieneReportModal';
import AddDailyReportModal from '../components/AddDailyReportModal';

function ResidentDetail() {
  const { id } = useParams();
  
  // Estados para os dados da página
  const [residente, setResidente] = useState(null);
  const [relatorios, setRelatorios] = useState([]);
  const [evolucoes, setEvolucoes] = useState([]);
  const [higieneReports, setHigieneReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para controlar a visibilidade de TODOS os modais
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [isEvolucaoModalOpen, setIsEvolucaoModalOpen] = useState(false);
  const [isHigieneModalOpen, setIsHigieneModalOpen] = useState(false);

  // Função principal para buscar todos os dados da página de uma vez
  const fetchData = () => {
    setLoading(true);
    const requestResidentDetail = axios.get(`http://localhost:3001/api/pacientes/${id}`);
    const requestDailyReports = axios.get(`http://localhost:3001/api/pacientes/${id}/relatorios`);
    const requestEvolucoes = axios.get(`http://localhost:3001/api/pacientes/${id}/evolucoes-enfermagem`);
    const requestHigiene = axios.get(`http://localhost:3001/api/pacientes/${id}/higiene`);

    Promise.all([requestResidentDetail, requestDailyReports, requestEvolucoes, requestHigiene])
      .then(([resResidente, resRelatorios, resEvolucoes, resHigiene]) => {
        setResidente(resResidente.data);
        setRelatorios(resRelatorios.data);
        setEvolucoes(resEvolucoes.data);
        setHigieneReports(resHigiene.data);
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

  // Efeito que roda quando a página carrega ou o ID muda
  useEffect(() => {
    fetchData();
  }, [id]);

  // Funções para o modal de EDIÇÃO DE RESIDENTE
  const handleEditResidentClick = () => {
    setEditFormData(residente);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditFormData({ ...editFormData, [name]: value });
  };
  
  const handleUpdateResidentSubmit = (event) => {
    event.preventDefault();
    axios.put(`http://localhost:3001/api/pacientes/${id}`, editFormData)
      .then(() => {
        toast.success('Dados do residente atualizados com sucesso!');
        fetchData();
        setIsEditing(false);
      }).catch(err => {
        console.error('Erro ao atualizar o residente:', err);
        toast.error('Falha ao atualizar residente.');
      });
  };

  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!residente) {
    return <div>Residente não encontrado.</div>;
  }

  return (
    <div>
      {/* ===== SEÇÃO DE MODAIS ===== */}
      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Editando Residente: {residente.nome}</h2>
            <form onSubmit={handleUpdateResidentSubmit} className="report-form">
                <input type="text" name="nome" placeholder="Nome" value={editFormData.nome || ''} onChange={handleEditFormChange} required />
                <input type="number" name="idade" placeholder="Idade" value={editFormData.idade || ''} onChange={handleEditFormChange} />
                <input type="text" name="quarto" placeholder="Quarto" value={editFormData.quarto || ''} onChange={handleEditFormChange} />
                <input type="text" name="diagnostico" placeholder="Diagnóstico" value={editFormData.diagnostico || ''} onChange={handleEditFormChange} />
                <textarea name="medicamentos" placeholder="Medicamentos" value={editFormData.medicamentos || ''} onChange={handleEditFormChange}></textarea>
                <input type="text" name="link_medicamentos" placeholder="Link da Planilha de Medicamentos" value={editFormData.link_medicamentos || ''} onChange={handleEditFormChange} />
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
      
      {isDailyReportModalOpen && <AddDailyReportModal residente={residente} closeModal={() => setIsDailyReportModalOpen(false)} onSave={fetchData} />}
      {isEvolucaoModalOpen && <EvolucaoEnfermagemModal residente={residente} closeModal={() => setIsEvolucaoModalOpen(false)} onSave={fetchData} />}
      {isHigieneModalOpen && <HigieneReportModal residente={residente} closeModal={() => setIsHigieneModalOpen(false)} onSave={fetchData} />}

      {/* ===== CARD DE DETALHES DO RESIDENTE ===== */}
      <div className="patient-detail-card">
        <h1>{residente.nome}</h1>
        <div className="detail-actions">
          <button onClick={handleEditResidentClick} className="edit-btn">Editar Dados</button>
          <button onClick={() => setIsDailyReportModalOpen(true)} className="action-btn" style={{backgroundColor: '#198754'}}>Adicionar Relatório Diário</button>
          <button onClick={() => setIsHigieneModalOpen(true)} className="action-btn" style={{backgroundColor: '#0dcaf0', color: '#000'}}>Relatório de Higiene</button>
          <button onClick={() => setIsEvolucaoModalOpen(true)} className="action-btn">Nova Evolução de Enfermagem</button>
        </div>
        <ul>
            <li><strong>ID:</strong> {residente.id}</li>
            <li><strong>Idade:</strong> {residente.idade || 'N/A'} anos</li>
            <li><strong>Quarto:</strong> {residente.quarto || 'N/A'}</li>
            <li><strong>Diagnóstico:</strong> {residente.diagnostico || 'N/A'}</li>
            <li><strong>Medicamentos:</strong> {residente.medicamentos || 'N/A'}</li>
            <li><a href={residente.link_medicamentos} target="_blank" rel="noopener noreferrer">Ver Planilha de Medicamentos</a></li>
            <li><strong>Contato de Emergência (Equipe):</strong> {residente.contato_emergencia || 'N/A'}</li>
            <li><strong>Data de Internação:</strong> {residente.data_internacao ? new Date(residente.data_internacao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</li>
            <li className="highlight-section"><strong>Familiar Responsável:</strong> {residente.responsavel_familiar_nome || 'Não informado'}</li>
            <li className="highlight-section"><strong>Contato do Responsável:</strong> {residente.responsavel_familiar_contato || 'Não informado'}</li>
        </ul>
        <Link to="/pacientes" className="back-link">Voltar para a Lista de Residentes</Link>
      </div>
      
      <hr/>

      {/* ===== SEÇÃO DE HISTÓRICOS ===== */}

      <div className="reports-section">
        <h3>Histórico de Evoluções de Enfermagem</h3>
        {evolucoes.length > 0 ? (
          <ul className="report-list">
            {evolucoes.map(evo => (
              <li key={`evo-${evo.id}`} className="report-item">
                <p><strong>Data:</strong> {new Date(evo.data_ocorrencia).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                <p><strong>Observações Principais:</strong> {evo.observacoes}</p>
                <p><small>Responsável: {evo.responsavel_nome}</small></p>
              </li>
            ))}
          </ul>
        ) : <p>Nenhuma evolução de enfermagem cadastrada.</p>}
      </div>

      <div className="reports-section">
        <h3>Histórico de Higiene</h3>
        {higieneReports.length > 0 ? (
          <ul className="report-list">
            {higieneReports.map(report => (
              <li key={`higiene-${report.id}`} className="report-item">
                <p><strong>{new Date(report.data_ocorrencia).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {report.hora_ocorrencia}</strong> por {report.responsavel_nome}</p>
                <ul style={{paddingLeft: '20px', listStyleType: 'disc', color: '#eee'}}>
                  {report.banho_corporal && <li>Realizado Banho Corporal</li>}
                  {report.banho_parcial && <li>Realizado Banho Parcial</li>}
                  {report.higiene_intima && <li>Realizada Higiene Íntima</li>}
                </ul>
                {report.observacoes && <p><strong>Obs:</strong> {report.observacoes}</p>}
              </li>
            ))}
          </ul>
        ) : <p>Nenhum relatório de higiene encontrado.</p>}
      </div>

      <ReportList relatorios={relatorios} />
    </div>
  );
}

export default ResidentDetail;