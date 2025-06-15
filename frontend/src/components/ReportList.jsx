// frontend/src/components/ReportList.jsx

import React from 'react';
import '../App.css'; // Reutilizando os estilos

function ReportList({ relatorios }) { // Recebe a lista de relatórios como uma propriedade
  return (
    <div className="reports-section">
      <h2>Histórico de Relatórios Diários</h2>
      {relatorios.length > 0 ? (
        <ul className="report-list">
          {relatorios.map(relatorio => (
            <li key={relatorio.id} className="report-item">
              <h3>{new Date(relatorio.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {relatorio.hora} - {relatorio.periodo}</h3>
              <p><strong>Alimentação:</strong> {relatorio.alimentacao}</p>
              <p><strong>Temperatura:</strong> {relatorio.temperatura} °C</p>
              <p><strong>Pressão:</strong> {relatorio.pressao}</p>
              <p><strong>Observações:</strong> {relatorio.observacoes}</p>
              <p><small>Responsável: {relatorio.responsavel}</small></p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum relatório cadastrado para este paciente.</p>
      )}
    </div>
  );
}

export default ReportList;