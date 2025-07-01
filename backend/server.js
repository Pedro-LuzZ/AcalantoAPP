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

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Residente não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar residente.' });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, link_medicamentos } = req.body;
    if (!nome) return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    const sql = `
      INSERT INTO pacientes (nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, link_medicamentos) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`;
    const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, link_medicamentos];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar residente.' });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, link_medicamentos } = req.body;
    if (!nome) return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    const sql = `
      UPDATE pacientes 
      SET nome = $1, idade = $2, quarto = $3, diagnostico = $4, medicamentos = $5, contato_emergencia = $6, data_internacao = $7, responsavel_familiar_nome = $8, responsavel_familiar_contato = $9, link_medicamentos = $10 
      WHERE id = $11 RETURNING *`;
    const params = [nome, idade, quarto, diagnostico, medicamentos, contato_emergencia, data_internacao, responsavel_familiar_nome, responsavel_familiar_contato, link_medicamentos, id];
    const result = await pool.query(sql, params);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Residente não encontrado para atualização.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar residente.' });
  }
});

app.delete('/api/pacientes/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Residente não encontrado para deleção.' });
    res.status(200).json({ message: `Residente com ID ${id} deletado com sucesso!` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar residente.' });
  }
});

app.post('/api/pacientes/:id/arquivar', isAdmin, async (req, res) => {
    const { id } = req.params;
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!FOLDER_ID) return res.status(500).json({ error: 'ID da pasta do Google Drive não configurado no servidor.' });
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'google-credentials.json',
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const driveService = google.drive({ version: 'v3', auth });
        const residenteRes = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
        if (residenteRes.rows.length === 0) return res.status(404).json({ error: 'Residente não encontrado.' });
        const residente = residenteRes.rows[0];

        // Aqui você adicionaria a lógica para buscar todos os outros relatórios
        let fileContent = `HISTÓRICO DO RESIDENTE: ${residente.nome}\n\n... (adicionar todos os dados aqui)`;
        
        const fileName = `ARQUIVO_Historico_${residente.nome.replace(/ /g, '_')}_ID_${residente.id}.txt`;
        const fileMetadata = { name: fileName, parents: [FOLDER_ID] };
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileContent);

        await driveService.files.create({
            media: { mimeType: 'text/plain', body: bufferStream },
            resource: fileMetadata,
            fields: 'id',
        });
        await pool.query("UPDATE pacientes SET status = 'arquivado' WHERE id = $1", [id]);
        res.status(200).json({ message: 'Residente arquivado com sucesso no Google Drive!' });
    } catch (err) {
        console.error("Erro ao arquivar residente:", err);
        res.status(500).json({ error: 'Falha ao arquivar residente.' });
    }
});


// --- ROTAS DA API PARA RELATÓRIOS ESPECÍFICOS ---
app.get('/api/pacientes/:id/relatorios', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM relatorios_diarios WHERE paciente_id = $1 ORDER BY data DESC, hora DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar relatórios.' });
  }
});

app.post('/api/pacientes/:id/relatorios', async (req, res) => {
  try {
    const { id: paciente_id } = req.params;
    const { data, hora, periodo, alimentacao, temperatura, pressao, observacoes, responsavel } = req.body;
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
    const sql = "SELECT * FROM higiene_relatorios WHERE residente_id = $1 ORDER BY data_ocorrencia DESC, hora_ocorrencia DESC";
    const result = await pool.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar relatórios de higiene.' });
  }
});

app.post('/api/pacientes/:id/higiene', async (req, res) => {
  const { id: residente_id } = req.params;
  const { data_ocorrencia, hora_ocorrencia, banho_corporal, banho_parcial, higiene_intima, observacoes } = req.body;
  const responsavel_nome = req.usuario.nome;
  const usuario_id = req.usuario.id;
  try {
    const sql = `
      INSERT INTO higiene_relatorios (residente_id, usuario_id, data_ocorrencia, hora_ocorrencia, banho_corporal, banho_parcial, higiene_intima, observacoes, responsavel_nome) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`;
    const params = [ residente_id, usuario_id, data_ocorrencia, hora_ocorrencia, banho_corporal, banho_parcial, higiene_intima, observacoes, responsavel_nome ];
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao salvar relatório de higiene.' });
  }
});

app.get('/api/pacientes/:id/evolucao-tecnico', async (req, res) => {
    try {
      const { id } = req.params;
      const sql = "SELECT * FROM evolucao_tecnico WHERE residente_id = $1 ORDER BY data_ocorrencia DESC, id DESC";
      const result = await pool.query(sql, [id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar evoluções do técnico.' });
    }
});
  
app.post('/api/pacientes/:id/evolucao-tecnico', async (req, res) => {
    const { id: residente_id } = req.params;
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
          residente_id, usuario_id, data_ocorrencia, turno, nivel_consciencia, pele_mucosa, lpp_local,
          padrao_respiratorio, fr, em_uso_o2, tosse, alimentacao_via, alimentacao_aceitacao,
          sono_repouso, cuidado_banho, cuidado_deambulacao, cuidado_curativo, curativo_local,
          cuidados_outros, observacoes, responsavel_nome
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *;
      `;
      const params = [
        residente_id, usuario_id, data_ocorrencia, turno, nivel_consciencia, pele_mucosa, lpp_local,
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