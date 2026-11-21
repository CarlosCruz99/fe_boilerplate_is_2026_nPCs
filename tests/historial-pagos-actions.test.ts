// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { consultarHistorialPagos, temporadasHistorialPagos } from "@/app/actions/historial-pagos";
import { GET } from "@/app/api/pagos/[id]/comprobante/route";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
const usuario = { id: "cap", nombre: "Ana", email: "ana@test.sv", rol: "JUGADOR" as const, equipoActualId: 7, capitaneaEquipoId: 7 };
const data = { equipoId: 2, temporadaId: 1, concepto: null, pagos: [], totales: { totalRegistrado: "0.00", totalVerificado: "0.00", pendienteVerificacion: "0.00", totalRechazado: "0.00" } };
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", fetchMock); vi.stubEnv("API_URL", "http://backend.test/api/v1"); vi.mocked(getSession).mockResolvedValue("token-privado"); vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("resuelve el equipo histórico antes de consultar, sin reutilizar el actual", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ id: 2, temporadaId: 1 })).mockResolvedValueOnce(Response.json(data));
  expect(await consultarHistorialPagos(1)).toEqual({ ok: true, data });
  expect(fetchMock.mock.calls.map(c => String(c[0]))).toEqual(["http://backend.test/api/v1/equipos/mi-equipo?temporadaId=1", "http://backend.test/api/v1/equipos/2/pagos?temporadaId=1"]);
  expect(fetchMock.mock.calls[1][1]).toMatchObject({ cache: "no-store", redirect: "error", headers: { Authorization: "Bearer token-privado" } });
});
it("combina temporada y concepto sin recalcular totales", async () => {
  const filtrado = { ...data, concepto: "ARBITRAJE", totales: { ...data.totales, totalRegistrado: "19.50" } };
  fetchMock.mockResolvedValueOnce(Response.json({ id: 2, temporadaId: 1 })).mockResolvedValueOnce(Response.json(filtrado));
  expect(await consultarHistorialPagos(1, "ARBITRAJE")).toEqual({ ok: true, data: filtrado });
  expect(String(fetchMock.mock.calls[1][0])).toContain("temporadaId=1&concepto=ARBITRAJE");
});
it.each([401, 403, 404, 422, 500])("interrumpe resolución con %i sin pedir historial ni generar ceros", async status => {
  fetchMock.mockResolvedValue(new Response("{}", { status }));
  expect(await consultarHistorialPagos(1)).toMatchObject({ ok: false, status });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("sin capitanía no pide catálogo, historial ni archivo", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { ...usuario, capitaneaEquipoId: null } });
  expect(await temporadasHistorialPagos()).toMatchObject({ ok: false, status: 403 });
  expect(await consultarHistorialPagos(1)).toMatchObject({ ok: false, status: 403 });
  expect((await GET(new Request("http://local/api/pagos/1/comprobante"), { params: Promise.resolve({ id: "1" }) })).status).toBe(403);
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([0, -1, 1.5, NaN, 2147483648])("rechaza temporada inválida %s", async id => {
  expect(await consultarHistorialPagos(id)).toMatchObject({ ok: false, status: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it("rechaza equipo resuelto de otra temporada antes de pedir pagos", async () => {
  fetchMock.mockResolvedValue(Response.json({ id: 7, temporadaId: 2 }));
  expect(await consultarHistorialPagos(1)).toMatchObject({ ok: false, status: 502 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("rechaza totales ausentes o respuesta de otro filtro", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ id: 2, temporadaId: 1 })).mockResolvedValueOnce(Response.json({ ...data, totales: null }));
  expect(await consultarHistorialPagos(1)).toMatchObject({ ok: false, status: 502 });
});
it("descarga con token de servidor y cabeceras privadas sin exponer URL del backend", async () => {
  fetchMock.mockResolvedValue(new Response("%PDF-prueba", { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=interno.pdf" } }));
  const respuesta = await GET(new Request("http://local/api/pagos/5/comprobante"), { params: Promise.resolve({ id: "5" }) });
  expect(respuesta.status).toBe(200);
  expect(respuesta.headers.get("Cache-Control")).toBe("private, no-store");
  expect(respuesta.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(respuesta.headers.get("Content-Disposition")).toBe('attachment; filename="pago-5.pdf"');
  expect(await respuesta.text()).toBe("%PDF-prueba");
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/api/v1/pagos/5/comprobante");
});
it.each([401, 403, 404])("no sustituye comprobante privado con error %i por archivo válido", async status => {
  fetchMock.mockResolvedValue(new Response(null, { status }));
  const respuesta = await GET(new Request("http://local/api/pagos/5/comprobante"), { params: Promise.resolve({ id: "5" }) });
  expect(respuesta.status).toBe(status); expect(await respuesta.text()).toBe("");
});
it("rechaza MIME no permitido", async () => {
  fetchMock.mockResolvedValue(new Response("<script/>", { headers: { "Content-Type": "text/html" } }));
  expect((await GET(new Request("http://local/api/pagos/5/comprobante"), { params: Promise.resolve({ id: "5" }) })).status).toBe(502);
});
it("sin sesión no descarga", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "sin-sesion" });
  expect((await GET(new Request("http://local/api/pagos/5/comprobante"), { params: Promise.resolve({ id: "5" }) })).status).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();
});
