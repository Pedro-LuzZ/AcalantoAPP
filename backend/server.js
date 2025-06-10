const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

const dbPath = path.resolve(__dirname, 'database', 'acalanto.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

app.use(cors());
app.use(express.json());

// --- ROTAS DA API PARA PACIENTES ---

app.get('/api/pacientes', (req, res) => {
  const sql = "SELECT * FROM pacientes ORDER BY nome";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/pacientes/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM pacientes WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'Paciente não encontrado.' });
    }
  });
});

app.post('/api/pacientes', (req, res) => {
  const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
  }
  const sql = `INSERT INTO pacientes (nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: 'Paciente cadastrado com sucesso!', pacienteId: this.lastID });
  });
});

app.put('/api/pacientes/:id', (req, res) => {
  const { id } = req.params;
  const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
  }
  const sql = `UPDATE pacientes SET nome = ?, idade = ?, quarto = ?, diagnostico = ?, medicamentos = ?, contato_emergencia = ?, data_internacao = ? WHERE id = ?`;
  const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, id];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes > 0) {
      res.json({ message: `Paciente com ID ${id} atualizado com sucesso!`, changes: this.changes });
    } else {
      res.status(404).json({ error: 'Paciente não encontrado para atualização.' });
    }
  });
});

app.delete('/api/pacientes/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM pacientes WHERE id = ?';
  db.run(sql, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes > 0) {
      res.json({ message: `Paciente com ID ${id} deletado com sucesso!`, changes: this.changes });
    } else {
      res.status(404).json({ error: 'Paciente não encontrado para deleção.' });
    }
  });
});

// --- ROTAS DA API PARA RELATÓRIOS ---

app.get('/api/pacientes/:id/relatorios', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM relatorios_diarios WHERE paciente_id = ? ORDER BY data DESC, id DESC";
    db.all(sql, [id], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
});

app.post('/api/pacientes/:id/relatorios', (req, res) => {
  const { id: paciente_id } = req.params;
  const { data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel } = req.body;
  if (!data || !periodo || !hora) {
    return res.status(400).json({ error: 'Os campos "data", "periodo" e "hora" são obrigatórios.' });
  }
  const sql = `INSERT INTO relatorios_diarios (paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: 'Relatório diário cadastrado com sucesso!', relatorioId: this.lastID });
  });
});

// NOVA ROTA PARA BUSCAR TODOS OS RELATÓRIOS
app.get('/api/relatorios', (req, res) => {
    const sql = `
      SELECT 
        r.id, 
        r.data, 
        r.hora, 
        r.periodo, 
        r.observacoes, 
        r.responsavel, 
        r.paciente_id,
        p.nome as paciente_nome 
      FROM 
        relatorios_diarios r 
      JOIN 
        pacientes p ON r.paciente_id = p.id 
      ORDER BY 
        r.data DESC, r.id DESC`;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
});


app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta http://localhost:${PORT}`);
});