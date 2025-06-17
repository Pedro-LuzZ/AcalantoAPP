require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// --- Middlewares de Autenticação ---
const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Token não fornecido.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.usuario = usuario;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
  }
};


// --- ROTAS DE AUTENTICAÇÃO (PÚBLICAS) ---
app.post('/api/usuarios/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
  try {
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash(senha, saltRounds);
    const sql = `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em`;
    const result = await pool.query(sql, [nome, email, senha_hash]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Este email já está em uso.' });
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
  }
});

app.post('/api/usuarios/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];
    if (!usuario) return res.status(401).json({ error: 'Email ou senha inválidos.' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return res.status(401).json({ error: 'Email ou senha inválidos.' });

    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login bem-sucedido!', token: token, usuario: payload });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});


// APLICA O MIDDLEWARE DE AUTENTICAÇÃO GERAL PARA TODAS AS ROTAS ABAIXO
app.use(autenticarToken);


// --- ROTAS DA API PARA PACIENTES ---
app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pacientes ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error("Erro em GET /api/pacientes:", err);
    res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro em GET /api/pacientes/:id:", err);
    res.status(500).json({ error: 'Erro ao buscar paciente.' });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato } = req.body;
    if (!nome) return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    const sql = `
      INSERT INTO pacientes (nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`;
    const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro em POST /api/pacientes:", err);
    res.status(500).json({ error: 'Erro ao cadastrar paciente.' });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato } = req.body;
    if (!nome) return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    const sql = `
      UPDATE pacientes 
      SET nome = $1, idade = $2, quarto = $3, diagnostico = $4, medicamentos = $5, contato_emergencia = $6, data_internacao = $7, responsavel_familiar_nome = $8, responsavel_familiar_contato = $9 
      WHERE id = $10 RETURNING *`;
    const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, id];
    const result = await pool.query(sql, params);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Paciente não encontrado para atualização.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro em PUT /api/pacientes/:id:", err);
    res.status(500).json({ error: 'Erro ao atualizar paciente.' });
  }
});

app.delete('/api/pacientes/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Paciente não encontrado para deleção.' });
    res.status(200).json({ message: `Paciente com ID ${id} deletado com sucesso!` });
  } catch (err) {
    console.error("Erro em DELETE /api/pacientes/:id:", err);
    res.status(500).json({ error: 'Erro ao deletar paciente.' });
  }
});


// --- ROTAS DA API PARA RELATÓRIOS DIÁRIOS ---
app.get('/api/pacientes/:id/relatorios', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM relatorios_diarios WHERE paciente_id = $1 ORDER BY data DESC, hora DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro em GET /api/pacientes/:id/relatorios:", err);
    res.status(500).json({ error: 'Erro ao buscar relatórios.' });
  }
});

app.post('/api/pacientes/:id/relatorios', async (req, res) => {
  try {
    const { id: paciente_id } = req.params;
    const { data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel } = req.body;
    if (!data || !periodo || !hora) return res.status(400).json({ error: 'Os campos "data", "periodo" e "hora" são obrigatórios.' });
    const sql = `
      INSERT INTO relatorios_diarios (paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`;
    const params = [paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro em POST /api/pacientes/:id/relatorios:", err);
    res.status(500).json({ error: 'Erro ao cadastrar relatório.' });
  }
});


// --- ROTA GERAL DE RELATÓRIOS ---
app.get('/api/relatorios', async (req, res) => {
    const { pacienteId, data } = req.query;
    let params = [];
    let whereClauses = [];
    let baseSql = `
      SELECT r.id, r.data, r.hora, r.periodo, r.observacoes, r.responsavel, r.paciente_id, p.nome as paciente_nome 
      FROM relatorios_diarios r 
      JOIN pacientes p ON r.paciente_id = p.id`;

    if (pacienteId) {
      params.push(pacienteId);
      whereClauses.push(`r.paciente_id = $${params.length}`);
    }
    if (data) {
      params.push(data);
      whereClauses.push(`r.data = $${params.length}`);
    }
    if (whereClauses.length > 0) {
      baseSql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    baseSql += ' ORDER BY r.data DESC, r.id DESC';

    try {
      const result = await pool.query(baseSql, params);
      res.json(result.rows);
    } catch (err) {
      console.error("Erro em GET /api/relatorios:", err);
      res.status(500).json({ error: 'Erro ao buscar todos os relatórios.' });
    }
});


// --- ROTAS PARA EVOLUÇÕES PROFISSIONAIS ---
app.get('/api/pacientes/:id/evolucoes', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        e.id, e.data, e.hora, e.categoria_profissional, e.texto_evolucao,
        u.nome as nome_responsavel 
      FROM 
        evolucoes_profissionais e
      JOIN 
        usuarios u ON e.usuario_id = u.id
      WHERE 
        e.paciente_id = $1 
      ORDER BY 
        e.criado_em DESC`;
    
    const result = await pool.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro em GET /api/pacientes/:id/evolucoes:", err);
    res.status(500).json({ error: 'Erro ao buscar evoluções.' });
  }
});

app.post('/api/pacientes/:id/evolucoes', async (req, res) => {
  try {
    const { id: paciente_id } = req.params;
    const { id: usuario_id } = req.usuario;
    const { data, hora, categoria_profissional, texto_evolucao } = req.body;

    if (!data || !hora || !categoria_profissional || !texto_evolucao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = `
      INSERT INTO evolucoes_profissionais (paciente_id, usuario_id, data, hora, categoria_profissional, texto_evolucao)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    
    const params = [paciente_id, usuario_id, data, hora, categoria_profissional, texto_evolucao];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro em POST /api/pacientes/:id/evolucoes:", err);
    res.status(500).json({ error: 'Erro ao cadastrar evolução.' });
  }
});


// --- APLICAÇÃO INICIA AQUI ---
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta http://localhost:${PORT}`);
});