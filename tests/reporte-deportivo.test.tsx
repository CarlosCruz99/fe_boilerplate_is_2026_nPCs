import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { consultarReporteDeportivo } from "@/app/actions/reporte-deportivo";
import { VistaReporteDeportivo } from "@/app/reportes/deportivo/vista-reporte-deportivo";
import { calendarioApi } from "@/lib/calendario-api";
import type { ReporteDeportivo } from "@/types/reporte-deportivo";

vi.mock("@/lib/calendario-api", () => ({ calendarioApi: vi.fn() }));
const api = vi.mocked(calendarioApi);
const temporadas = [
  { id: 2, nombre: "Clausura 2025", actual: false, inscripcionAbierta: false },
  { id: 5, nombre: "Apertura 2026", actual: true, inscripcionAbierta: false },
];
const reporte: ReporteDeportivo = {
  temporadaId: 5,
  totalPartidos: 19,
  totalGoles: 42,
  totalTarjetas: 13,
  totalAsistencias: 22,
  generadoEn: "2026-11-20T14:00:00.000Z",
};

beforeEach(() => {
  api.mockReset();
});

it("selecciona la temporada actual y muestra las cuatro cifras oficiales", async () => {
  api.mockResolvedValueOnce({ ok: true, data: temporadas }).mockResolvedValueOnce({ ok: true, data: reporte });
  render(<VistaReporteDeportivo />);
  const resumen = await screen.findByRole("region", { name: "Apertura 2026" });
  expect(screen.getByLabelText("Temporada")).toHaveValue("5");
  expect(within(resumen).getAllByRole("term").map(term => term.textContent))
    .toEqual(["Partidos finalizados", "Goles", "Tarjetas", "Asistencias"]);
  expect(within(resumen).getAllByRole("definition").map(value => value.textContent))
    .toEqual(["19", "42", "13", "22"]);
  expect(api).toHaveBeenLastCalledWith("temporadas/5/reporte-deportivo", {}, expect.any(String));
});

it("cambia de temporada y distingue un error recuperable de cifras realmente en cero", async () => {
  api.mockResolvedValueOnce({ ok: true, data: temporadas })
    .mockResolvedValueOnce({ ok: true, data: reporte })
    .mockResolvedValueOnce({ ok: false, status: 503, error: "Servicio no disponible." })
    .mockResolvedValueOnce({ ok: true, data: {
      ...reporte, temporadaId: 2, totalPartidos: 0, totalGoles: 0, totalTarjetas: 0, totalAsistencias: 0,
    } });
  render(<VistaReporteDeportivo />);
  await screen.findByRole("region", { name: "Apertura 2026" });
  fireEvent.change(screen.getByLabelText("Temporada"), { target: { value: "2" } });

  expect(await screen.findByRole("alert")).toHaveTextContent("Servicio no disponible.");
  expect(screen.queryAllByRole("definition")).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  const resumen = await screen.findByRole("region", { name: "Clausura 2025" });
  expect(within(resumen).getByRole("status")).toHaveTextContent("Esta temporada aún no tiene partidos finalizados.");
  expect(within(resumen).getAllByRole("definition").map(value => value.textContent)).toEqual(["0", "0", "0", "0"]);
  expect(api).toHaveBeenLastCalledWith("temporadas/2/reporte-deportivo", {}, expect.any(String));
});

it("muestra la falta de permiso al actualizar y retira los datos previos", async () => {
  api.mockResolvedValueOnce({ ok: true, data: temporadas })
    .mockResolvedValueOnce({ ok: true, data: reporte })
    .mockResolvedValueOnce({ ok: false, status: 403, error: "No tienes permiso para esta acción." });
  render(<VistaReporteDeportivo />);
  await screen.findByRole("region", { name: "Apertura 2026" });
  fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso");
  expect(screen.queryAllByRole("definition")).toHaveLength(0);
});

it("rechaza un identificador inválido sin llamar a la API", async () => {
  expect(await consultarReporteDeportivo(2147483648)).toMatchObject({ ok: false, status: 400 });
  expect(api).not.toHaveBeenCalled();
});
