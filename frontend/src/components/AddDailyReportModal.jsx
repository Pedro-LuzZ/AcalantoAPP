import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api'; // MUDANÇA AQUI
import '../App.css';

function AddDailyReportModal({ residente, closeModal, onSave }) {
  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const getCurrentTimeString = () => new Date().toTimeString().substring(0, 5);

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNovoRelatorio({ ...novoRelatorio, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    api.post(`/pacientes/${residente.id}/relatorios`, novoRelatorio) // MUDANÇA AQUI
      .then(() => {
        toast.success('Relatório salvo com sucesso!');
        if (onSave) onSave();
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
        <h2>Adicionar Relatório Diário - {residente.nome}</h2>
        <form onSubmit={handleSubmit} className="report-form">
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

export default AddDailyReportModal;