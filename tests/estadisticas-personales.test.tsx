import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { VistaEstadisticasPersonales } from "@/components/estadisticas-personales/vista-estadisticas";
import MisEstadisticasPage from "@/app/mis-estadisticas/page";
import { consultarEstadisticasPersonales, temporadasEstadisticasPersonales } from "@/app/actions/estadisticas-personales";
import { useAuth } from "@/contexts/auth-context";
import type { EstadisticasPersonales } from "@/types/estadisticas-personales";
import type { Resultado } from "@/types/equipos";
vi.mock("@/app/actions/estadisticas-personales", () => ({ consultarEstadisticasPersonales: vi.fn(), temporadasEstadisticasPersonales: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const data: EstadisticasPersonales = { temporadaId: 2, acumulados: { goles: 3, asistencias: 2, tarjetas: 1 }, partidos: [
  { partidoId: 8, fecha: "2026-11-18T18:00:00Z", rival: "Rival reciente", goles: 2, asistencias: 2, tarjetas: 1 },
  { partidoId: 4, fecha: "2026-11-15T18:00:00Z", rival: "Rival anterior", goles: 1, asistencias: 0, tarjetas: 0 },
] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useAuth).mockReturnValue({ estado: "autenticado", usuario: { id: "jugador", rol: "JUGADOR" }, equipoActualId: null, capitaneaEquipoId: null } as ReturnType<typeof useAuth>);
  vi.mocked(temporadasEstadisticasPersonales).mockResolvedValue({ ok: true, data: [{ id: 1, nombre: "Anterior", actual: false, inscripcionAbierta: false }, { id: 2, nombre: "Actual", actual: true, inscripcionAbierta: false }] });
  vi.mocked(consultarEstadisticasPersonales).mockResolvedValue({ ok: true, data });
});
async function seleccionar(id = "2") { fireEvent.change(await screen.findByLabelText("Temporada"), { target: { value: id } }); }
it("inicia sin ceros ni resultados y espera selección", async () => {
  render(<VistaEstadisticasPersonales />);
  await screen.findByText("Selecciona una temporada para consultar tus estadísticas.");
  expect(consultarEstadisticasPersonales).not.toHaveBeenCalled();
  expect(screen.queryByRole("region", { name: "Resumen de estadísticas" })).not.toBeInTheDocument();
});
it("muestra acumulados y filas de la selección en orden recibido, sin edición", async () => {
  render(<VistaEstadisticasPersonales />); await seleccionar();
  await screen.findByRole("table");
  expect(consultarEstadisticasPersonales).toHaveBeenCalledWith(2);
  const resumen = screen.getByRole("region", { name: "Resumen de estadísticas" });
  expect(resumen).toHaveTextContent("Goles3Asistencias2Tarjetas1");
  const filas = screen.getAllByRole("row");
  expect(filas[1]).toHaveTextContent("Rival reciente");
  expect(filas[2]).toHaveTextContent("Rival anterior");
  expect(within(filas[2]).getAllByRole("cell").map(c => c.textContent)).toEqual([expect.any(String), "1", "0", "0"]);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
it("muestra vacío y ceros únicamente tras respuesta válida", async () => {
  vi.mocked(consultarEstadisticasPersonales).mockResolvedValue({ ok: true, data: { temporadaId: 2, acumulados: { goles: 0, asistencias: 0, tarjetas: 0 }, partidos: [] } });
  render(<VistaEstadisticasPersonales />); await seleccionar();
  await screen.findByText("Sin estadísticas durante esta temporada");
  expect(screen.getByRole("region", { name: "Resumen de estadísticas" })).toHaveTextContent("Goles0Asistencias0Tarjetas0");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("al cambiar temporada oculta datos previos y descarta respuestas tardías", async () => {
  let resolver!: (r: Resultado<EstadisticasPersonales>) => void;
  vi.mocked(consultarEstadisticasPersonales).mockReturnValueOnce(new Promise(r => { resolver = r; })).mockResolvedValueOnce({ ok: false, status: 500, error: "Error de temporada" });
  render(<VistaEstadisticasPersonales />); await seleccionar();
  expect(screen.getByText("Cargando estadísticas…")).toBeInTheDocument();
  await seleccionar("1");
  await screen.findByRole("alert");
  await act(async () => resolver({ ok: true, data }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Resumen de estadísticas" })).not.toBeInTheDocument();
});
it("un fallo tras cambiar selección no conserva resumen y Reintentar consulta de nuevo", async () => {
  render(<VistaEstadisticasPersonales />); await seleccionar(); await screen.findByRole("table");
  vi.mocked(consultarEstadisticasPersonales).mockResolvedValueOnce({ ok: false, status: 503, error: "No pudimos cargar tus estadísticas." });
  await seleccionar("1"); await screen.findByRole("alert");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Resumen de estadísticas" })).not.toBeInTheDocument();
  vi.mocked(consultarEstadisticasPersonales).mockResolvedValueOnce({ ok: true, data: { ...data, temporadaId: 1 } });
  fireEvent.click(screen.getByText("Reintentar"));
  await screen.findByRole("table");
  expect(consultarEstadisticasPersonales).toHaveBeenLastCalledWith(1);
});
it.each([401, 403])("maneja %i sin presentar resultados", async status => {
  vi.mocked(consultarEstadisticasPersonales).mockResolvedValue({ ok: false, status, error: "No estás inscrito en esta temporada." });
  render(<VistaEstadisticasPersonales />); await seleccionar(); await screen.findByRole("alert");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  if (status === 401) expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
});
it("otro rol no monta pantalla ni consulta catálogo o estadísticas", () => {
  vi.mocked(useAuth).mockReturnValue({ estado: "autenticado", usuario: { id: "organizador", rol: "ORGANIZADOR" } } as ReturnType<typeof useAuth>);
  render(<MisEstadisticasPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("No tienes permiso para ver esta página.");
  expect(temporadasEstadisticasPersonales).not.toHaveBeenCalled();
  expect(consultarEstadisticasPersonales).not.toHaveBeenCalled();
});
it("permite reintentar el catálogo sin consultar estadísticas prematuramente", async () => {
  vi.mocked(temporadasEstadisticasPersonales).mockRejectedValueOnce(new Error("red"));
  render(<VistaEstadisticasPersonales />);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByText("Reintentar"));
  await screen.findByLabelText("Temporada");
  expect(consultarEstadisticasPersonales).not.toHaveBeenCalled();
});
