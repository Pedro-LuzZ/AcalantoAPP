// frontend/src/components/AddDailyReportModal.jsx

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

// Funções para data e hora
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// O componente agora recebe o residente, uma função para fechar e uma para salvar
function AddDailyReportModal({ residente, closeModal, onSave }) {
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
    axios.post(`http://localhost:3001/api/pacientes/${residente.id}/relatorios`, novoRelatorio)
      .then(() => {
        toast.success('Relatório salvo com sucesso!');
        if (onSave) onSave(); // Avisa o componente pai para atualizar os dados
        closeModal(); // Fecha o modal
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
              <option value="Manhã">Diurno</option>
              <option value="Noite">Noturno</option>
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