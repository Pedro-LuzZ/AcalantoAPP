import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import '../App.css';

function ResidentList() {
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResidentes = () => {
    setLoading(true);
    // Busca apenas os residentes com status 'ativo'
    api.get('/pacientes')
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

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2>Lista de Residentes Ativos</h2>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResidentList;