import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api'; // MUDANÇA AQUI
import { useAuth } from '../context/AuthContext';
import '../App.css';

function EvolucaoTecnicoModal({ residente, closeModal, onSave }) {
  const { usuario } = useAuth();

  const getInitialState = () => ({
    data_ocorrencia: new Date().toISOString().split('T')[0],
    turno: 'Diurno',
    nivel_consciencia: [],
    pele_mucosa: [],
    lpp_local: '',
    padrao_respiratorio: [],
    fr: '',
    em_uso_o2: false,
    tosse: '',
    alimentacao_via: '',
    alimentacao_aceitacao: '',
    sono_repouso: '',
    cuidado_banho: '',
    cuidado_deambulacao: '',
    cuidado_curativo: false,
    curativo_local: '',
    cuidados_outros: [],
    observacoes: '',
    responsavel_nome: usuario?.nome || ''
  });

  const [formData, setFormData] = useState(getInitialState());

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    if (type === 'checkbox') {
      if (typeof formData[name] === 'boolean') {
        finalValue = checked;
      } else {
        const currentValues = formData[name] || [];
        finalValue = checked ? [...currentValues, value] : currentValues.filter(item => item !== value);
      }
    }
    setFormData(prevState => ({ ...prevState, [name]: finalValue }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    api.post(`/pacientes/${residente.id}/evolucao-tecnico`, formData) // MUDANÇA AQUI
      .then(() => {
        toast.success("Evolução do técnico salva com sucesso!");
        if (onSave) onSave();
        closeModal();
      })
      .catch(err => {
        console.error("Erro ao salvar evolução do técnico:", err);
        toast.error("Falha ao salvar a evolução do técnico.");
      });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Evolução do Técnico - {residente.nome}</h2>
        <form onSubmit={handleSubmit} className="report-form evolution-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data_ocorrencia_tec">Data</label>
                <input id="data_ocorrencia_tec" type="date" name="data_ocorrencia" value={formData.data_ocorrencia} onChange={handleChange} required/>
              </div>
              <fieldset style={{border: 'none', padding: 0}}>
                  <legend>Turno</legend>
                  <div className="input-group-row">
                      <div className="input-group"><input type="radio" id="turno_d_tec" name="turno" value="Diurno" checked={formData.turno === 'Diurno'} onChange={handleChange} /><label htmlFor="turno_d_tec">Diurno</label></div>
                      <div className="input-group"><input type="radio" id="turno_n_tec" name="turno" value="Noturno" checked={formData.turno === 'Noturno'} onChange={handleChange} /><label htmlFor="turno_n_tec">Noturno</label></div>
                  </div>
              </fieldset>
            </div>
            <fieldset>
                <legend>Nível de Consciência</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Alerta/Acordado" onChange={handleChange} /><label>Alerta/Acordado</label></div>
                    <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Letárgico/Sonolento" onChange={handleChange} /><label>Letárgico/Sonolento</label></div>
                    <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Orientado" onChange={handleChange} /><label>Orientado</label></div>
                    <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Desorientado" onChange={handleChange} /><label>Desorientado</label></div>
                    <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Contactuante" onChange={handleChange} /><label>Contactuante</label></div>
                    <div className="input-group"><input type="checkbox" name="nivel_consciencia" value="Não Contactuante" onChange={handleChange} /><label>Não Contactuante</label></div>
                </div>
            </fieldset>
            <fieldset>
                <legend>Pele e Mucosa</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" name="pele_mucosa" value="Íntegra" onChange={handleChange}/><label>Íntegra</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_mucosa" value="Corado" onChange={handleChange}/><label>Corado</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_mucosa" value="Icterícia" onChange={handleChange}/><label>Icterícia</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_mucosa" value="Hidratado" onChange={handleChange}/><label>Hidratado</label></div>
                    <div className="input-group"><input type="checkbox" name="pele_mucosa" value="Desidratado" onChange={handleChange}/><label>Desidratado</label></div>
                </div>
                <input type="text" name="lpp_local" placeholder="LPP Local:" value={formData.lpp_local} onChange={handleChange} style={{marginTop: '10px'}}/>
            </fieldset>
            <fieldset>
                <legend>Padrão Respiratório</legend>
                <div className="form-grid">
                    <div className="input-group"><input type="checkbox" name="padrao_respiratorio" value="Eupneico" onChange={handleChange} /><label>Eupneico</label></div>
                    <div className="input-group"><input type="checkbox" name="padrao_respiratorio" value="Dispneico" onChange={handleChange} /><label>Dispneico</label></div>
                    <div className="input-group"><input type="checkbox" id="em_uso_o2_tec" name="em_uso_o2" checked={formData.em_uso_o2} onChange={handleChange} /><label htmlFor="em_uso_o2_tec">Em uso O2</label></div>
                </div>
                <div className="form-row" style={{marginTop: '10px'}}>
                    <input type="text" name="alteracoes_respiratorias" placeholder="Alterações respiratórias" value={formData.alteracoes_respiratorias} onChange={handleChange} />
                    <input type="text" name="fr" placeholder="FR:" value={formData.fr} onChange={handleChange} />
                </div>
                <div className="input-group-row" style={{marginTop: '10px'}}>
                    <label style={{fontWeight: 'bold'}}>Tosse:</label>
                    <div className="input-group"><input type="radio" id="tosse_p_tec" name="tosse" value="Produtiva" checked={formData.tosse === 'Produtiva'} onChange={handleChange}/><label htmlFor="tosse_p_tec">Produtiva</label></div>
                    <div className="input-group"><input type="radio" id="tosse_s_tec" name="tosse" value="Seca" checked={formData.tosse === 'Seca'} onChange={handleChange}/><label htmlFor="tosse_s_tec">Seca</label></div>
                </div>
            </fieldset>
            <fieldset>
                <legend>Alimentação</legend>
                <div className="form-group">
                    <label>Via:</label>
                    <div className="input-group-row">
                        <div className="input-group"><input type="radio" name="alimentacao_via" value="Via oral" checked={formData.alimentacao_via === 'Via oral'} onChange={handleChange} /><label>Via oral</label></div>
                        <div className="input-group"><input type="radio" name="alimentacao_via" value="SNG" checked={formData.alimentacao_via === 'SNG'} onChange={handleChange} /><label>SNG</label></div>
                        <div className="input-group"><input type="radio" name="alimentacao_via" value="Gastrostomia" checked={formData.alimentacao_via === 'Gastrostomia'} onChange={handleChange} /><label>Gastrostomia</label></div>
                    </div>
                </div>
                <div className="form-group">
                    <label>Aceitação:</label>
                    <div className="input-group-row">
                        <div className="input-group"><input type="radio" name="alimentacao_aceitacao" value="Boa aceitação" checked={formData.alimentacao_aceitacao === 'Boa aceitação'} onChange={handleChange} /><label>Boa aceitação</label></div>
                        <div className="input-group"><input type="radio" name="alimentacao_aceitacao" value="Aceita parcialmente" checked={formData.alimentacao_aceitacao === 'Aceita parcialmente'} onChange={handleChange} /><label>Aceita parcialmente</label></div>
                        <div className="input-group"><input type="radio" name="alimentacao_aceitacao" value="Não aceitou" checked={formData.alimentacao_aceitacao === 'Não aceitou'} onChange={handleChange} /><label>Não aceitou</label></div>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>Sono e Repouso</legend>
                <div className="input-group-row">
                    <div className="input-group"><input type="radio" name="sono_repouso" value="Satisfatório" checked={formData.sono_repouso === 'Satisfatório'} onChange={handleChange}/><label>Satisfatório</label></div>
                    <div className="input-group"><input type="radio" name="sono_repouso" value="Insatisfatório" checked={formData.sono_repouso === 'Insatisfatório'} onChange={handleChange}/><label>Insatisfatório</label></div>
                </div>
            </fieldset>
            <fieldset>
                <legend>Cuidados Diversos</legend>
                <div className="form-group">
                    <label>A - Banho:</label>
                    <div className="input-group-row">
                        <div className="input-group"><input type="radio" name="cuidado_banho" value="Banho aspersão c/ auxilio" onChange={handleChange} /><label>Banho aspersão c/ auxilio</label></div>
                        <div className="input-group"><input type="radio" name="cuidado_banho" value="Banho de leito" onChange={handleChange} /><label>Banho de leito</label></div>
                    </div>
                </div>
                <div className="form-group">
                    <label>B - Deambulação:</label>
                    <div className="input-group-row">
                        <div className="input-group"><input type="radio" name="cuidado_deambulacao" value="Deambulou c/ auxilio" onChange={handleChange} /><label>Deambulou c/ auxilio</label></div>
                        <div className="input-group"><input type="radio" name="cuidado_deambulacao" value="Não deambula" onChange={handleChange} /><label>Não deambula</label></div>
                        <div className="input-group"><input type="radio" name="cuidado_deambulacao" value="Mudança de decúbito" onChange={handleChange} /><label>Mudança de decúbito</label></div>
                    </div>
                </div>
                <div className="form-group">
                    <div className="input-group"><input type="checkbox" id="curativo_tec" name="cuidado_curativo" checked={formData.cuidado_curativo} onChange={handleChange} /><label htmlFor="curativo_tec">C - Curativo</label></div>
                    {formData.cuidado_curativo && <input type="text" name="curativo_local" placeholder="Local do curativo" value={formData.curativo_local} onChange={handleChange} />}
                </div>
                <div className="form-group">
                    <label>D - Outros:</label>
                    <div className="form-grid">
                        <div className="input-group"><input type="checkbox" name="cuidados_outros" value="Tricotomia facial" onChange={handleChange} /><label>Tricotomia facial</label></div>
                        <div className="input-group"><input type="checkbox" name="cuidados_outros" value="Tricotomia intima" onChange={handleChange} /><label>Tricotomia intima</label></div>
                        <div className="input-group"><input type="checkbox" name="cuidados_outros" value="Corte de unhas" onChange={handleChange} /><label>Corte de unhas</label></div>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>Observações</legend>
                <textarea name="observacoes" placeholder="Observações gerais..." value={formData.observacoes} onChange={handleChange} style={{minHeight: '100px'}} />
            </fieldset>
            <div className="form-group">
                <label>Plantonista Responsável</label>
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

export default EvolucaoTecnicoModal;