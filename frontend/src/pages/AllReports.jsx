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
      // /api/relatorios retorna um array
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
              style={{ padding: "6px 8px" }}
            />
          </label>

          <label style={{ fontSize: 14 }}>
            Paciente:&nbsp;
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              style={{ padding: "6px 8px", minWidth: 200 }}
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
              style={{ padding: "6px 8px" }}
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
            style={{ padding: "6px 10px", minWidth: 220 }}
          />

          <button
            onClick={loadReports}
            style={{ padding: "6px 12px", border: "1px solid #ccc" }}
          >
            Atualizar
          </button>

          <button
            onClick={handleClearFilters}
            style={{ padding: "6px 12px", border: "1px solid #ccc" }}
            title="Limpar filtros"
          >
            Limpar
          </button>

          <button
            onClick={() => {
              setPrefill({ pacienteId: pacienteId || null, data: date || null });
              setShowAdd(true);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #3b82f6",
              background: "#3b82f6",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Adicionar Relatório
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>Data</th>
              <th style={{ textAlign: "left", padding: 12 }}>Hora</th>
              <th style={{ textAlign: "left", padding: 12 }}>Paciente</th>
              <th style={{ textAlign: "left", padding: 12 }}>Tipo</th>
              <th style={{ textAlign: "left", padding: 12 }}>Observações</th>
              <th style={{ textAlign: "left", padding: 12 }}>Responsável</th>
              <th style={{ textAlign: "left", padding: 12 }}>Ações</th>
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
                <tr key={idx} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 12 }}>
                    {r.data_universal
                      ? new Date(r.data_universal + "T00:00:00").toLocaleDateString(
                          "pt-BR"
                        )
                      : "-"}
                  </td>
                  <td style={{ padding: 12 }}>{r.hora || "-"}</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.residente}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid #ddd",
                        fontSize: 12,
                        background: "#fafafa",
                      }}
                    >
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
                        style={{ padding: "6px 10px", border: "1px solid #ddd" }}
                      >
                        Abrir prontuário
                      </Link>
                      {/* Atalho para novo relatório deste paciente na data atual do filtro */}
                      <Link
                        to={`/relatorios?novo=1&pacienteId=${r.paciente_id}&data=${date}`}
                        style={{ padding: "6px 10px", border: "1px solid #ddd" }}
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
