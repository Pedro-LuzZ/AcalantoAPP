import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function ResidentList() {
  const { usuario } = useAuth();
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResidentes = () => {
    setLoading(true);
    axios.get('http://localhost:3001/api/pacientes')
      .then(response => {
        setResidentes(response.data);
      })
      .catch(error => {
        console.error('Houve um erro ao buscar os residentes:', error);
        toast.error('Não foi possível carregar a lista de residentes.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResidentes();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja deletar este residente? Esta ação não pode ser desfeita.")) {
      axios.delete(`http://localhost:3001/api/pacientes/${id}`)
        .then(() => {
          setResidentes(residentes.filter(residente => residente.id !== id));
          toast.success('Residente deletado com sucesso!');
        })
        .catch(error => {
          console.error('Houve um erro ao deletar o residente:', error);
          toast.error(error.response?.data?.error || 'Não foi possível deletar o residente.');
        });
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2>Lista de Residentes</h2>
      {residentes.length === 0 ? (
        <p>Nenhum residente cadastrado ainda.</p>
      ) : (
        <ul className="patient-list">
          {residentes.map(residente => (
            <li key={residente.id}>
              <div>
                <Link to={`/paciente/${residente.id}`}>
                  <strong>{residente.nome}</strong>
                </Link>
                <span> (Idade: {residente.idade || 'N/A'}, Quarto: {residente.quarto || 'N/A'})</span>
              </div>
              <div className="patient-actions">
                <Link to={`/paciente/${residente.id}`} className="edit-btn">Ver Detalhes</Link>
                {usuario && usuario.role === 'admin' && (
                  <button onClick={() => handleDelete(residente.id)} className="delete-btn">Deletar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResidentList;