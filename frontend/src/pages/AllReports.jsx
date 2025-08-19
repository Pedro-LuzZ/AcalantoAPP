import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import AddReportModal from "../components/AddReportModal";

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

/** Formata valores 'YYYY-MM-DD' ou ISO para dd/mm/aaaa */
function formatDateBR(value) {
  if (!value) return "-";
  const s = String(value);
  // se vier ISO, pega só a parte YYYY-MM-DD
  const ymd = s.includes("T") ? s.slice(0, 10) : s;
  const [y, m, d] = ymd.split("-");
  if (y && m && d) return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  // fallback robusto
  const dt = new Date(value);
  return isNaN(dt) ? "-" : dt.toLocaleDateString("pt-BR");
}

const TIPO_LABEL = {
  relatorio_diario: "Relatório diário",
  evolucao_enfermagem: "Evolução (Enfermagem)",
  evolucao_tecnico: "Evolução (Técnico)",
  higiene: "Higiene",
};

export default function AllReports() {
  const location = useLocation();
  const navigate = useNavigate();

  // filtros
  const [date, setDate] = useState(todayYmdSP());
  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState("");
  const [q, setQ] = useState("");

  // dados
  const [pacientes, setPacientes] = useState([]);
  const [rows, setRows] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal "Adicionar Relatório"
  const [showAdd, setShowAdd] = useState(false);
  const [prefill, setPrefill] = useState({ pacienteId: null, data: null });

  // Lê querystring: ?novo=1&pacienteId=...&data=...&tipo=...
  useEffect(() => {
    const qs = new URLSearchParams(location.search);

    const qsDate = qs.get("data");
    const qsPac = qs.get("pacienteId");
    const qsTipo = qs.get("tipo");
    const qsNovo = qs.get("novo");

    if (qsDate) setDate(qsDate);
    if (qsPac) setPacienteId(qsPac);
    if (qsTipo) setTipo(qsTipo);

    if (qsNovo === "1") {
      setPrefill({
        pacienteId: qsPac || null,
        data: qsDate || null,
      });
      setShowAdd(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function loadPacientes() {
    try {
      const { data } = await api.get("/pacientes");
      setPacientes(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/relatorios", {
        params: {
          pacienteId: pacienteId || "",
          data: date || "",
          tipo: tipo || "",
        },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      if (e.response) {
        const body =
          typeof e.response.data === "string"
            ? e.response.data
            : e.response.data?.error || JSON.stringify(e.response.data);
        setError(`HTTP ${e.response.status}: ${body?.slice?.(0, 200)}`);
      } else {
        setError(e.message || "Falha ao carregar relatórios.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPacientes();
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, pacienteId, tipo]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.residente?.toLowerCase().includes(s) ||
        r.observacoes?.toLowerCase().includes(s)
    );
  }, [rows, q]);

  function handleClearFilters() {
    setPacienteId("");
    setTipo("");
    setQ("");
    setDate(todayYmdSP());
    navigate("/relatorios", { replace: true });
  }

  function handleCloseAdd() {
    setShowAdd(false);
    // limpa a query para não reabrir ao voltar
    navigate("/relatorios", { replace: true });
    // recarrega lista para refletir o novo relatório
    loadReports();
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Todos os Relatórios
          </h1>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Filtre por paciente, data e tipo.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontSize: 14 }}>
            Data:&nbsp;
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              style={{ width: 150 }}
            />
          </label>

          <label style={{ fontSize: 14 }}>
            Paciente:&nbsp;
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="select"
              style={{ minWidth: 200 }}
            >
              <option value="">Todos</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 14 }}>
            Tipo:&nbsp;
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="select"
              style={{ minWidth: 200 }}
            >
              <option value="">Todos</option>
              <option value="relatorio_diario">Relatório diário</option>
              <option value="evolucao_enfermagem">Evolução (Enfermagem)</option>
              <option value="evolucao_tecnico">Evolução (Técnico)</option>
              <option value="higiene">Higiene</option>
            </select>
          </label>

          <input
            placeholder="Buscar (nome/observações)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input"
            style={{ minWidth: 220 }}
          />

          <button onClick={loadReports} className="btn" title="Atualizar">
            Atualizar
          </button>

          <button onClick={handleClearFilters} className="btn" title="Limpar filtros">
            Limpar
          </button>

          <button
            onClick={() => {
              setPrefill({ pacienteId: pacienteId || null, data: date || null });
              setShowAdd(true);
            }}
            className="btn btn--primary"
          >
            Adicionar Relatório
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Tipo</th>
              <th>Observações</th>
              <th>Responsável</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 14 }}>
                  Carregando…
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={7} style={{ padding: 14, color: "#c00" }}>
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 14 }}>
                  Nada encontrado.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              filtered.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 12 }}>{formatDateBR(r.data_universal)}</td>
                  <td style={{ padding: 12 }}>{r.hora || "-"}</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.residente}</td>
                  <td style={{ padding: 12 }}>
                    <span className="badge" title={r.tipo}>
                      {TIPO_LABEL[r.tipo] || r.tipo}
                    </span>
                  </td>
                  <td style={{ padding: 12, maxWidth: 420 }}>
                    <div
                      title={r.observacoes || ""}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {r.observacoes || "—"}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>{r.responsavel || "—"}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        to={`/paciente/${r.paciente_id}`}
                        className="btn"
                        style={{ padding: "6px 10px" }}
                      >
                        Abrir prontuário
                      </Link>
                      <Link
                        to={`/relatorios?novo=1&pacienteId=${r.paciente_id}&data=${date}`}
                        className="btn"
                        style={{ padding: "6px 10px" }}
                      >
                        Fazer relatório
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal de novo relatório com pré-preenchimento */}
      {showAdd && (
        <AddReportModal
          closeModal={handleCloseAdd}
          initialPacienteId={prefill.pacienteId}
          initialDate={prefill.data}
        />
      )}
    </div>
  );
}
