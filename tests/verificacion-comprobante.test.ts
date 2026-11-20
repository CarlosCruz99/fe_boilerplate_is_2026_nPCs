// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GET } from "@/app/api/pagos/[id]/revision/comprobante/route";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import type { UsuarioSesion } from "@/types/auth";

vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const api = vi.fn<typeof fetch>();
const usuario: UsuarioSesion = {
  id: "org", nombre: "Organizador", email: "org@liga.test", rol: "ORGANIZADOR", equipoActualId: null, capitaneaEquipoId: null,
};
const params = { params: Promise.resolve({ id: "104" }) };
const request = new Request("http://frontend.test");

beforeEach(() => {
  api.mockReset();
  vi.stubGlobal("fetch", api);
  vi.stubEnv("API_URL", "http://backend.test/api/v1");
  vi.mocked(getSession).mockResolvedValue("token");
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("permite descargar el comprobante al organizador con una respuesta privada", async () => {
  api.mockResolvedValueOnce(new Response("contenido", { headers: { "Content-Type": "application/pdf" } }));
  const respuesta = await GET(request, params);
  expect(respuesta.status).toBe(200);
  expect(String(api.mock.calls[0][0])).toBe("http://backend.test/api/v1/pagos/104/revision/comprobante");
  expect(new Headers(api.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer token");
  expect(respuesta.headers.get("Content-Disposition")).toBe('attachment; filename="pago-104.pdf"');
  expect(respuesta.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await respuesta.text()).toBe("contenido");
});

it("bloquea otros roles y rechaza contenido ajeno a los tipos de comprobante", async () => {
  vi.mocked(obtenerSesion).mockResolvedValueOnce({ estado: "autenticado", usuario: { ...usuario, rol: "JUGADOR" } });
  expect((await GET(request, params)).status).toBe(403);
  expect(api).not.toHaveBeenCalled();
  api.mockResolvedValueOnce(new Response("<html>", { headers: { "Content-Type": "text/html" } }));
  expect((await GET(request, params)).status).toBe(502);
});
