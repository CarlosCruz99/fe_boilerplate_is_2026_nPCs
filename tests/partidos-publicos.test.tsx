import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ListaPartidos } from "@/components/partidos/lista-partidos";
import { DetalleMarcador } from "@/components/partidos/detalle-marcador";
import { consultarMarcadorPublico, equiposPartidosPublicos, listarPartidosPublicos } from "@/app/actions/marcador-publico";
import type { ListadoPartidos, MarcadorPublico } from "@/types/marcador-publico";
import type { Resultado } from "@/types/equipos";
vi.mock("@/app/actions/marcador-publico", () => ({ consultarMarcadorPublico: vi.fn(), equiposPartidosPublicos: vi.fn(), listarPartidosPublicos: vi.fn() }));
const lista: ListadoPartidos = { page: 1, pageSize: 20, total: 21, partidos: [
  { id: 1, jornada: 1, inicio: "2026-11-18T18:00:00Z", estado: "EN_CURSO", local: { id: 1, nombre: "Local", goles: 3 }, visitante: { id: 2, nombre: "Visitante", goles: 2 } },
  { id: 2, jornada: 2, inicio: "2026-11-19T18:00:00Z", estado: "PROGRAMADO", local: { id: 1, nombre: "Local", goles: null }, visitante: { id: 2, nombre: "Visitante", goles: null } },
] };
const marcador: MarcadorPublico = { partidoId: 1, estado: "EN_CURSO", duracionMinutos: 23,
  local: { equipoId: 1, nombre: "Local", goles: 3, faltas: 7, jugadores: [{ id: 1, nombre: "Participante local" }] },
  visitante: { equipoId: 2, nombre: "Visitante", goles: 2, faltas: 8, jugadores: [{ id: 2, nombre: "Participante visitante" }] },
  goleadores: [{ jugadorId: 3, nombre: "Goleador", equipoId: 1, goles: 2 }],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listarPartidosPublicos).mockResolvedValue({ ok: true, data: lista });
  vi.mocked(equiposPartidosPublicos).mockResolvedValue({ ok: true, data: [{ id: 1, nombre: "Local" }, { id: 2, nombre: "Visitante" }] });
  vi.mocked(consultarMarcadorPublico).mockResolvedValue({ ok: true, data: marcador });
});
afterEach(() => vi.useRealTimers());
it("lista sin sesión, con carga, enlaces y aviso para programados sin marcador", async () => {
  render(<ListaPartidos />);
  expect(screen.getByText("Cargando partidos…")).toBeInTheDocument();
  expect(await screen.findByLabelText("Marcador 3 a 2")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Ver marcador/ })).toHaveAttribute("href", "/partidos/1");
  expect(screen.getAllByRole("link")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Consultar partido programado" }));
  expect(screen.getByText("Este partido aún no comienza.")).toBeInTheDocument();
  expect(screen.queryByText("null")).not.toBeInTheDocument();
});
it("combina filtros, pagina y limpia regresando a página 1", async () => {
  render(<ListaPartidos />);
  await screen.findByLabelText("Marcador 3 a 2");
  fireEvent.click(screen.getByText("Siguiente"));
  await waitFor(() => expect(listarPartidosPublicos).toHaveBeenLastCalledWith({ page: 2 }));
  await screen.findByLabelText("Marcador 3 a 2");
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "FINALIZADO" } });
  fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "2" } });
  await waitFor(() => expect(listarPartidosPublicos).toHaveBeenLastCalledWith({ estado: "FINALIZADO", equipoId: 2, page: 1 }));
  fireEvent.click(screen.getByText("Limpiar filtros"));
  await waitFor(() => expect(listarPartidosPublicos).toHaveBeenLastCalledWith({ page: 1 }));
});
it("distingue vacío y error recuperable", async () => {
  vi.mocked(listarPartidosPublicos).mockResolvedValueOnce({ ok: false, status: 500, error: "Error" }).mockResolvedValueOnce({ ok: true, data: { ...lista, total: 0, partidos: [] } });
  render(<ListaPartidos />);
  await screen.findByText("No pudimos cargar los partidos. Intenta de nuevo.");
  fireEvent.click(screen.getByText("Reintentar"));
  await screen.findByText("No hay partidos que coincidan con los filtros.");
});
it("ignora listas antiguas tras cambiar filtros", async () => {
  let resolver!: (r: Resultado<ListadoPartidos>) => void;
  vi.mocked(listarPartidosPublicos).mockReturnValueOnce(new Promise(r => { resolver = r; }));
  render(<ListaPartidos />);
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "FINALIZADO" } });
  await screen.findByLabelText("Marcador 3 a 2");
  await act(async () => resolver({ ok: true, data: { ...lista, partidos: [] } }));
  expect(screen.getByLabelText("Marcador 3 a 2")).toBeInTheDocument();
});
it("muestra todos los datos oficiales sin derivar goles de goleadores", async () => {
  render(<DetalleMarcador partidoId={1} />);
  expect(await screen.findByLabelText("Marcador 3 a 2")).toBeInTheDocument();
  expect(screen.getByText("Duración: 23 minutos")).toBeInTheDocument();
  expect(screen.getByText("Local: 7 · Visitante: 8")).toBeInTheDocument();
  expect(screen.getByText("Goleador · Local · 2 goles")).toBeInTheDocument();
  expect(screen.getByText("Participante local")).toBeInTheDocument();
  expect(screen.getByText("Participante visitante")).toBeInTheDocument();
});
it("consulta a los 10 segundos, evita solapamientos y detiene al finalizar", async () => {
  vi.useFakeTimers();
  render(<DetalleMarcador partidoId={1} />);
  await act(async () => {});
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(1);
  let resolver!: (r: Resultado<MarcadorPublico>) => void;
  vi.mocked(consultarMarcadorPublico).mockReturnValueOnce(new Promise(r => { resolver = r; }));
  await act(async () => vi.advanceTimersByTime(9999));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(1);
  await act(async () => vi.advanceTimersByTime(1));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(2);
  await act(async () => vi.advanceTimersByTime(10000));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(2);
  await act(async () => resolver({ ok: true, data: { ...marcador, estado: "FINALIZADO", duracionMinutos: 90 } }));
  await act(async () => vi.advanceTimersByTime(30000));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Finalizado")).toBeInTheDocument();
});
it("no repite un finalizado y Actualizar permite consultar correcciones", async () => {
  vi.useFakeTimers();
  vi.mocked(consultarMarcadorPublico).mockResolvedValue({ ok: true, data: { ...marcador, estado: "FINALIZADO" } });
  render(<DetalleMarcador partidoId={1} />);
  await act(async () => {});
  await act(async () => vi.advanceTimersByTime(30000));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(1);
  await act(async () => fireEvent.click(screen.getByText("Actualizar")));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(2);
});
it("limpia el polling al salir", async () => {
  vi.useFakeTimers();
  const { unmount } = render(<DetalleMarcador partidoId={1} />);
  await act(async () => {});
  unmount();
  await act(async () => vi.advanceTimersByTime(30000));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(1);
});
it.each([404, 409])("oculta el marcador ante %i incluso tras una consulta válida", async status => {
  render(<DetalleMarcador partidoId={1} />);
  await screen.findByLabelText("Marcador 3 a 2");
  const error = status === 404 ? "El partido no existe." : "Este partido aún no comienza.";
  vi.mocked(consultarMarcadorPublico).mockResolvedValue({ ok: false, status, error });
  fireEvent.click(screen.getByText("Actualizar"));
  await screen.findByText(error);
  expect(screen.queryByLabelText("Marcador 3 a 2")).not.toBeInTheDocument();
});
it("conserva el último dato tras fallo de red y sigue intentando", async () => {
  vi.useFakeTimers();
  render(<DetalleMarcador partidoId={1} />);
  await act(async () => {});
  vi.mocked(consultarMarcadorPublico).mockRejectedValueOnce(new Error("red"));
  await act(async () => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Marcador 3 a 2")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el marcador. Intenta de nuevo.");
  await act(async () => vi.advanceTimersByTime(10000));
  expect(consultarMarcadorPublico).toHaveBeenCalledTimes(3);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
