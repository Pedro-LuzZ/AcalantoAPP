// frontend/src/pages/PatientList.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function PatientList() {
  const [pacientes, setPacientes] = useState([]);
  // (A lógica de edição pode ser movida para cá também no futuro)

  const fetchPacientes = () => {
    axios.get('http://localhost:3001/api/pacientes')
      .then(response => {
        setPacientes(response.data);
      })
      .catch(error => {
        console.error('Houve um erro ao buscar os pacientes:', error);
      });
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja deletar este paciente?")) {
      axios.delete(`http://localhost:3001/api/pacientes/${id}`)
        .then(() => {
          setPacientes(pacientes.filter(paciente => paciente.id !== id));
        })
        .catch(error => {
          console.error('Houve um erro ao deletar o paciente:', error);
        });
    }
  };

  return (
    <div>
      <h2>Lista de Pacientes</h2>
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
              {/* O botão de editar levará para a página de detalhes no futuro */}
              <Link to={`/paciente/${paciente.id}`} className="edit-btn">Ver/Editar</Link>
              <button onClick={() => handleDelete(paciente.id)} className="delete-btn">Deletar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PatientList;