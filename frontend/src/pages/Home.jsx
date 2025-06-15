// frontend/src/pages/Home.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

function Home() {
  // Estado inicial com todos os campos do paciente, incluindo os do familiar
  const [novoPaciente, setNovoPaciente] = useState({
    nome: '',
    idade: '',
    quarto: '',
    diagnostico: '',
    medicamentos: '',
    contato_emergencia: '',
    data_internacao: '',
    responsavel_familiar_nome: '',
    responsavel_familiar_contato: ''
  });
  
  const navigate = useNavigate(); // Hook para navegar entre páginas

  // Função para atualizar o estado conforme o usuário digita
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNovoPaciente({ ...novoPaciente, [name]: value });
  };

  // Função para enviar o formulário para a API
  const handleSubmit = (event) => {
    event.preventDefault(); // Impede o recarregamento padrão da página
    axios.post('http://localhost:3001/api/pacientes', novoPaciente)
      .then(() => {
        toast.success('Paciente cadastrado com sucesso!');
        // Limpa o formulário
        setNovoPaciente({
            nome: '', idade: '', quarto: '', diagnostico: '', medicamentos: '',
            contato_emergencia: '', data_internacao: '', responsavel_familiar_nome: '', responsavel_familiar_contato: ''
        });
        // Redireciona para a lista de pacientes após o cadastro
        navigate('/pacientes');
      })
      .catch(error => {
        console.error('Houve um erro ao cadastrar o paciente:', error);
        toast.error('Erro ao cadastrar paciente.');
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="patient-form">
        <h2>Cadastrar Novo Paciente</h2>
        
        <input type="text" name="nome" placeholder="Nome do Paciente" value={novoPaciente.nome} onChange={handleInputChange} required />
        <input type="number" name="idade" placeholder="Idade" value={novoPaciente.idade} onChange={handleInputChange} />
        <input type="text" name="quarto" placeholder="Quarto" value={novoPaciente.quarto} onChange={handleInputChange} />
        <input type="text" name="diagnostico" placeholder="Diagnóstico" value={novoPaciente.diagnostico} onChange={handleInputChange} />
        <textarea name="medicamentos" placeholder="Medicamentos" value={novoPaciente.medicamentos} onChange={handleInputChange} style={{minHeight: '60px'}}></textarea>
        <input type="text" name="contato_emergencia" placeholder="Contato de Emergência (Equipe)" value={novoPaciente.contato_emergencia} onChange={handleInputChange} />
        
        <div className="form-group">
          <label htmlFor="data_internacao">Data de Internação:</label>
          <input type="date" name="data_internacao" id="data_internacao" value={novoPaciente.data_internacao} onChange={handleInputChange} />
        </div>

        <div className="form-section">
          <input type="text" name="responsavel_familiar_nome" placeholder="Nome do Familiar Responsável" value={novoPaciente.responsavel_familiar_nome} onChange={handleInputChange} />
          <input type="text" name="responsavel_familiar_contato" placeholder="Contato do Familiar (Telefone)" value={novoPaciente.responsavel_familiar_contato} onChange={handleInputChange} />
        </div>

        <button type="submit">Cadastrar Paciente</button>
      </form>
    </div>
  );
}

export default Home;