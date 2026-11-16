import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { FormularioEstadisticas } from "@/app/arbitro/partidos/[id]/estadisticas/formulario-estadisticas";
import { consultarEstadisticasPartido, guardarEstadisticaJugador } from "@/app/actions/estadisticas-partido";
import type { EstadisticasPartido } from "@/types/estadisticas-partido";

vi.mock("@/app/actions/estadisticas-partido", () => ({ consultarEstadisticasPartido: vi.fn(), guardarEstadisticaJugador: vi.fn() }));
const datos: EstadisticasPartido = { partidoId: 1, temporadaId: 1, estado: "EN_CURSO", resultadoOficial: false,
  jugadoresHabilitados: [{ jugadorId: 7, nombre: "Ana", equipoId: 1 }, { jugadorId: 8, nombre: "Luis", equipoId: 2 }],
  registros: [{ jugadorId: 7, goles: 2, asistencias: 1, tarjetas: 0 }] };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(consultarEstadisticasPartido).mockResolvedValue({ ok: true, data: datos });
});

it("cambia de jugador sin trasladar los valores editados a otra ficha", async () => {
  render(<FormularioEstadisticas idTexto="1" />);
  const goles = await screen.findByLabelText("goles");
  expect(goles).toHaveValue(2);
  fireEvent.change(goles, { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Jugador"), { target: { value: "8" } });
  expect(goles).toHaveValue(0);
  fireEvent.change(screen.getByLabelText("Jugador"), { target: { value: "7" } });
  expect(goles).toHaveValue(2);
});

it("muestra lo guardado al actualizar y permite confirmar una edición", async () => {
  vi.mocked(guardarEstadisticaJugador).mockResolvedValue({ ok: true, data: { jugadorId: 7, goles: 3, asistencias: 1, tarjetas: 0 } });
  render(<FormularioEstadisticas idTexto="1" />);
  fireEvent.change(await screen.findByLabelText("goles"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
  await screen.findByText(/Ana guardadas correctamente/);
  expect(guardarEstadisticaJugador).toHaveBeenCalledWith(1, 7, { goles: 3, asistencias: 1, tarjetas: 0 });
  expect(screen.getByLabelText("goles")).toHaveValue(3);
  fireEvent.click(screen.getByRole("button", { name: "Actualizar datos" }));
  await waitFor(() => expect(screen.getByLabelText("goles")).toHaveValue(2));
});

it("mantiene los encuentros finalizados en solo lectura", async () => {
  vi.mocked(consultarEstadisticasPartido).mockResolvedValue({ ok: true, data: { ...datos, estado: "FINALIZADO", resultadoOficial: true } });
  render(<FormularioEstadisticas idTexto="1" />);
  expect(await screen.findByLabelText("goles")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Guardar/ })).toBeDisabled();
});
