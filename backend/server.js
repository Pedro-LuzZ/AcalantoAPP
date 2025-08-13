// Adicionado para o bug de conexão no Mac/redes específicas
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const stream = require('stream');

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
    const sql = `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id, nome, email, criado_em, role`;
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

// APLICA O MIDDLEWARE DE AUTENTICAÇÃO GERAL
app.use(autenticarToken);

// --- ROTAS DA API PARA RESIDENTES (PACIENTES) ---
app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pacientes WHERE status = 'ativo' ORDER BY nome");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar residentes.' });
  }
});

app.get('/api/relatorios', async (req, res) => {
  try {
    const { pacienteId, data, tipo } = req.query;

    const query = `
      SELECT
        e.id,
        e.paciente_id,
        p.nome AS residente,
        e.usuario_id,
        e.data_ocorrencia AS data_universal,
        e.hora_ocorrencia AS hora,
        NULL AS periodo,
        NULL AS alimentacao,
        NULL AS temperatura,
        NULL AS pressao,
        e.observacoes,
        e.responsavel_nome AS responsavel,
        'evolucao_enfermagem' AS tipo
      FROM evolucao_enfermagem e
      LEFT JOIN pacientes p ON e.paciente_id = p.id
      WHERE 
        ($1::text IS NULL OR $1 = '' OR e.paciente_id = $1)
        AND ($2::text IS NULL OR $2 = '' OR e.data_ocorrencia = $2)
      
      UNION ALL

      SELECT
        t.id,
        t.paciente_id,
        p.nome AS residente,
        t.usuario_id,
        t.data_ocorrencia AS data_universal,
        NULL AS hora,
        NULL AS periodo,
        NULL AS alimentacao,
        NULL AS temperatura,
        NULL AS pressao,
        t.observacoes,
        t.responsavel_nome AS responsavel,
        'evolucao_tecnico' AS tipo
      FROM evolucao_tecnico t
      LEFT JOIN pacientes p ON t.paciente_id = p.id
      WHERE 
        ($1::text IS NULL OR $1 = '' OR t.paciente_id = $1)
        AND ($2::text IS NULL OR $2 = '' OR t.data_ocorrencia = $2)

      UNION ALL

      SELECT
        h.id,
        h.paciente_id,
        p.nome AS residente,
        h.usuario_id,
        h.data_ocorrencia AS data_universal,
        h.hora_ocorrencia AS hora,
        NULL AS periodo,
        NULL AS alimentacao,
        NULL AS temperatura,
        NULL AS pressao,
        h.observacoes,
        h.responsavel_nome AS responsavel,
        'higiene' AS tipo
      FROM higiene_relatorios h
      LEFT JOIN pacientes p ON h.paciente_id = p.id
      WHERE 
        ($1::text IS NULL OR $1 = '' OR h.paciente_id = $1)
        AND ($2::text IS NULL OR $2 = '' OR h.data_ocorrencia = $2)

      UNION ALL

      SELECT
        r.id,
        r.paciente_id,
        p.nome AS residente,
        r.usuario_id,
        r.data AS data_universal,
        r.hora AS hora,
        r.periodo,
        r.alimentacao,
        r.temperatura,
        r.pressao,
        r.observacoes,
        r.responsavel,
        'relatorio_diario' AS tipo
      FROM relatorios_diarios r
      LEFT JOIN pacientes p ON r.paciente_id = p.id
      WHERE 
        ($1::text IS NULL OR $1 = '' OR r.paciente_id = $1)
        AND ($2::text IS NULL OR $2 = '' OR r.data = $2)

      ORDER BY data_universal DESC NULLS LAST, hora DESC NULLS LAST
    `;

    const values = [pacienteId || '', data || ''];
    const { rows } = await pool.query(query, values);

    const tipoFiltro = tipo && tipo.trim() !== '' ? tipo.trim() : null;
    const resultadoFiltrado = tipoFiltro
      ? rows.filter(row => row.tipo === tipoFiltro)
      : rows;

    res.json(resultadoFiltrado);
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro ao buscar relatórios.' });
  }
});

