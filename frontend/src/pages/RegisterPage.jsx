// frontend/src/pages/RegisterPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function RegisterPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await axios.post('http://localhost:3001/api/usuarios/registrar', {
        nome,
        email,
        senha,
      });

      alert('Usuário registrado com sucesso! Você será redirecionado para a página de login.');
      navigate('/login'); // Redireciona para o login após o sucesso

    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); // Pega o erro específico do backend
      } else {
        setError('Ocorreu uma falha ao registrar.');
      }
      console.error("Erro no registro:", err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="patient-form">
        <h2>Registrar Novo Usuário</h2>
        {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
        
        <label htmlFor="nome">Nome Completo:</label>
        <input
          type="text"
          id="nome"
          name="nome"
          placeholder="Nome do novo usuário"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <label htmlFor="senha">Senha:</label>
        <input
          type="password"
          id="senha"
          name="senha"
          placeholder="Crie uma senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default RegisterPage;