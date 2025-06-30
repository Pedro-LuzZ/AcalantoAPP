import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // << MUDOU
import { toast } from 'react-toastify';
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
      await api.post('/usuarios/registrar', { // << MUDOU
        nome,
        email,
        senha,
      });
      toast.success('Usuário registrado com sucesso! Você será redirecionado para a página de login.');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ocorreu uma falha ao registrar.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Erro no registro:", err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="patient-form">
        <h2>Registrar Novo Usuário</h2>
        {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
        <label htmlFor="nome">Nome Completo:</label>
        <input id="nome" type="text" name="nome" placeholder="Nome do novo usuário" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <label htmlFor="email">Email:</label>
        <input id="email" type="email" name="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="senha">Senha:</label>
        <input id="senha" type="password" name="senha" placeholder="Crie uma senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default RegisterPage;