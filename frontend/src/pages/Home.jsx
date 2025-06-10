// frontend/src/pages/Home.jsx

import { useState } from 'react';
import axios from 'axios';
import '../App.css';

function Home() {
  const [novoPaciente, setNovoPaciente] = useState({ nome: '', idade: '', quarto: '', diagnostico: '', medicamentos: '' });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNovoPaciente({ ...novoPaciente, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post('http://localhost:3001/api/pacientes', novoPaciente)
      .then(() => {
        alert('Paciente cadastrado com sucesso!');
        setNovoPaciente({ nome: '', idade: '', quarto: '', diagnostico: '', medicamentos: '' });
      })
      .catch(error => {
        console.error('Houve um erro ao cadastrar o paciente:', error);
        alert('Erro ao cadastrar paciente.');
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
        <input type="text" name="medicamentos" placeholder="Medicamentos" value={novoPaciente.medicamentos} onChange={handleInputChange} />
        <button type="submit">Cadastrar Paciente</button>
      </form>
    </div>
  );
}

export default Home;