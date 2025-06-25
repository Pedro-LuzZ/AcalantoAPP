import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

// Importando todos os componentes
import ReportList from '../components/ReportList';
import EvolucaoEnfermagemModal from '../components/EvolucaoEnfermagemModal';
import HigieneReportModal from '../components/HigieneReportModal';
import EvolucaoTecnicoModal from '../components/EvolucaoTecnicoModal';

function ResidentDetail() {
  const { id } = useParams();
  const [residente, setResidente] = useState(null);
  const [relatorios, setRelatorios] = useState([]);
  const [evolucoesEnfermagem, setEvolucoesEnfermagem] = useState([]);
  const [higieneReports, setHigieneReports] = useState([]);
  const [evolucoesTecnico, setEvolucoesTecnico] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de controle dos modais
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isEvolucaoEnfModalOpen, setIsEvolucaoEnfModalOpen] = useState(false);
  const [isHigieneModalOpen, setIsHigieneModalOpen] = useState(false);
  const [isTecnicoModalOpen, setIsTecnicoModalOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const requestResidentDetail = axios.get(`http://localhost:3001/api/pacientes/${id}`);
    const requestDailyReports = axios.get(`http://localhost:3001/api/pacientes/${id}/relatorios`);
    const requestEvolucoesEnf = axios.get(`http://localhost:3001/api/pacientes/${id}/evolucoes-enfermagem`);
    const requestHigiene = axios.get(`http://localhost:3001/api/pacientes/${id}/higiene`);
    const requestEvolucoesTec = axios.get(`http://localhost:3001/api/residentes/${id}/evolucao-tecnico`);

    Promise.all([requestResidentDetail, requestDailyReports, requestEvolucoesEnf, requestHigiene, requestEvolucoesTec])
      .then(([resResidente, resRelatorios, resEvolucoesEnf, resHigiene, resEvolucoesTec]) => {
        setResidente(resResidente.data);
        setRelatorios(resRelatorios.data);
        setEvolucoesEnfermagem(resEvolucoesEnf.data);
        setHigieneReports(resHigiene.data);
        setEvolucoesTecnico(resEvolucoesTec.data);
      })
      .catch(err => {
        toast.error('Não foi possível carregar todos os dados da página.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditResidentClick = () => { setEditFormData(residente); setIsEditing(true); };
  const handleCancelEdit = () => setIsEditing(false);
  const handleEditFormChange = (event) => { const { name, value } = event.target; setEditFormData({ ...editFormData, [name]: value }); };
  const handleUpdateResidentSubmit = (event) => {
    event.preventDefault();
    axios.put(`http://localhost:3001/api/pacientes/${id}`, editFormData)
      .then(() => {
        toast.success('Dados do residente atualizados com sucesso!');
        fetchData();
        setIsEditing(false);
      }).catch(() => toast.error('Falha ao atualizar residente.'));
  };

  if (loading) return <div className="loading-spinner-container">...</div>;
  if (!residente) return <div>Residente não encontrado.</div>;

  return (
    <div>
      {isEditing && (/* Modal de Edição */)}
      {isEvolucaoEnfModalOpen && <EvolucaoEnfermagemModal residente={residente} closeModal={() => setIsEvolucaoEnfModalOpen(false)} onSave={fetchData} />}
      {isHigieneModalOpen && <HigieneReportModal residente={residente} closeModal={() => setIsHigieneModalOpen(false)} onSave={fetchData} />}
      {isTecnicoModalOpen && <EvolucaoTecnicoModal residente={residente} closeModal={() => setIsTecnicoModalOpen(false)} onSave={fetchData} />}

      <div className="patient-detail-card">
        <h1>{residente.nome}</h1>
        <div className="detail-actions">
          <button onClick={handleEditResidentClick} className="edit-btn">Editar Dados</button>
          <button onClick={() => setIsHigieneModalOpen(true)} className="action-btn" style={{backgroundColor: '#0dcaf0', color: '#000'}}>Rel. de Higiene</button>
          <button onClick={() => setIsEvolucaoEnfModalOpen(true)} className="action-btn">Evol. de Enfermagem</button>
          <button onClick={() => setIsTecnicoModalOpen(true)} className="action-btn" style={{backgroundColor: '#fd7e14'}}>Evol. do Técnico</button>
        </div>
        <ul> {/* ... Detalhes do residente ... */} </ul>
        <Link to="/pacientes" className="back-link">Voltar para a Lista</Link>
      </div>
      
      <hr/>

      <div className="reports-section">
        <h3>Histórico de Evoluções do Técnico</h3>
        {evolucoesTecnico.length > 0 ? (
          <ul className="report-list">
              {evolucoesTecnico.map(evo => (<li key={evo.id}>{/* ... */}</li>))}
          </ul>
        ) : <p>Nenhuma evolução de técnico encontrada.</p>}
      </div>
      
      <div className="reports-section">
        <h3>Histórico de Evoluções de Enfermagem</h3>
        {evolucoesEnfermagem.length > 0 ? (
          <ul className="report-list">{/* ... */}</ul>
        ) : <p>Nenhuma evolução de enfermagem encontrada.</p>}
      </div>
      
      <div className="reports-section">
        <h3>Histórico de Higiene</h3>
        {higieneReports.length > 0 ? (
          <ul className="report-list">{/* ... */}</ul>
        ) : <p>Nenhum relatório de higiene encontrado.</p>}
      </div>
      
      <ReportList relatorios={relatorios} />
    </div>
  );
}

export default ResidentDetail;