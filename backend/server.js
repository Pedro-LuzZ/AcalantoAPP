require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// --- ROTAS DA API PARA PACIENTES ---

app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pacientes ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar paciente.' });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    const sql = `
      INSERT INTO pacientes (nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`;
    const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao cadastrar paciente.' });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    const sql = `
      UPDATE pacientes 
      SET nome = $1, idade = $2, quarto = $3, diagnostico = $4, medicamentos = $5, contato_emergencia = $6, data_internacao = $7, responsavel_familiar_nome = $8, responsavel_familiar_contato = $9 
      WHERE id = $10 
      RETURNING *`;
    const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, id];
    const result = await pool.query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado para atualização.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao atualizar paciente.' });
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado para deleção.' });
    }
    res.status(200).json({ message: `Paciente com ID ${id} deletado com sucesso!` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao deletar paciente.' });
  }
});

// --- ROTAS DA API PARA RELATÓRIOS ---

app.get('/api/pacientes/:id/relatorios', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM relatorios_diarios WHERE paciente_id = $1 ORDER BY data DESC, hora DESC', [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar relatórios.' });
    }
});

app.post('/api/pacientes/:id/relatorios', async (req, res) => {
    try {
        const { id: paciente_id } = req.params;
        const { data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel } = req.body;
        if (!data || !periodo || !hora) {
            return res.status(400).json({ error: 'Os campos "data", "periodo" e "hora" são obrigatórios.' });
        }
        const sql = `
          INSERT INTO relatorios_diarios (paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`;
        const params = [paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel];
        const result = await pool.query(sql, params);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao cadastrar relatório.' });
    }
});

// --- ROTA GERAL DE RELATÓRIOS ---

app.get('/api/relatorios', async (req, res) => {
    const sql = `
      SELECT 
        r.id, r.data, r.hora, r.periodo, r.observacoes, r.responsavel, r.paciente_id,
        p.nome as paciente_nome 
      FROM relatorios_diarios r 
      JOIN pacientes p ON r.paciente_id = p.id 
      ORDER BY r.data DESC, r.id DESC`;
  
    try {
      const result = await pool.query(sql);
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao buscar todos os relatórios.' });
    }
});

// --- APLICAÇÃO INICIA AQUI ---
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta http://localhost:${PORT}`);
});