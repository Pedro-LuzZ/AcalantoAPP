import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../App.css';

import ReportList from '../components/ReportList';
import EvolucaoEnfermagemModal from '../components/EvolucaoEnfermagemModal';
import HigieneReportModal from '../components/HigieneReportModal';
import EvolucaoTecnicoModal from '../components/EvolucaoTecnicoModal';
import AddDailyReportModal from '../components/AddDailyReportModal';

function ResidentDetail() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  
  const [residente, setResidente] = useState(null);
  const [relatorios, setRelatorios] = useState([]);
  const [evolucoesEnfermagem, setEvolucoesEnfermagem] = useState([]);
  const [higieneReports, setHigieneReports] = useState([]);
  const [evolucoesTecnico, setEvolucoesTecnico] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [isEvolucaoEnfModalOpen, setIsEvolucaoEnfModalOpen] = useState(false);
  const [isHigieneModalOpen, setIsHigieneModalOpen] = useState(false);
  const [isTecnicoModalOpen, setIsTecnicoModalOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const requestResidentDetail = api.get(`/pacientes/${id}`);
    const requestDailyReports = api.get(`/pacientes/${id}/relatorios`);
    const requestEvolucoesEnf = api.get(`/pacientes/${id}/evolucoes-enfermagem`);
    const requestHigiene = api.get(`/pacientes/${id}/higiene`);
    const requestEvolucoesTec = api.get(`/pacientes/${id}/evolucao-tecnico`);

    Promise.all([requestResidentDetail, requestDailyReports, requestEvolucoesEnf, requestHigiene, requestEvolucoesTec])
      .then(([resResidente, resRelatorios, resEvolucoesEnf, resHigiene, resEvolucoesTec]) => {
        setResidente(resResidente.data);
        setRelatorios(resRelatorios.data);
        setEvolucoesEnfermagem(resEvolucoesEnf.data);
        setHigieneReports(resHigiene.data);
        setEvolucoesTecnico(resEvolucoesTec.data);
      })
      .catch(err => {
        console.error('Erro ao buscar dados:', err);
        toast.error('Não foi possível carregar os dados do residente.');
        setResidente(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditResidentClick = () => { setEditFormData(residente); setIsEditing(true); };
  const handleCancelEdit = () => setIsEditing(false);
  const handleEditFormChange = (event) => { const { name, value } = event.target; setEditFormData({ ...editFormData, [name]: value }); };
  const handleUpdateResidentSubmit = (event) => {
    event.preventDefault();
    api.put(`/pacientes/${id}`, editFormData)
      .then(() => {
        toast.success('Dados do residente atualizados com sucesso!');
        fetchData();
        setIsEditing(false);
      }).catch(() => toast.error('Falha ao atualizar residente.'));
  };

  const handleDelete = () => {
    if (window.confirm("DELETAR: Tem certeza? Esta ação apagará permanentemente o residente do banco de dados.")) {
      api.delete(`/pacientes/${id}`)
        .then(() => {
          toast.success('Residente deletado com sucesso!');
          navigate('/pacientes');
        })
        .catch(error => {
          toast.error(error.response?.data?.error || 'Não foi possível deletar o residente.');
        });
    }
  };

  const handleArchive = () => {
    if (window.confirm("ARQUIVAR: Tem certeza? Um backup será salvo no Google Drive e o residente será removido da lista de ativos.")) {
      toast.info("Arquivando residente... Este processo pode levar um momento.");
      api.post(`/pacientes/${id}/arquivar`)
        .then(response => {
          toast.success(response.data.message);
          navigate('/pacientes');
        })
        .catch(error => {
          toast.error(error.response?.data?.error || 'Falha ao arquivar o residente.');
        });
    }
  };

  if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (!residente) return <div className="error-message">Residente não encontrado. <Link to="/pacientes">Voltar para a lista.</Link></div>;

  return (
    <div>
      {isEditing && ( <div className="modal-backdrop">...</div> )}
      {isDailyReportModalOpen && <AddDailyReportModal residente={residente} closeModal={() => setIsDailyReportModalOpen(false)} onSave={fetchData} />}
      {isEvolucaoEnfModalOpen && <EvolucaoEnfermagemModal residente={residente} closeModal={() => setIsEvolucaoEnfModalOpen(false)} onSave={fetchData} />}
      {isHigieneModalOpen && <HigieneReportModal residente={residente} closeModal={() => setIsHigieneModalOpen(false)} onSave={fetchData} />}
      {isTecnicoModalOpen && <EvolucaoTecnicoModal residente={residente} closeModal={() => setIsTecnicoModalOpen(false)} onSave={fetchData} />}

      <div className="patient-detail-card">
        <h1>{residente.nome}</h1>
        <div className="detail-actions">
          <button onClick={handleEditResidentClick} className="edit-btn">Editar Dados</button>
          <button onClick={() => setIsDailyReportModalOpen(true)} className="action-btn btn-green">Relatório Diário</button>
          <button onClick={() => setIsHigieneModalOpen(true)} className="action-btn btn-cyan">Rel. de Higiene</button>
          <button onClick={() => setIsEvolucaoEnfModalOpen(true)} className="action-btn btn-blue">Evol. de Enfermagem</button>
          <button onClick={() => setIsTecnicoModalOpen(true)} className="action-btn btn-orange">Evol. do Técnico</button>
        </div>
        <ul>
          {/* Detalhes do residente */}
        </ul>
        <Link to="/pacientes" className="back-link">Voltar para a Lista</Link>
        
        {usuario && usuario.role === 'admin' && (
            <div className="admin-actions">
                <h3>Ações de Administrador</h3>
                <button onClick={handleDelete} className="delete-btn">Deletar Residente</button>
                <button onClick={handleArchive} className="archive-btn">Arquivar Residente</button>
            </div>
        )}
      </div>
      
      <hr/>

      <div className="reports-section">
        <h3>Histórico de Evoluções do Técnico</h3>
        {/* ... */}
      </div>
      <div className="reports-section">
        <h3>Histórico de Evoluções de Enfermagem</h3>
        {/* ... */}
      </div>
      <div className="reports-section">
        <h3>Histórico de Higiene</h3>
        {/* ... */}
      </div>
      <ReportList relatorios={relatorios} />
    </div>
  );
}

export default ResidentDetail;