import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MesaArbitro } from "@/app/arbitro/partidos/[id]/mesa-arbitro";

const api = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("@/app/actions/partido-arbitro", () => ({
  consultarMesaArbitro: api.consultar,
  actualizarMarcadorArbitro: vi.fn(), finalizarPartidoArbitro: vi.fn(),
  guardarParticipantesArbitro: vi.fn(), iniciarPartidoArbitro: vi.fn(),
}));
const datos = {
  partidoId: 7, estado: "EN_CURSO", local: { id: 1, nombre: "Tigres FC" }, visitante: { id: 2, nombre: "Rayos FC" },
  golesLocal: 3, golesVisitante: 2, faltasLocal: 4, faltasVisitante: 1,
  inicioReal: "2026-11-16T20:00:00.000Z", finReal: null,
  participantes: { partidoId: 7, local: [{ id: 12, nombre: "Ana" }], visitante: [] },
};
beforeEach(() => api.consultar.mockResolvedValue({ ok: true, data: datos }));

describe("Mesa del árbitro conectada", () => {
  it("recupera marcador y participantes guardados al abrir un partido en curso", async () => {
    render(<MesaArbitro idTexto="7" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando partido");
    await screen.findByText(/Partido #7/);
    expect(screen.getAllByLabelText("Goles")[0]).toHaveValue(3);
    expect(screen.getAllByLabelText("Goles")[1]).toHaveValue(2);
    expect(screen.getByLabelText("Números de ficha")).toHaveValue("12");
    expect(screen.getByRole("button", { name: "Iniciar partido" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar marcador" })).toBeEnabled();
  });
  it("mantiene el marcador oficial y bloquea cambios al recargar un partido finalizado", async () => {
    api.consultar.mockResolvedValue({ ok: true, data: { ...datos, estado: "FINALIZADO", finReal: "2026-11-16T21:30:00.000Z" } });
    render(<MesaArbitro idTexto="7" />);
    await screen.findByText(/Partido #7/);
    expect(screen.getAllByLabelText("Goles")[0]).toHaveValue(3);
    expect(screen.getAllByLabelText("Goles")[0]).toBeDisabled();
    expect(screen.getByRole("button", { name: "Iniciar partido" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar marcador" })).toBeDisabled();
  });
  it("impide operar un partido cuando la API rechaza el acceso", async () => {
    api.consultar.mockResolvedValue({ ok: false, status: 403, error: "No tienes permiso para esta acción." });
    render(<MesaArbitro idTexto="7" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso");
    expect(screen.queryByRole("button", { name: "Iniciar partido" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  });
});
