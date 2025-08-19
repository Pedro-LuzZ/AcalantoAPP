import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api"; // seu axios com baseURL + interceptor

/** Hoje no formato YYYY-MM-DD em America/Sao_Paulo */
function todayYmdSP() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // en-CA => YYYY-MM-DD
}

export default function Principal() {
  const [date, setDate] = useState(todayYmdSP());
  const [onlyPending, setOnlyPending] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/dashboard/daily-status", {
        params: { date },
      });
      setRows(data?.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      if (err.response) {
        const body =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data?.error || JSON.stringify(err.response.data);
        setError(`HTTP ${err.response.status}: ${body?.slice?.(0, 200)}`);
      } else {
        setError(err.message || "Falha ao carregar a Dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const filtered = useMemo(() => {
    let data = rows;
    if (onlyPending) data = data.filter((r) => !r.has_daily);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter((r) => r.nome?.toLowerCase().includes(s));
    }
    return data;
  }, [rows, onlyPending, q]);

  const totals = useMemo(() => {
    const total = rows.length;
    const filled = rows.filter((r) => r.has_daily).length;
    return { total, filled, pending: total - filled };
  }, [rows]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header / Filtros */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Principal</h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Status dos relatórios diários em{" "}
            {new Date(date + "T00:00:00").toLocaleDateString("pt-BR")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 14 }}>
            Data:&nbsp;
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: "6px 8px" }}
            />
          </label>

          <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(e) => setOnlyPending(e.target.checked)}
            />
            Apenas pendentes
          </label>

          <input
            placeholder="Buscar residente..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: "6px 10px", minWidth: 200 }}
          />

          <button onClick={load} title="Atualizar" style={{ padding: "6px 12px", border: "1px solid #ccc", cursor: "pointer" }}>
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{totals.total}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Preenchidos</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{totals.filled}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Pendentes</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{totals.pending}</div>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>Residente</th>
              <th style={{ textAlign: "left", padding: 12 }}>Status</th>
              <th style={{ textAlign: "left", padding: 12 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} style={{ padding: 14 }}>Carregando…</td></tr>
            )}

            {!loading && error && (
              <tr><td colSpan={3} style={{ padding: 14, color: "#c00" }}>{error}</td></tr>
            )}

            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 14 }}>Nada encontrado.</td></tr>
            )}

            {!loading && !error && filtered.map((item) => (
              <tr key={item.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{item.nome}</td>
                <td style={{ padding: 12 }}>
                  {item.has_daily ? (
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#e9f8ee",
                      border: "1px solid #bfe7cb",
                      fontSize: 12
                    }}>
                      Preenchido
                    </span>
                  ) : (
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#fff7db",
                      border: "1px solid #f0dfa6",
                      fontSize: 12
                    }}>
                      Pendente
                    </span>
                  )}
                </td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.has_daily && (
                      <Link
                        to={`/relatorios?pacienteId=${item.id}&data=${date}`}
                        style={{ padding: "6px 10px", border: "1px solid #ddd" }}
                      >
                        Abrir relatório
                      </Link>
                    )}

                    {/* NOVO: sempre disponível */}
                    <Link
                      to={`/relatorios?novo=1&pacienteId=${item.id}&data=${date}`}
                      style={{ padding: "6px 10px", border: "1px solid #ddd" }}
                    >
                      Fazer relatório
                    </Link>

                    <Link
                      to={`/paciente/${item.id}`}
                      style={{ padding: "6px 10px", border: "1px solid #ddd" }}
                    >
                      Abrir prontuário
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
