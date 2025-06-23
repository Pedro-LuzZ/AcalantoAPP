import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function HigieneReportModal({ residente, closeModal, onSave }) {
  const { usuario } = useAuth();

  // Funções para obter data e hora atuais
  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const getCurrentTimeString = () => new Date().toTimeString().substring(0, 5);

  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    data_ocorrencia: getTodayDateString(),
    hora_ocorrencia: getCurrentTimeString(),
    banho_corporal: false,
    banho_parcial: false,
    higiene_intima: false,
    observacoes: '',
    responsavel_nome: usuario?.nome || ''
  });

  // Lida com mudanças nos inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Lida com o envio do formulário
  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post(`http://localhost:3001/api/pacientes/${residente.id}/higiene`, formData)
      .then(() => {
        toast.success("Relatório de higiene salvo com sucesso!");
        if (onSave) onSave(); // Avisa a página pai para recarregar os dados
        closeModal(); // Fecha o modal
      })
      .catch(err => {
        console.error("Erro ao salvar relatório de higiene:", err);
        toast.error("Falha ao salvar relatório de higiene.");
      });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Relatório de Higiene - {residente.nome}</h2>
        <form onSubmit={handleSubmit} className="report-form evolution-form">
            <div className="form-row">
                <div className="form-group">
                    <label>Data</label>
                    <input type="date" name="data_ocorrencia" value={formData.data_ocorrencia} onChange={handleChange} required/>
                </div>
                <div className="form-group">
                    <label>Hora</label>
                    <input type="time" name="hora_ocorrencia" value={formData.hora_ocorrencia} onChange={handleChange} required/>
                </div>
            </div>
            <fieldset>
                <legend>Tipos de Higienização Realizados</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" id="bc" name="banho_corporal" checked={formData.banho_corporal} onChange={handleChange} /><label htmlFor="bc">BC - Banho Corporal</label></div>
                    <div className="input-group"><input type="checkbox" id="bp" name="banho_parcial" checked={formData.banho_parcial} onChange={handleChange} /><label htmlFor="bp">BP - Banho Parcial</label></div>
                    <div className="input-group"><input type="checkbox" id="hi" name="higiene_intima" checked={formData.higiene_intima} onChange={handleChange} /><label htmlFor="hi">HI - Higiene Íntima</label></div>
                </div>
            </fieldset>
            <fieldset>
                <legend>Observações</legend>
                <textarea name="observacoes" placeholder="Adicione observações, se necessário..." value={formData.observacoes} onChange={handleChange} />
            </fieldset>
             <div className="form-group">
                <label>Responsável</label>
                <input type="text" name="responsavel_nome" value={formData.responsavel_nome} readOnly disabled style={{backgroundColor: '#e9ecef'}}/>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="save-btn">Salvar Relatório</button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default HigieneReportModal;