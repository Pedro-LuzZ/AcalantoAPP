import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function ResidentList() {
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:3001/api/pacientes')
      .then(response => {
        setResidentes(response.data);
      })
      .catch(error => {
        toast.error('Não foi possível carregar a lista de residentes.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // A função handleDelete foi REMOVIDA daqui.

  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <h2>Lista de Residentes</h2>
      {residentes.length === 0 ? (
        <p>Nenhum residente ativo cadastrado.</p>
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
                {/* O botão de deletar foi REMOVIDO daqui */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResidentList;