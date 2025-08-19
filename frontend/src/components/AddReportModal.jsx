import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";

/**
 * Modal para adicionar Relatório Diário
 *
 * Props:
 * - closeModal: () => void            (obrigatória)
 * - initialPacienteId?: string|number (opcional, pré-seleciona o paciente)
 * - initialDate?: string (YYYY-MM-DD) (opcional, pré-preenche a data)
 */
export default function AddReportModal({
  closeModal,
  initialPacienteId = null,
  initialDate = null,
}) {
  // Lista de pacientes (ativos)
  const [pacientes, setPacientes] = useState([]);

  // Estado do formulário
  const [form, setForm] = useState({
    paciente_id: initialPacienteId ? String(initialPacienteId) : "",
    data:
      initialDate ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    hora: "",
    periodo: "",
    alimentacao: "",
    temperatura: "",
    pressao: "",
    observacoes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const periodoOptions = useMemo(
    () => [
      { value: "", label: "Selecione..." },
      { value: "manhã", label: "Manhã" },
      { value: "tarde", label: "Tarde" },
      { value: "noite", label: "Noite" },
      { value: "madrugada", label: "Madrugada" },
    ],
    []
  );

  // Carrega pacientes quando o modal abre
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/pacientes");
        if (mounted) setPacientes(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Falha ao carregar lista de pacientes.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Sincroniza quando props iniciais mudam (se o modal for reusado)
  useEffect(() => {
    setForm((f) => ({
      ...f,
      paciente_id:
        initialPacienteId !== null && initialPacienteId !== undefined
          ? String(initialPacienteId)
          : f.paciente_id,
      data: initialDate ?? f.data,
    }));
  }, [initialPacienteId, initialDate]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.paciente_id) return toast.warn("Selecione o paciente.");
    if (!form.data) return toast.warn("Informe a data.");
    if (!form.hora) return toast.warn("Informe a hora.");
    if (!form.periodo) return toast.warn("Selecione o período.");

    setSubmitting(true);
    try {
      const path = `/pacientes/${form.paciente_id}/relatorios`;
      const payload = {
        data: form.data,
        hora: form.hora,
        periodo: form.periodo,
        alimentacao: form.alimentacao || "",
        temperatura: form.temperatura || "",
        pressao: form.pressao || "",
        observacoes: form.observacoes || "",
      };

      await api.post(path, payload);
      toast.success("Relatório diário salvo com sucesso!");
      closeModal?.();
    } catch (err) {
      console.error(err);
      if (err.response) {
        const msg =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data?.error || "Erro ao salvar relatório.";
        toast.error(`HTTP ${err.response.status}: ${msg}`);
      } else {
        toast.error(err.message || "Falha ao salvar relatório.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // fecha ao clicar fora
  function handleOverlayClick(e){
    if (e.target === e.currentTarget && !submitting) closeModal?.();
  }

  return (
    <div role="dialog" aria-modal="true" className="modal-overlay" onClick={handleOverlayClick}>
      <form onSubmit={handleSubmit} className="modal-card">
        {/* Cabeçalho */}
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Novo Relatório Diário
          </h2>
          <button
            type="button"
            onClick={() => closeModal?.()}
            disabled={submitting}
            className="btn btn--ghost"
          >
            Fechar
          </button>
        </div>

        {/* Linha 1: Paciente + Data + Hora + Período */}
        <div className="grid-4">
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Paciente
            <select
              className="select"
              value={form.paciente_id}
              onChange={(e) => updateField("paciente_id", e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Data
            <input
              type="date"
              className="input"
              value={form.data}
              onChange={(e) => updateField("data", e.target.value)}
              required
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Hora
            <input
              type="time"
              className="input"
              value={form.hora}
              onChange={(e) => updateField("hora", e.target.value)}
              required
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Período
            <select
              className="select"
              value={form.periodo}
              onChange={(e) => updateField("periodo", e.target.value)}
              required
            >
              {periodoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Linha 2: Alimentação + Temperatura + Pressão */}
        <div className="grid-3">
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Alimentação
            <input
              className="input"
              type="text"
              placeholder="Ex.: dieta branda, 70% de aceitação"
              value={form.alimentacao}
              onChange={(e) => updateField("alimentacao", e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Temperatura
            <input
              className="input"
              type="text"
              placeholder="Ex.: 36.7 ºC"
              value={form.temperatura}
              onChange={(e) => updateField("temperatura", e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Pressão
            <input
              className="input"
              type="text"
              placeholder="Ex.: 120x80"
              value={form.pressao}
              onChange={(e) => updateField("pressao", e.target.value)}
            />
          </label>
        </div>

        {/* Observações */}
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
          Observações
          <textarea
            className="textarea"
            rows={4}
            placeholder="Observações gerais do período..."
            value={form.observacoes}
            onChange={(e) => updateField("observacoes", e.target.value)}
          />
        </label>

        {/* Ações */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => closeModal?.()}
            disabled={submitting}
            className="btn"
          >
            Cancelar
          </button>

          <button type="submit" disabled={submitting} className="btn btn--primary">
            {submitting ? "Salvando..." : "Salvar relatório"}
          </button>
        </div>
      </form>
    </div>
  );
}
