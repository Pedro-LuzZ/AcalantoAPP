import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function EvolucaoEnfermagemModal({ residente, closeModal, onSave }) {
  const { usuario } = useAuth();

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const getInitialState = () => ({
    data_ocorrencia: getTodayDateString(),
    grau_dependencia: '',
    mobilidade: '',
    nivel_consciencia: [],
    pele_e_mucosa: [],
    lesao_pressao_local: '',
    padrao_respiratorio: [],
    alteracoes_respiratorias: '',
    tosse: '',
    alimentacao_via: '',
    alimentacao_aceitacao: '',
    eliminacao_vesical: [],
    eliminacao_intestinal: [],
    constipacao_dias: '',
    sono_repouso: '',
    estado_geral: '',
    dor_status: 'Ausente',
    dor_grau: '',
    dor_local: '',
    observacoes: '',
    responsavel_nome: usuario?.nome || ''
  });

  const [formData, setFormData] = useState(getInitialState());

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const currentValues = formData[name] || [];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter(item => item !== value);
      setFormData(prevState => ({ ...prevState, [name]: newValues }));
    } else {
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    api.post(`/pacientes/${residente.id}/evolucoes-enfermagem`, formData)
      .then(() => {
        toast.success("Evolução de enfermagem salva com sucesso!");
        if (onSave) onSave();
        closeModal();
      })
      .catch(err => {
        console.error("Erro ao salvar evolução:", err);
        toast.error("Falha ao salvar a evolução de enfermagem.");
      });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Evolução de Enfermagem - {residente.nome}</h2>
        <form onSubmit={handleSubmit} className="report-form evolution-form">
            <div className="form-group">
                <label htmlFor="data_ocorrencia_enf">Data</label>
                <input id="data_ocorrencia_enf" type="date" name="data_ocorrencia" value={formData.data_ocorrencia} onChange={handleChange} />
            </div>
            <fieldset>
                <legend>Grau de Dependência</legend>
                <div className="input-group-row">
                    <div className="input-group"><input type="radio" id="enf_grau1" name="grau_dependencia" value="GRAU I" checked={formData.grau_dependencia === 'GRAU I'} onChange={handleChange} /><label htmlFor="enf_grau1">GRAU I</label></div>
                    <div className="input-group"><input type="radio" id="enf_grau2" name="grau_dependencia" value="GRAU II" checked={formData.grau_dependencia === 'GRAU II'} onChange={handleChange} /><label htmlFor="enf_grau2">GRAU II</label></div>
                    <div className="input-group"><input type="radio" id="enf_grau3" name="grau_dependencia" value="GRAU III" checked={formData.grau_dependencia === 'GRAU III'} onChange={handleChange} /><label htmlFor="enf_grau3">GRAU III</label></div>
                </div>
            </fieldset>

            <fieldset>
              <legend>Nível de Consciência</legend>
              <div className="form-grid">
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Lúcido" onChange={handleChange} /><label>Lúcido</label></div>
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Orientado" onChange={handleChange} /><label>Orientado</label></div>
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Letárgico/Sonolento" onChange={handleChange} /><label>Letárgico/Sonolento</label></div>
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Comunicativo" onChange={handleChange} /><label>Comunicativo</label></div>
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Contactuante" onChange={handleChange} /><label>Contactuante</label></div>
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Não contactuante" onChange={handleChange} /><label>Não contactuante</label></div>
                  <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Desorientado" onChange={handleChange} /><label>Desorientado</label></div>
              </div>
            </fieldset>
            
            <fieldset>
                <legend>Observações / Queixas</legend>
                <textarea name="observacoes" placeholder="Descreva aqui as observações e queixas..." value={formData.observacoes} onChange={handleChange} style={{minHeight: '100px'}}/>
            </fieldset>

            <div className="form-group">
                <label>Enfermeiro(a) Responsável</label>
                <input type="text" name="responsavel_nome" value={formData.responsavel_nome} readOnly disabled style={{backgroundColor: '#e9ecef'}}/>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="save-btn">Salvar Evolução</button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default EvolucaoEnfermagemModal;