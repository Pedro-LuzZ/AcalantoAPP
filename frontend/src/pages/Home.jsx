import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api'; // MUDANÇA AQUI
import '../App.css';

function Home() {
  const [novoResidente, setNovoResidente] = useState({
    nome: '',
    idade: '',
    quarto: '',
    diagnostico: '',
    medicamentos: '',
    link_medicamentos: '',
    contato_emergencia: '',
    data_internacao: '',
    responsavel_familiar_nome: '',
    responsavel_familiar_contato: ''
  });
  
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNovoResidente({ ...novoResidente, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    api.post('/pacientes', novoResidente) // MUDANÇA AQUI
      .then(() => {
        toast.success('Residente cadastrado com sucesso!');
        navigate('/pacientes');
      })
      .catch(error => {
        console.error('Houve um erro ao cadastrar o residente:', error);
        toast.error('Erro ao cadastrar residente.');
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="patient-form">
        <h2>Cadastrar Novo Residente</h2>
        <input type="text" name="nome" placeholder="Nome do Residente" value={novoResidente.nome} onChange={handleInputChange} required />
        <input type="number" name="idade" placeholder="Idade" value={novoResidente.idade} onChange={handleInputChange} />
        <input type="text" name="quarto" placeholder="Quarto" value={novoResidente.quarto} onChange={handleInputChange} />
        <input type="text" name="diagnostico" placeholder="Diagnóstico" value={novoResidente.diagnostico} onChange={handleInputChange} />
        <textarea name="medicamentos" placeholder="Medicamentos" value={novoResidente.medicamentos} onChange={handleInputChange} style={{minHeight: '60px'}}></textarea>
        <input type="text" name="link_medicamentos" placeholder="Link da Planilha de Medicamentos" value={novoResidente.link_medicamentos} onChange={handleInputChange} />
        <input type="text" name="contato_emergencia" placeholder="Contato de Emergência (Equipe)" value={novoResidente.contato_emergencia} onChange={handleInputChange} />
        <div className="form-group">
          <label htmlFor="data_internacao">Data de Internação:</label>
          <input type="date" name="data_internacao" id="data_internacao" value={novoResidente.data_internacao} onChange={handleInputChange} />
        </div>
        <div className="form-section">
          <input type="text" name="responsavel_familiar_nome" placeholder="Nome do Familiar Responsável" value={novoResidente.responsavel_familiar_nome} onChange={handleInputChange} />
          <input type="text" name="responsavel_familiar_contato" placeholder="Contato do Familiar (Telefone)" value={novoResidente.responsavel_familiar_contato} onChange={handleInputChange} />
        </div>
        <button type="submit">Cadastrar Residente</button>
      </form>
    </div>
  );
}

export default Home;