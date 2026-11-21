import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { VistaDestacados } from "@/components/destacados/vista-destacados";
import { consultarDestacados, temporadasDestacados } from "@/app/actions/destacados";
import type { ClasificacionDestacados } from "@/types/destacados";
import type { Resultado } from "@/types/equipos";
vi.mock("@/app/actions/destacados", () => ({ consultarDestacados: vi.fn(), temporadasDestacados: vi.fn() }));
const data: ClasificacionDestacados = { temporadaId: 2, metrica: "goles", jugadores: [{ jugadorId: 8, nombre: "Ana", total: 4, posicion: 1 }, { jugadorId: 9, nombre: "Luis", total: 4, posicion: 1 }] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(temporadasDestacados).mockResolvedValue({ ok: true, data: [{ id: 1, nombre: "Anterior", actual: false, inscripcionAbierta: false }, { id: 2, nombre: "Actual", actual: true, inscripcionAbierta: false }] });
  vi.mocked(consultarDestacados).mockResolvedValue({ ok: true, data });
});
it("selecciona temporada actual, conserva empates y actualiza correcciones", async () => {
  render(<VistaDestacados />);
  await screen.findByText("Ana");
  expect(consultarDestacados).toHaveBeenCalledWith(2, "goles");
  const rows = screen.getAllByRole("row");
  expect(within(rows[1]).getAllByRole("cell")[0]).toHaveTextContent("1");
  expect(within(rows[2]).getAllByRole("cell")[0]).toHaveTextContent("1");
  vi.mocked(consultarDestacados).mockResolvedValue({ ok: true, data: { ...data, jugadores: [] } });
  fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  await screen.findByText("No hay estadísticas oficiales para esta temporada");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("descarta respuestas antiguas al cambiar temporada y métrica", async () => {
  let resolver!: (r: Resultado<ClasificacionDestacados>) => void;
  vi.mocked(consultarDestacados).mockReturnValueOnce(new Promise(r => { resolver = r; }));
  render(<VistaDestacados />);
  await screen.findByText("Consultando clasificación…");
  fireEvent.change(screen.getByLabelText("Temporada"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Métrica"), { target: { value: "asistencias" } });
  await screen.findByRole("columnheader", { name: "Total (Asistencias)" });
  expect(consultarDestacados).toHaveBeenLastCalledWith(1, "asistencias");
  await act(async () => resolver({ ok: true, data: { ...data, jugadores: [{ jugadorId: 10, nombre: "Obsoleto", posicion: 1, total: 99 }] } }));
  expect(screen.queryByText("Obsoleto")).not.toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();
});
it("distingue error de vacío y permite reintentar", async () => {
  vi.mocked(consultarDestacados).mockResolvedValueOnce({ ok: false, status: 503, error: "Servicio no disponible" });
  render(<VistaDestacados />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Servicio no disponible");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await screen.findByText("Ana");
});
it.each([401, 403])("maneja estado %i sin mostrar datos", async status => {
  vi.mocked(consultarDestacados).mockResolvedValue({ ok: false, status, error: "Error" });
  render(<VistaDestacados />);
  await screen.findByRole("alert");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  if (status === 401) expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
  else expect(screen.getByRole("alert")).toHaveTextContent("No tienes permiso para ver esta página.");
  await waitFor(() => expect(consultarDestacados).toHaveBeenCalledTimes(1));
});
