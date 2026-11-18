// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { consultarMarcadorPublico, equiposPartidosPublicos, listarPartidosPublicos } from "@/app/actions/marcador-publico";
import { getSession } from "@/lib/session";
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("API_URL", "http://backend.test/api/v1");
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(getSession).mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("consulta pública sin token, con filtros combinados y 20 por página", async () => {
  fetchMock.mockResolvedValue(Response.json({ partidos: [] }));
  await listarPartidosPublicos({ estado: "EN_CURSO", equipoId: 4, page: 2 });
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe("http://backend.test/api/v1/partidos?page=2&pageSize=20&estado=EN_CURSO&equipoId=4");
  expect(init.headers).toEqual({});
  expect(init.cache).toBe("no-store");
});
it("reenvía token opcional sin decidir visibilidad de borradores en cliente", async () => {
  vi.mocked(getSession).mockResolvedValue("token-opcional");
  fetchMock.mockResolvedValue(Response.json({ partidoId: 1 }));
  await consultarMarcadorPublico(1);
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/api/v1/partidos/1/marcador");
  expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer token-opcional" });
});
it("obtiene equipos de todas las páginas sin duplicarlos ni consultar catálogo privado", async () => {
  const p = (id: number, nombre: string) => ({ local: { id, nombre }, visitante: { id: 2, nombre: "B" } });
  fetchMock.mockResolvedValueOnce(Response.json({ total: 51, partidos: [p(1, "A")] }))
    .mockResolvedValueOnce(Response.json({ total: 51, partidos: [p(3, "C")] }));
  expect(await equiposPartidosPublicos()).toEqual({ ok: true, data: [{ id: 1, nombre: "A" }, { id: 2, nombre: "B" }, { id: 3, nombre: "C" }] });
  expect(String(fetchMock.mock.calls[1][0])).toBe("http://backend.test/api/v1/partidos?page=2&pageSize=50");
});
it.each([404, 409, 500])("traduce %i en mensajes del contrato", async status => {
  fetchMock.mockResolvedValue(new Response("{}", { status }));
  expect(await consultarMarcadorPublico(1)).toEqual({ ok: false, status, error: status === 404 ? "El partido no existe." : status === 409 ? "Este partido aún no comienza." : "No pudimos cargar el marcador. Intenta de nuevo." });
});
it("maneja la red sin requerir sesión", async () => {
  fetchMock.mockRejectedValue(new Error("red"));
  expect(await listarPartidosPublicos()).toMatchObject({ ok: false, status: 503 });
});
it.each([0, -1, NaN, 1.5, 2147483648])("valida id %s antes de consultar", async id => {
  expect(await consultarMarcadorPublico(id)).toMatchObject({ ok: false, status: 404 });
  expect(await listarPartidosPublicos({ equipoId: id })).toMatchObject({ ok: false, status: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});
