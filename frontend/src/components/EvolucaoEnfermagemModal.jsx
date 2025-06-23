import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../App.css';

// Funções auxiliares para data e hora
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

function EvolucaoEnfermagemModal({ residente, closeModal, onSave }) {
  const { usuario } = useAuth();

  // Estado inicial com todos os campos do formulário
  const getInitialState = () => ({
    data_ocorrencia: getTodayDateString(),
    hora: getCurrentTimeString(),
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

  // Função única para lidar com todos os tipos de input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Para grupos de checkboxes (múltipla escolha)
    if (type === 'checkbox') {
      const currentValues = formData[name] || [];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter(item => item !== value);
      setFormData(prevState => ({ ...prevState, [name]: newValues }));
    } else {
    // Para todos os outros (text, radio, number, select, etc)
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  // Função para enviar o formulário para a API
  const handleSubmit = (event) => {
    event.preventDefault();
    // A URL corrigida aponta para /api/pacientes/...
    axios.post(`http://localhost:3001/api/pacientes/${residente.id}/evolucoes-enfermagem`, formData)
      .then(() => {
        toast.success("Evolução de enfermagem salva com sucesso!");
        if (onSave) onSave(); // Avisa o componente pai para recarregar os dados
        closeModal(); // Fecha o modal
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
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data_ocorrencia">Data</label>
                <input id="data_ocorrencia" type="date" name="data_ocorrencia" value={formData.data_ocorrencia} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="hora_ocorrencia">Hora</label>
                <input id="hora_ocorrencia" type="time" name="hora" value={formData.hora} onChange={handleChange} />
              </div>
            </div>

            <fieldset>
                <legend>Grau de Dependência</legend>
                <div className="input-group-row">
                  <div className="input-group"><input type="radio" id="grau1" name="grau_dependencia" value="GRAU I" checked={formData.grau_dependencia === 'GRAU I'} onChange={handleChange} /><label htmlFor="grau1">GRAU I</label></div>
                  <div className="input-group"><input type="radio" id="grau2" name="grau_dependencia" value="GRAU II" checked={formData.grau_dependencia === 'GRAU II'} onChange={handleChange} /><label htmlFor="grau2">GRAU II</label></div>
                  <div className="input-group"><input type="radio" id="grau3" name="grau_dependencia" value="GRAU III" checked={formData.grau_dependencia === 'GRAU III'} onChange={handleChange} /><label htmlFor="grau3">GRAU III</label></div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Mobilidade / Deambulação</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="radio" id="acamado" name="mobilidade" value="Acamado" checked={formData.mobilidade === 'Acamado'} onChange={handleChange} /><label htmlFor="acamado">Acamado</label></div>
                    <div className="input-group"><input type="radio" id="cadeirante" name="mobilidade" value="Cadeirante" checked={formData.mobilidade === 'Cadeirante'} onChange={handleChange} /><label htmlFor="cadeirante">Cadeirante</label></div>
                    <div className="input-group"><input type="radio" id="deamb_sa" name="mobilidade" value="Deambula s/ auxílio" checked={formData.mobilidade === 'Deambula s/ auxílio'} onChange={handleChange} /><label htmlFor="deamb_sa">Deambula s/ auxílio</label></div>
                    <div className="input-group"><input type="radio" id="deamb_ca" name="mobilidade" value="Deambula c/ auxílio" checked={formData.mobilidade === 'Deambula c/ auxílio'} onChange={handleChange} /><label htmlFor="deamb_ca">Deambula c/ auxílio</label></div>
                </div>
            </fieldset>
            
            <fieldset>
                <legend>Nível de Consciência</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" id="lucido" name="nivel_consciencia" value="Lúcido" onChange={handleChange} /><label htmlFor="lucido">Lúcido</label></div>
                    <div className="input-group"><input type="checkbox" id="orientado" name="nivel_consciencia" value="Orientado" onChange={handleChange} /><label htmlFor="orientado">Orientado</label></div>
                    <div className="input-group"><input type="checkbox" id="letargico" name="nivel_consciencia" value="Letárgico/Sonolento" onChange={handleChange} /><label htmlFor="letargico">Letárgico/Sonolento</label></div>
                    <div className="input-group"><input type="checkbox" id="comunicativo" name="nivel_consciencia" value="Comunicativo" onChange={handleChange} /><label htmlFor="comunicativo">Comunicativo</label></div>
                    <div className="input-group"><input type="checkbox" id="contactuante" name="nivel_consciencia" value="Contactuante" onChange={handleChange} /><label htmlFor="contactuante">Contactuante</label></div>
                    <div className="input-group"><input type="checkbox" id="nao_contactuante" name="nivel_consciencia" value="Não contactuante" onChange={handleChange} /><label htmlFor="nao_contactuante">Não contactuante</label></div>
                    <div className="input-group"><input type="checkbox" id="desorientado" name="nivel_consciencia" value="Desorientado" onChange={handleChange} /><label htmlFor="desorientado">Desorientado</label></div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Pele e Mucosa</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" name="pele_e_mucosa" value="Íntegra" onChange={handleChange}/><label>Íntegra</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_e_mucosa" value="Corado" onChange={handleChange}/><label>Corado</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_e_mucosa" value="Hidratado" onChange={handleChange}/><label>Hidratado</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_e_mucosa" value="Hipocorado" onChange={handleChange}/><label>Hipocorado</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_e_mucosa" value="Desidratado" onChange={handleChange}/><label>Desidratado</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_e_mucosa" value="Ictérico" onChange={handleChange}/><label>Ictérico</label></div>
                </div>
                <input type="text" name="lesao_pressao_local" placeholder="Lesão por pressão, Local:" value={formData.lesao_pressao_local} onChange={handleChange} style={{marginTop: '10px'}}/>
            </fieldset>

            <fieldset>
                <legend>Padrão Respiratório e Tosse</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" name="padrao_respiratorio" value="Eupneico" onChange={handleChange} /><label>Eupneico</label></div>
                    <div className="input-group"><input type="checkbox" name="padrao_respiratorio" value="Dispneico" onChange={handleChange} /><label>Dispneico</label></div>
                    <div className="input-group"><input type="checkbox" name="padrao_respiratorio" value="Em uso O2" onChange={handleChange} /><label>Em uso O2</label></div>
                </div>
                <input type="text" name="alteracoes_respiratorias" placeholder="Outras alterações respiratórias" value={formData.alteracoes_respiratorias} onChange={handleChange} style={{marginTop: '10px'}}/>
                <div className="input-group-row" style={{marginTop: '10px'}}>
                    <label style={{fontWeight: 'bold', marginRight: '10px'}}>Tosse:</label>
                    <div className="input-group"><input type="radio" id="tosse_p" name="tosse" value="Produtiva" checked={formData.tosse === 'Produtiva'} onChange={handleChange}/><label htmlFor="tosse_p">Produtiva</label></div>
                    <div className="input-group"><input type="radio" id="tosse_s" name="tosse" value="Seca" checked={formData.tosse === 'Seca'} onChange={handleChange}/><label htmlFor="tosse_s">Seca</label></div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Alimentação</legend>
                <div className="form-group">
                    <label>Via:</label>
                    <div className="input-group-row">
                        <div className="input-group"><input type="radio" id="via_oral" name="alimentacao_via" value="Via oral" checked={formData.alimentacao_via === 'Via oral'} onChange={handleChange} /><label htmlFor="via_oral">Via oral</label></div>
                        <div className="input-group"><input type="radio" id="via_sng" name="alimentacao_via" value="Via SNG" checked={formData.alimentacao_via === 'Via SNG'} onChange={handleChange} /><label htmlFor="via_sng">Via SNG</label></div>
                        <div className="input-group"><input type="radio" id="via_gtt" name="alimentacao_via" value="Via GTT" checked={formData.alimentacao_via === 'Via GTT'} onChange={handleChange} /><label htmlFor="via_gtt">Via GTT</label></div>
                    </div>
                </div>
                <div className="form-group">
                    <label>Aceitação:</label>
                    <div className="input-group-row">
                        <div className="input-group"><input type="radio" id="aceita_b" name="alimentacao_aceitacao" value="Boa aceitação" checked={formData.alimentacao_aceitacao === 'Boa aceitação'} onChange={handleChange} /><label htmlFor="aceita_b">Boa aceitação</label></div>
                        <div className="input-group"><input type="radio" id="aceita_p" name="alimentacao_aceitacao" value="Aceita parcialmente" checked={formData.alimentacao_aceitacao === 'Aceita parcialmente'} onChange={handleChange} /><label htmlFor="aceita_p">Aceita parcialmente</label></div>
                        <div className="input-group"><input type="radio" id="aceita_n" name="alimentacao_aceitacao" value="Não aceitou" checked={formData.alimentacao_aceitacao === 'Não aceitou'} onChange={handleChange} /><label htmlFor="aceita_n">Não aceitou</label></div>
                    </div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Eliminações Fisiológicas</legend>
                <div className="form-group">
                    <label>Vesical (Urina):</label>
                    <div className="form-grid">
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Presentes" onChange={handleChange}/><label>Presentes</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Ausentes" onChange={handleChange}/><label>Ausentes</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Espontânea" onChange={handleChange}/><label>Espontânea</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Fralda" onChange={handleChange}/><label>Fralda</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="SVD" onChange={handleChange}/><label>SVD</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Anúria" onChange={handleChange}/><label>Anúria</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Disúria" onChange={handleChange}/><label>Disúria</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_vesical" value="Hematúria" onChange={handleChange}/><label>Hematúria</label></div>
                    </div>
                </div>
                <div className="form-group">
                    <label>Intestinal (Fezes):</label>
                    <div className="form-grid">
                        <div className="input-group"><input type="checkbox" name="eliminacao_intestinal" value="Presente" onChange={handleChange}/><label>Presente</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_intestinal" value="Ausente" onChange={handleChange}/><label>Ausente</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_intestinal" value="Diarréia" onChange={handleChange}/><label>Diarréia</label></div>
                        <div className="input-group"><input type="checkbox" name="eliminacao_intestinal" value="Constipação" onChange={handleChange}/><label>Constipação</label></div>
                    </div>
                    <input type="number" name="constipacao_dias" placeholder="Dias de constipação" value={formData.constipacao_dias} onChange={handleChange} style={{marginTop: '10px'}}/>
                </div>
            </fieldset>

            <fieldset>
                <legend>Sono e Repouso</legend>
                <div className="input-group-row">
                    <div className="input-group"><input type="radio" id="sono_sat" name="sono_repouso" value="Satisfatório" checked={formData.sono_repouso === 'Satisfatório'} onChange={handleChange}/><label htmlFor="sono_sat">Satisfatório</label></div>
                    <div className="input-group"><input type="radio" id="sono_insat" name="sono_repouso" value="Insatisfatório" checked={formData.sono_repouso === 'Insatisfatório'} onChange={handleChange}/><label htmlFor="sono_insat">Insatisfatório</label></div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Estado Geral</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="radio" id="ssvv_e" name="estado_geral" value="SSVV estáveis" checked={formData.estado_geral === 'SSVV estáveis'} onChange={handleChange}/><label htmlFor="ssvv_e">SSVV estáveis</label></div>
                    <div className="input-group"><input type="radio" id="ssvv_a" name="estado_geral" value="SSVV alterado" checked={formData.estado_geral === 'SSVV alterado'} onChange={handleChange}/><label htmlFor="ssvv_a">SSVV alterado</label></div>
                    <div className="input-group"><input type="radio" id="beg" name="estado_geral" value="BEG" checked={formData.estado_geral === 'BEG'} onChange={handleChange}/><label htmlFor="beg">BEG</label></div>
                    <div className="input-group"><input type="radio" id="meg" name="estado_geral" value="MEG" checked={formData.estado_geral === 'MEG'} onChange={handleChange}/><label htmlFor="meg">MEG</label></div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Dor</legend>
                <div className="input-group-row">
                    <div className="input-group"><input type="radio" id="dor_ausente" name="dor_status" value="Ausente" checked={formData.dor_status === 'Ausente'} onChange={handleChange}/><label htmlFor="dor_ausente">Ausente</label></div>
                    <div className="input-group"><input type="radio" id="dor_presente" name="dor_status" value="Presente" checked={formData.dor_status === 'Presente'} onChange={handleChange}/><label htmlFor="dor_presente">Presente</label></div>
                </div>
                {formData.dor_status === 'Presente' && (
                    <div className="form-row" style={{marginTop: '10px'}}>
                        <input name="dor_grau" type="number" min="0" max="10" placeholder="Grau (0-10)" value={formData.dor_grau} onChange={handleChange} />
                        <input name="dor_local" type="text" placeholder="Local da dor" value={formData.dor_local} onChange={handleChange} />
                    </div>
                )}
            </fieldset>

            <fieldset>
                <legend>Observações / Queixas</legend>
                <textarea name="observacoes" placeholder="Descreva aqui as observações e queixas..." value={formData.observacoes} onChange={handleChange} style={{minHeight: '100px'}} />
            </fieldset>

            <div className="form-group">
                <label>Enfª Responsável</label>
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