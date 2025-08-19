// backend/routes/dashboard.js
const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Middleware de no-cache só para as rotas deste router (evita 304)
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // GET /api/dashboard/daily-status?date=YYYY-MM-DD (opcional)
  // Lista pacientes ATIVOS e se já existe relatorio_diario na data informada/hoje.
  router.get('/dashboard/daily-status', async (req, res) => {
    const { date } = req.query; // 'YYYY-MM-DD' opcional

    const sql = `
      WITH input_date AS (
        SELECT COALESCE($1::date, (now() AT TIME ZONE 'America/Sao_Paulo')::date) AS d
      )
      SELECT
        p.id,
        p.nome,
        rd.id                          AS report_id,
        (rd.id IS NOT NULL)            AS has_daily
      FROM pacientes p
      CROSS JOIN input_date i
      LEFT JOIN LATERAL (
        SELECT r.id
        FROM relatorios_diarios r
        WHERE r.paciente_id = p.id
          AND r.data = i.d
        ORDER BY r.id DESC
        LIMIT 1
      ) rd ON TRUE
      WHERE p.status = 'ativo'
      ORDER BY p.nome;
    `;

    try {
      const { rows } = await pool.query(sql, [date || null]);
      res.json({
        date: date || null,
        count: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error('Erro /dashboard/daily-status:', err);
      res.status(500).json({ error: 'Erro ao carregar status diário', details: err.message });
    }
  });

  return router;
};
