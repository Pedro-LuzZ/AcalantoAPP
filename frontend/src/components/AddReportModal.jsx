import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import '../App.css';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

function AddReportModal({ closeModal, onReportAdded }) {
  const [residentes, setResidentes] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
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

  useEffect(() => {
    api.get('/pacientes')
      .then(response => {
        setResidentes(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar residentes para o modal:", error);
        toast.error("Não foi possível carregar a lista de residentes.");
      });
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNovoRelatorio({ ...novoRelatorio, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedResidentId) {
      toast.warn('Por favor, selecione um residente.');
      return;
    }

    api.post(`/relatorios`, novoRelatorio)
      .then(() => {
        toast.success('Relatório salvo com sucesso!');
        if (onReportAdded) onReportAdded();
        closeModal();
      })
      .catch(err => {
        console.error('Erro ao cadastrar relatório:', err);
        toast.error('Falha ao cadastrar relatório.');
      });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Adicionar Relatório Diário Rápido</h2>
        <form onSubmit={handleSubmit} className="report-form">
          
          <label htmlFor="resident-select">Selecione o Residente:</label>
          <select
            id="resident-select"
            value={selectedResidentId}
            onChange={(e) => setSelectedResidentId(e.target.value)}
            required
          >
            <option value="" disabled>-- Escolha um residente --</option>
            {residentes.map(residente => (
              <option key={residente.id} value={residente.id}>{residente.nome}</option>
            ))}
          </select>
          
          <hr/>

          <div className="form-row">
            <input type="date" name="data" value={novoRelatorio.data} onChange={handleInputChange} />
            <input type="time" name="hora" value={novoRelatorio.hora} onChange={handleInputChange} />
            <select name="periodo" value={novoRelatorio.periodo} onChange={handleInputChange}>
              <option value="Manhã">Manhã</option>
              <option value="Noite">Noite</option>
            </select>
          </div>
          <textarea name="alimentacao" placeholder="Alimentação" value={novoRelatorio.alimentacao} onChange={handleInputChange}></textarea>
          <div className="form-row">
            <input type="text" name="temperatura" placeholder="Temperatura (ex: 36.5)" value={novoRelatorio.temperatura} onChange={handleInputChange} />
            <input type="text" name="pressao" placeholder="Pressão (ex: 120/80)" value={novoRelatorio.pressao} onChange={handleInputChange} />
          </div>
          <textarea name="observacoes" placeholder="Observações gerais..." value={novoRelatorio.observacoes} onChange={handleInputChange} required></textarea>
          <input type="text" name="responsavel" placeholder="Responsável (ex: Enf. Ana)" value={novoRelatorio.responsavel} onChange={handleInputChange} />

          <div className="modal-actions">
            <button type="button" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="save-btn">Salvar Relatório</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddReportModal;