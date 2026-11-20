// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { consultarGaleria } from "@/app/actions/galeria";
import { GET } from "@/app/api/partidos/[id]/galeria/[contenidoId]/archivo/route";
import { getSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchApi = vi.fn<typeof fetch>();
const contenidoId = "d2cadb13-7d40-4e59-a08b-314e429a0494";
const params = { params: Promise.resolve({ id: "5", contenidoId }) };
const solicitud = new Request("http://frontend.test", { headers: { Range: "bytes=1-2" } });

beforeEach(() => {
  fetchApi.mockReset();
  vi.mocked(getSession).mockResolvedValue("token");
  vi.stubGlobal("fetch", fetchApi);
  vi.stubEnv("API_URL", "http://backend.test/api/v1");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("consulta la página solicitada y conserva los errores de acceso", async () => {
  const pagina = { items: [], page: 2, pageSize: 6, totalElementos: 0, totalPaginas: 0 };
  fetchApi.mockResolvedValueOnce(Response.json(pagina)).mockResolvedValueOnce(new Response(null, { status: 403 }));
  expect(await consultarGaleria("5", "2")).toEqual({ ok: true, data: pagina });
  expect(String(fetchApi.mock.calls[0][0])).toBe("http://backend.test/api/v1/partidos/5/galeria?page=2");
  expect(await consultarGaleria("5", "2")).toMatchObject({ ok: false, status: 403 });
  expect(await consultarGaleria("5", "0")).toMatchObject({ ok: false, status: 400 });
  expect(fetchApi).toHaveBeenCalledTimes(2);
});

it("transmite un rango del video con sesión privada", async () => {
  fetchApi.mockResolvedValue(new Response("bc", {
    status: 206,
    headers: { "Content-Type": "video/mp4", "Content-Range": "bytes 1-2/4", "Accept-Ranges": "bytes" },
  }));
  const respuesta = await GET(solicitud, params);
  const [url, init] = fetchApi.mock.calls[0];
  expect(String(url)).toBe(`http://backend.test/api/v1/partidos/5/galeria/${contenidoId}/archivo`);
  expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  expect(new Headers(init?.headers).get("Range")).toBe("bytes=1-2");
  expect(respuesta.status).toBe(206);
  expect(respuesta.headers.get("Content-Range")).toBe("bytes 1-2/4");
  expect(respuesta.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await respuesta.text()).toBe("bc");
});

it("rechaza archivos sin sesión y tipos de respuesta inesperados", async () => {
  vi.mocked(getSession).mockResolvedValueOnce(undefined);
  expect((await GET(solicitud, params)).status).toBe(401);
  expect(fetchApi).not.toHaveBeenCalled();
  fetchApi.mockResolvedValue(new Response("<html>", { headers: { "Content-Type": "text/html" } }));
  expect((await GET(solicitud, params)).status).toBe(502);
});
