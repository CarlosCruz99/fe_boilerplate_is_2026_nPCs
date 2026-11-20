import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { aplicarCorreccionOficial, consultarCorreccionOficial } from "@/app/actions/correccion-oficial";
import { VistaCorreccionOficial } from "@/app/organizador/partidos/[id]/correccion-oficial/vista-correccion-oficial";
import { obtenerSesion } from "@/app/actions/session";
import { calendarioApi } from "@/lib/calendario-api";
import { validarCorreccion } from "@/lib/correccion-oficial";

vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/calendario-api", () => ({ calendarioApi: vi.fn() }));
const api = vi.mocked(calendarioApi);
const motivo = "Corrección según el acta firmada del encuentro.";
const marcador = {
  partidoId: 12, estado: "FINALIZADO", duracionMinutos: 90,
  local: { equipoId: 1, nombre: "Tigres", goles: 2, faltas: 0, jugadores: [] },
  visitante: { equipoId: 2, nombre: "Leones", goles: 1, faltas: 0, jugadores: [] },
  goleadores: [],
};
const antes = { golesLocal: 2, golesVisitante: 1, estadisticas: [] };
const despues = { ...antes, golesLocal: 3 };

function contexto(datos = marcador, historial: unknown[] = []) {
  api.mockResolvedValueOnce({ ok: true, data: datos })
    .mockResolvedValueOnce({ ok: true, data: { id: 1, jugadores: [{ id: 7, nombreCompleto: "Ana" }] } })
    .mockResolvedValueOnce({ ok: true, data: { id: 2, jugadores: [{ id: 8, nombreCompleto: "Luis" }] } })
    .mockResolvedValueOnce({ ok: true, data: historial });
}

Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } },
  close: { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } },
});

beforeEach(() => {
  api.mockReset();
  vi.mocked(obtenerSesion).mockResolvedValue({
    estado: "autenticado",
    usuario: { id: "organizador", nombre: "Organizador", email: "org@liga.test", rol: "ORGANIZADOR", equipoActualId: null, capitaneaEquipoId: null },
  });
});

it("publica tras la confirmación y vuelve a consultar el marcador y la auditoría", async () => {
  contexto();
  api.mockResolvedValueOnce({ ok: true, data: { correccionId: 16, estado: "FINALIZADO", antes, despues } });
  contexto({ ...marcador, local: { ...marcador.local, goles: 3 } }, [
    { id: 16, responsable: "Organizador", fecha: "2026-11-20T15:00:00Z", motivo, antes, despues },
  ]);
  render(<VistaCorreccionOficial partidoId={12} />);
  const goles = await screen.findByLabelText("Goles de Tigres");
  expect(goles).toHaveValue(2);
  fireEvent.change(goles, { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("Motivo de la corrección"), { target: { value: motivo } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar corrección" }));
  expect(api).toHaveBeenCalledTimes(4);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }));
  expect(await screen.findByText("Corrección #16 guardada. El partido sigue finalizado.")).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "Corrección #16 · Organizador" })).toBeInTheDocument();
  expect(screen.getByLabelText("Goles de Tigres")).toHaveValue(3);
  expect(api).toHaveBeenNthCalledWith(5, "partidos/12/correccion-oficial", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo, golesLocal: 3, golesVisitante: 1 }),
  }, expect.any(String));
});

it("envía estadísticas sin tocar el marcador y conserva los datos si el backend las rechaza", async () => {
  contexto();
  api.mockResolvedValueOnce({ ok: false, status: 422, error: "El jugador ya no está inscrito." });
  render(<VistaCorreccionOficial partidoId={12} />);
  fireEvent.click(await screen.findByRole("button", { name: "Agregar jugador" }));
  fireEvent.change(screen.getByLabelText("Jugador"), { target: { value: "7" } });
  for (const [campo, valor] of [["Goles", "1"], ["Asistencias", "0"], ["Tarjetas", "0"]]) {
    fireEvent.change(screen.getByLabelText(campo, { exact: true }), { target: { value: valor } });
  }
  fireEvent.change(screen.getByLabelText("Motivo de la corrección"), { target: { value: motivo } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar corrección" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El jugador ya no está inscrito.");
  expect(screen.getByLabelText("Jugador")).toHaveValue("7");
  expect(api.mock.calls[4][1]?.body).toBe(JSON.stringify({
    motivo, estadisticas: [{ jugadorId: 7, goles: 1, asistencias: 0, tarjetas: 0 }],
  }));
});

it("bloquea un marcador en curso antes de cargar plantillas y bitácora", async () => {
  api.mockResolvedValueOnce({ ok: true, data: { ...marcador, estado: "EN_CURSO" } });
  expect(await consultarCorreccionOficial(12)).toMatchObject({ ok: false, status: 409 });
  expect(api).toHaveBeenCalledTimes(1);
});

it("valida motivo, pares de goles y jugadores repetidos antes de guardar", async () => {
  const fila = { jugadorId: 7, goles: 1, asistencias: 0, tarjetas: 0 };
  expect(validarCorreccion({ motivo, estadisticas: [fila, fila] })).toMatch(/una sola vez/);
  expect(await aplicarCorreccionOficial(12, { motivo: "corto", golesLocal: 1, golesVisitante: 2 })).toMatchObject({ status: 400 });
  expect(await aplicarCorreccionOficial(12, { motivo, golesLocal: 1 })).toMatchObject({ status: 400 });
  expect(api).not.toHaveBeenCalled();
});
