// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { consultarEstadisticasPersonales, temporadasEstadisticasPersonales } from "@/app/actions/estadisticas-personales";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
const usuario = { id: "jugador", nombre: "Ana", email: "ana@test.sv", rol: "JUGADOR" as const, equipoActualId: null, capitaneaEquipoId: null };
const data = { temporadaId: 2, acumulados: { goles: 0, asistencias: 0, tarjetas: 0 }, partidos: [] };
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", fetchMock); vi.stubEnv("API_URL", "http://backend.test/api/v1"); vi.mocked(getSession).mockResolvedValue("token"); vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("consume el endpoint sin enviar jugadorId y conserva ceros de 200 válido", async () => {
  fetchMock.mockResolvedValue(Response.json(data));
  expect(await consultarEstadisticasPersonales(2)).toEqual({ ok: true, data });
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/api/v1/temporadas/2/mis-estadisticas");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer token");
});
it("consulta catálogo para jugador", async () => {
  fetchMock.mockResolvedValue(Response.json([])); await temporadasEstadisticasPersonales();
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/api/v1/temporadas");
});
it("sin sesión no consulta datos", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "sin-sesion" });
  expect(await consultarEstadisticasPersonales(2)).toMatchObject({ ok: false, status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it("otro rol no consulta datos", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { ...usuario, rol: "ARBITRO" } });
  expect(await consultarEstadisticasPersonales(2)).toMatchObject({ ok: false, status: 403 });
  expect(await temporadasEstadisticasPersonales()).toMatchObject({ ok: false, status: 403 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([0, -1, 1.5, NaN, 2147483648])("rechaza temporada inválida %s", async id => {
  expect(await consultarEstadisticasPersonales(id)).toMatchObject({ ok: false, status: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([{ ...data, temporadaId: 1 }, { ...data, acumulados: null }, { ...data, partidos: null }, { ...data, acumulados: { goles: -1, asistencias: 0, tarjetas: 0 } }])("rechaza respuestas incompletas o de otra temporada", async respuesta => {
  fetchMock.mockResolvedValue(Response.json(respuesta));
  expect(await consultarEstadisticasPersonales(2)).toMatchObject({ ok: false, status: 502 });
});
it.each([403, 404, 500])("con error %i no genera acumulados ficticios", async status => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "No disponible" }), { status }));
  const resultado = await consultarEstadisticasPersonales(2);
  expect(resultado).toMatchObject({ ok: false, status }); expect(resultado).not.toHaveProperty("data");
});
