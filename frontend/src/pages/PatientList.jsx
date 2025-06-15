import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'; // Importa o 'toast'
import '../App.css';

function PatientList() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPacientes = () => {
    setLoading(true);
    axios.get('http://localhost:3001/api/pacientes')
      .then(response => {
        setPacientes(response.data);
      })
      .catch(error => {
        console.error('Houve um erro ao buscar os pacientes:', error);
        toast.error('Não foi possível carregar a lista de pacientes.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja deletar este paciente? Esta ação não pode ser desfeita.")) {
      axios.delete(`http://localhost:3001/api/pacientes/${id}`)
        .then(() => {
          setPacientes(pacientes.filter(paciente => paciente.id !== id));
          // Substituímos o alert por uma notificação de sucesso
          toast.success('Paciente deletado com sucesso!');
        })
        .catch(error => {
          console.error('Houve um erro ao deletar o paciente:', error);
          // Substituímos o alert por uma notificação de erro
          toast.error('Não foi possível deletar o paciente.');
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
      <h2>Lista de Pacientes</h2>
      {pacientes.length === 0 ? (
        <p>Nenhum paciente cadastrado ainda.</p>
      ) : (
        <ul className="patient-list">
          {pacientes.map(paciente => (
            <li key={paciente.id}>
              <div>
                <Link to={`/paciente/${paciente.id}`}>
                  <strong>{paciente.nome}</strong>
                </Link>
                <span> (Idade: {paciente.idade || 'N/A'}, Quarto: {paciente.quarto || 'N/A'})</span>
              </div>
              <div className="patient-actions">
                <Link to={`/paciente/${paciente.id}`} className="edit-btn">Ver Detalhes</Link>
                <button onClick={() => handleDelete(paciente.id)} className="delete-btn">Deletar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PatientList;