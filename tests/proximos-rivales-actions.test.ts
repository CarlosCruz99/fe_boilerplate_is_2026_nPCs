// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { consultarProximosRivales } from "@/app/actions/proximos-rivales";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
const usuario = { id: "cap", nombre: "Cap", email: "cap@test.sv", rol: "JUGADOR" as const, equipoActualId: 7, capitaneaEquipoId: 2 };
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", fetchMock); vi.stubEnv("API_URL", "http://backend.test/api/v1"); vi.mocked(getSession).mockResolvedValue("token"); vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("deriva equipo capitaneado de sesión y consulta con token y sin caché", async () => {
  fetchMock.mockResolvedValue(Response.json({ equipoId: 2, proximos: [] }));
  expect(await consultarProximosRivales()).toMatchObject({ ok: true });
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/api/v1/equipos/2/proximos-partidos");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store", headers: { Authorization: "Bearer token" } });
});
it("no consulta datos sin capitanía", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { ...usuario, capitaneaEquipoId: null } });
  expect(await consultarProximosRivales()).toMatchObject({ ok: false, status: 403 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it("sin sesión devuelve 401 sin consultar", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "sin-sesion" });
  expect(await consultarProximosRivales()).toMatchObject({ ok: false, status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([403, 500])("conserva status %i para manejar permisos y error", async status => {
  fetchMock.mockResolvedValue(new Response("{}", { status }));
  expect(await consultarProximosRivales()).toMatchObject({ ok: false, status });
});
it("rechaza datos de otro equipo", async () => {
  fetchMock.mockResolvedValue(Response.json({ equipoId: 7, proximos: [] }));
  expect(await consultarProximosRivales()).toMatchObject({ ok: false, status: 503 });
});
