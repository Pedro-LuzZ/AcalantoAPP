require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração da Conexão com o Banco de Dados (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());


// ================================================================
// Middleware de Autenticação
// ================================================================
// Em server.js, substitua apenas a função autenticarToken por esta:

const autenticarToken = (req, res, next) => {
  console.log("\n--- Middleware de Autenticação Ativado ---");
  const authHeader = req.headers['authorization'];
  console.log("1. Cabeçalho 'Authorization' recebido:", authHeader);

  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log("2. NENHUM token encontrado. Enviando erro 401.");
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  console.log("2. Token encontrado. Verificando...");
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      console.log("3. ERRO na verificação do token! Enviando erro 403.", err.message);
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    
    console.log("3. SUCESSO! Token válido para o usuário:", usuario.email);
    req.usuario = usuario;
    next(); // Deixando a requisição passar
  });
};


// --- ROTAS DE AUTENTICAÇÃO (PÚBLICAS) ---
// Estas rotas NÃO usam o middleware.

app.post('/api/usuarios/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
  try {
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash(senha, saltRounds);
    const sql = `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em`;
    const params = [nome, email, senha_hash];
    const result = await pool.query(sql, params);
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

    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login bem-sucedido!', token: token, usuario: payload });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});


// ================================================================
// A PARTIR DAQUI, TODAS AS ROTAS SÃO PROTEGIDAS
// ================================================================
app.use(autenticarToken);


// --- ROTAS DA API PARA PACIENTES (PROTEGIDAS) ---

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

app.delete('/api/pacientes/:id', async (req, res) => {
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


// --- ROTAS DA API PARA RELATÓRIOS (PROTEGIDAS) ---

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

// --- ROTA GERAL DE RELATÓRIOS (PROTEGIDA) ---

app.get('/api/relatorios', async (req, res) => {
  const sql = `
    SELECT r.id, r.data, r.hora, r.periodo, r.observacoes, r.responsavel, r.paciente_id, p.nome as paciente_nome 
    FROM relatorios_diarios r 
    JOIN pacientes p ON r.paciente_id = p.id 
    ORDER BY r.data DESC, r.id DESC`;
  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro em GET /api/relatorios:", err);
    res.status(500).json({ error: 'Erro ao buscar todos os relatórios.' });
  }
});


// --- APLICAÇÃO INICIA AQUI ---
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta http://localhost:${PORT}`);
});

// ... (seu código app.listen() continua aqui)
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta http://localhost:${PORT}`);
});


// ================================================================
// CÓDIGO DE DEBUG PARA MANTER O PROCESSO VIVO
// Adicione apenas este bloco no final do seu arquivo
// ================================================================
setInterval(() => {
  // Esta função vazia roda a cada 5 minutos e impede o Node.js de fechar sozinho.
  // É apenas um teste para diagnosticar o problema do 'clean exit'.
}, 300000);