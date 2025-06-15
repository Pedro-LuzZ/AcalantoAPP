// frontend/src/pages/LoginPage.jsx

import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Importamos nosso hook de autenticação
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Reutilizando nosso CSS

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(''); // Estado para guardar mensagens de erro

  const { login } = useAuth(); // Pegamos a função de login do nosso contexto
  const navigate = useNavigate(); // Hook para nos permitir navegar entre páginas

  const handleSubmit = async (event) => {
    event.preventDefault(); // Impede o recarregamento da página
    setError(''); // Limpa erros anteriores

    try {
      // (Ainda não implementamos a função login, faremos isso no próximo passo)
      await login(email, senha);
      // Se o login for bem-sucedido, navega para a lista de pacientes
      navigate('/pacientes'); 
    } catch (err) {
      // Se o login falhar, mostra uma mensagem de erro
      setError('Falha no login. Verifique seu email e senha.');
      console.error("Erro no login:", err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="patient-form">
        <h2>Login do Sistema</h2>
        {error && <p className="error-message">{error}</p>}
        
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <label htmlFor="senha">Senha:</label>
        <input
          type="password"
          id="senha"
          name="senha"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default LoginPage;