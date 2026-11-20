import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { consultarReportePagos } from "@/app/actions/reporte-pagos";
import { VistaReportePagos } from "@/app/reportes/pagos/vista-reporte-pagos";
import { calendarioApi } from "@/lib/calendario-api";
import type { ReportePagos } from "@/types/reporte-pagos";

vi.mock("@/lib/calendario-api", () => ({ calendarioApi: vi.fn() }));
const api = vi.mocked(calendarioApi);
const temporadas = [
  { id: 2, nombre: "Clausura 2025", actual: false, inscripcionAbierta: false },
  { id: 5, nombre: "Apertura 2026", actual: true, inscripcionAbierta: false },
];
const reporte: ReportePagos = {
  temporadaId: 5,
  concepto: "TODOS",
  generadoEn: "2026-11-05T22:30:00.000Z",
  equipos: [
    { equipoId: 7, nombre: "Leones", estado: "MOROSO", vencidoDesde: "2026-11-02",
      totalCuotas: "180.25", pagado: "60.00", saldoPendiente: "120.25" },
  ],
  totales: { totalCuotas: "180.25", pagado: "60.00", saldoPendiente: "120.25", equiposMorosos: 1 },
};

beforeEach(() => {
  api.mockReset();
  api.mockResolvedValueOnce({ ok: true, data: temporadas });
});

it("muestra la temporada actual, la fecha de mora y los importes del servidor", async () => {
  api.mockResolvedValueOnce({ ok: true, data: reporte });
  render(<VistaReportePagos />);
  const tabla = await screen.findByRole("table");
  const fila = within(tabla).getByRole("row", { name: /Leones/ });
  expect(screen.getByLabelText("Temporada")).toHaveValue("5");
  expect(within(fila).getByText("$120.25")).toBeInTheDocument();
  expect(within(fila).getByText("Moroso")).toBeInTheDocument();
  expect(fila.querySelector("time")).toHaveAttribute("datetime", "2026-11-02");
  expect(within(tabla).getByRole("row", { name: /Totales.*1 equipo moroso/ })).toBeInTheDocument();
  expect(api).toHaveBeenLastCalledWith("reportes/pagos?temporadaId=5&concepto=TODOS", {}, expect.any(String));
});

it("aplica los filtros al actualizar y distingue un reporte vacío de un error", async () => {
  api.mockResolvedValueOnce({ ok: true, data: reporte })
    .mockResolvedValueOnce({ ok: false, status: 503, error: "Servicio no disponible." })
    .mockResolvedValueOnce({ ok: true, data: {
      ...reporte, equipos: [],
      totales: { totalCuotas: "0.00", pagado: "0.00", saldoPendiente: "0.00", equiposMorosos: 0 },
    } });
  render(<VistaReportePagos />);
  await screen.findByRole("table");
  fireEvent.change(screen.getByLabelText("Temporada"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "ARBITRAJE" } });
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "MOROSO" } });
  expect(api).toHaveBeenCalledTimes(2);

  fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  await screen.findByRole("alert");
  expect(screen.queryByRole("table")).toBeNull();
  expect(api).toHaveBeenLastCalledWith(
    "reportes/pagos?temporadaId=2&concepto=ARBITRAJE&estado=MOROSO", {}, expect.any(String),
  );
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await screen.findByText("No hay equipos que coincidan con los filtros.");
  expect(within(screen.getByRole("table")).getByRole("row", { name: /Totales.*0 equipos morosos/ })).toBeInTheDocument();
});

it("vuelve a consultar sin cambiar los filtros y muestra la denegación de acceso", async () => {
  api.mockResolvedValueOnce({ ok: true, data: reporte })
    .mockResolvedValueOnce({ ok: false, status: 403, error: "Acceso denegado." });
  render(<VistaReportePagos />);
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Acceso denegado."));
  expect(screen.queryByRole("table")).toBeNull();
});

it("valida filtros antes de consultar el API", async () => {
  expect(await consultarReportePagos({ temporadaId: 0, concepto: "TODOS", estado: "" }))
    .toMatchObject({ ok: false, status: 400 });
  expect(api).not.toHaveBeenCalled();
});