app.post('/api/pacientes/:id/relatorios', async (req, res) => {
  try {
    const { id: paciente_id } = req.params;
    const { data, hora, periodo, alimentacao, temperatura, pressao, observacoes } = req.body;
    const responsavel = req.usuario.nome;
    if (!data || !periodo || !hora) return res.status(400).json({ error: 'Os campos "data", "periodo" e "hora" são obrigatórios.' });
    const sql = `INSERT INTO relatorios_diarios (paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    const params = [paciente_id, data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar relatório.' });
  }
});

app.get('/api/pacientes/:id/evolucoes-enfermagem', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM evolucao_enfermagem WHERE paciente_id = $1 ORDER BY data_ocorrencia DESC, id DESC";
    const result = await pool.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar evoluções de enfermagem.' });
  }
});

app.post('/api/pacientes/:id/evolucoes-enfermagem', async (req, res) => {
  const { id: paciente_id } = req.params;
  let { data_ocorrencia, grau_dependencia, mobilidade, nivel_consciencia, pele_e_mucosa, lesao_pressao_local, padrao_respiratorio, alteracoes_respiratorias, tosse, alimentacao_via, alimentacao_aceitacao, eliminacao_vesical, eliminacao_intestinal, constipacao_dias, sono_repouso, estado_geral, dor_status, dor_grau, dor_local, observacoes } = req.body;
  const responsavel_nome = req.usuario.nome;
  const usuario_id = req.usuario.id;
  constipacao_dias = constipacao_dias === '' || constipacao_dias === null ? null : parseInt(constipacao_dias, 10);
  dor_grau = dor_grau === '' || dor_grau === null ? null : parseInt(dor_grau, 10);
  try {
    const sql = `
      INSERT INTO evolucao_enfermagem (
        paciente_id, usuario_id, data_ocorrencia, grau_dependencia, mobilidade, nivel_consciencia,
        pele_e_mucosa, lesao_pressao_local, padrao_respiratorio, alteracoes_respiratorias, tosse,
        alimentacao_via, alimentacao_aceitacao, eliminacao_vesical, eliminacao_intestinal,
        constipacao_dias, sono_repouso, estado_geral, dor_status, dor_grau, dor_local,
        observacoes, responsavel_nome
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *;
    `;
    const params = [ paciente_id, usuario_id, data_ocorrencia, grau_dependencia, mobilidade, nivel_consciencia, pele_e_mucosa, lesao_pressao_local, padrao_respiratorio, alteracoes_respiratorias, tosse, alimentacao_via, alimentacao_aceitacao, eliminacao_vesical, eliminacao_intestinal, constipacao_dias, sono_repouso, estado_geral, dor_status, dor_grau, dor_local, observacoes, responsavel_nome ];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao salvar evolução de enfermagem.' });
  }
});

app.get('/api/pacientes/:id/higiene', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM higiene_relatorios WHERE paciente_id = $1 ORDER BY data_ocorrencia DESC, hora_ocorrencia DESC";
    const result = await pool.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar relatórios de higiene.' });
  }
});

app.post('/api/pacientes/:id/higiene', async (req, res) => {
  const { id: paciente_id } = req.params;
  const { data_ocorrencia, hora_ocorrencia, banho_corporal, banho_parcial, higiene_intima, observacoes } = req.body;
  const responsavel_nome = req.usuario.nome;
  const usuario_id = req.usuario.id;
  try {
    const sql = `
      INSERT INTO higiene_relatorios (
      paciente_id, usuario_id, data_ocorrencia, hora_ocorrencia,
      banho_corporal, banho_parcial, higiene_intima,
      observacoes, responsavel_nome
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *;
    `;

    const params = [ paciente_id, usuario_id, data_ocorrencia, hora_ocorrencia, banho_corporal, banho_parcial, higiene_intima, observacoes, responsavel_nome ];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao salvar relatório de higiene.' });
  }
});

app.get('/api/pacientes/:id/evolucao-tecnico', async (req, res) => {
    try {
      const { id } = req.params;
      const sql = "SELECT * FROM evolucao_tecnico WHERE paciente_id = $1 ORDER BY data_ocorrencia DESC, id DESC";
      const result = await pool.query(sql, [id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar evoluções do técnico.' });
    }
});
  
app.post('/api/pacientes/:id/evolucao-tecnico', async (req, res) => {
    const { id: paciente_id } = req.params;
    const {
      data_ocorrencia, turno, nivel_consciencia, pele_mucosa, lpp_local,
      padrao_respiratorio, fr, em_uso_o2, tosse, alimentacao_via,
      alimentacao_aceitacao, sono_repouso, cuidado_banho, cuidado_deambulacao,
      cuidado_curativo, curativo_local, cuidados_outros, observacoes
    } = req.body;
  
    const responsavel_nome = req.usuario.nome;
    const usuario_id = req.usuario.id;
  
    try {
      const sql = `
        INSERT INTO evolucao_tecnico (
          paciente_id, usuario_id, data_ocorrencia, turno, nivel_consciencia, pele_mucosa, lpp_local,
          padrao_respiratorio, fr, em_uso_o2, tosse, alimentacao_via, alimentacao_aceitacao,
          sono_repouso, cuidado_banho, cuidado_deambulacao, cuidado_curativo, curativo_local,
          cuidados_outros, observacoes, responsavel_nome
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *;
      `;
      const params = [
        paciente_id, usuario_id, data_ocorrencia, turno, nivel_consciencia, pele_mucosa, lpp_local,
        padrao_respiratorio, fr, em_uso_o2, tosse, alimentacao_via, alimentacao_aceitacao,
        sono_repouso, cuidado_banho, cuidado_deambulacao, cuidado_curativo, curativo_local,
        cuidados_outros, observacoes, responsavel_nome
      ];
  
      const result = await pool.query(sql, params);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao salvar evolução do técnico:", err);
      res.status(500).json({ error: 'Erro interno ao salvar evolução do técnico.' });
    }
});

// --- APLICAÇÃO INICIA AQUI ---
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta http://localhost:${PORT}`);
});
setInterval(() => {}, 300000);







//evolucao_enfermagem
// id	paciente_id	usuario_id	data_ocorrencia	grau_dependencia	mobilidade	nivel_consciencia	pele_e_mucosa	lesao_pressao_local	padrao_respiratorio	alteracoes_respiratorias	tosse	alimentacao_via	alimentacao_aceitacao	eliminacao_vesical	eliminacao_intestinal	constipacao_dias	sono_repouso	estado_geral	dor_status	dor_grau	dor_local	observacoes	responsavel_nome	data_criacao

//evolucao_tecnico
//id	paciente_id	usuario_id	data_ocorrencia	turno	nivel_consciencia	pele_mucosa	lpp_local	padrao_respiratorio	fr	em_uso_o2	tosse	alimentacao_via	alimentacao_aceitacao	sono_repouso	cuidado_banho	cuidado_deambulacao	cuidado_curativo	curativo_local	cuidados_outros	observacoes	responsavel_nome	data_criacao

//higiene_relatorios
//id	paciente_id	usuario_id	data_ocorrencia	hora_ocorrencia	banho_corporal	banho_parcial	higiene_intima	observacoes	responsavel_nome	data_criacao

//relatorios_diarios
//id	paciente_id	usuario_id	data	hora	periodo	alimentacao	temperatura	pressao	observacoes	responsavel