// frontend/src/components/AddReportForm.jsx

import { useState } from 'react';
import '../App.css';

// Funções para pegar data e hora
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

function AddReportForm({ onReportSubmit }) { // Recebe a função de submit como propriedade
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
    onReportSubmit(novoRelatorio); // Chama a função do componente pai, passando os dados
    // Limpa o formulário após o envio
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
  };

  return (
    <form onSubmit={handleSubmit} className="report-form">
      <h2>Adicionar Relatório Diário</h2>
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
      <button type="submit" className="save-btn">Salvar Relatório</button>
    </form>
  );
}

export default AddReportForm;