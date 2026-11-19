import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ProximosRivales } from "@/components/posiciones/proximos-rivales";
import { VistaPosiciones } from "@/components/posiciones/tabla-posiciones";
import { consultarProximosRivales } from "@/app/actions/proximos-rivales";
import { consultarPosiciones } from "@/app/actions/posiciones";
import { useAuth } from "@/contexts/auth-context";
import type { ProximosRivales as Datos } from "@/types/proximos-rivales";
import type { Resultado } from "@/types/equipos";
vi.mock("@/app/actions/proximos-rivales", () => ({ consultarProximosRivales: vi.fn() }));
vi.mock("@/app/actions/posiciones", () => ({ consultarPosiciones: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
const data: Datos = { equipoId: 2, proximos: [{ partidoId: 2, fechaHora: "2026-11-23T18:00:00Z", rival: { equipoId: 1, nombre: "Rival posterior", lugar: null, puntos: null } }, { partidoId: 1, fechaHora: "2026-11-20T18:00:00Z", rival: { equipoId: 3, nombre: "Rival próximo", lugar: 4, puntos: 0 } }] };
function sesion(cap: number | null = 2) { vi.mocked(useAuth).mockReturnValue({ estado: "autenticado", rol: "JUGADOR", capitaneaEquipoId: cap, equipoActualId: 2, usuario: { id: "cap" } } as ReturnType<typeof useAuth>); }
beforeEach(() => { vi.resetAllMocks(); sesion(); vi.mocked(consultarProximosRivales).mockResolvedValue({ ok: true, data }); });
it("solo capitán ve rivales ordenados con fecha, lugar, puntos y nulos explícitos", async () => {
  render(<ProximosRivales />);
  expect(screen.getByText("Cargando próximos partidos…")).toBeInTheDocument();
  await screen.findByText("Rival próximo");
  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Rival próximo");
  expect(screen.getByText("Lugar: 4 · Puntos: 0")).toBeInTheDocument();
  expect(screen.getByText("Lugar: Sin posición · Puntos: Sin registro")).toBeInTheDocument();
});
it("no capitán no monta sección ni solicita datos", () => {
  sesion(null); render(<ProximosRivales />);
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  expect(consultarProximosRivales).not.toHaveBeenCalled();
});
it("oculta la sección ante 403", async () => {
  vi.mocked(consultarProximosRivales).mockResolvedValue({ ok: false, status: 403, error: "Sin permiso" });
  render(<ProximosRivales />);
  await act(async () => {});
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
});
it("muestra vacío", async () => {
  vi.mocked(consultarProximosRivales).mockResolvedValue({ ok: true, data: { equipoId: 2, proximos: [] } });
  render(<ProximosRivales />);
  await screen.findByText("No tienes partidos pendientes.");
});
it("permite reintento y no afecta tabla pública", async () => {
  vi.mocked(consultarPosiciones).mockResolvedValue({ ok: true, data: { temporadaId: 1, posiciones: [{ lugar: 1, equipoId: 2, equipo: "Mi equipo", pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 0, dg: 2, puntos: 3 }] } });
  vi.mocked(consultarProximosRivales).mockRejectedValueOnce(new Error("red"));
  render(<VistaPosiciones><ProximosRivales /></VistaPosiciones>);
  await screen.findByRole("alert");
  expect(screen.getByRole("table")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Reintentar próximos partidos"));
  await screen.findByText("Rival próximo");
});
it("descarta respuesta al perder capitanía", async () => {
  let resolver!: (r: Resultado<Datos>) => void;
  vi.mocked(consultarProximosRivales).mockReturnValue(new Promise(r => { resolver = r; }));
  const { rerender } = render(<ProximosRivales />);
  sesion(null); rerender(<ProximosRivales />);
  await act(async () => resolver({ ok: true, data }));
  expect(screen.queryByText("Rival próximo")).not.toBeInTheDocument();
});
