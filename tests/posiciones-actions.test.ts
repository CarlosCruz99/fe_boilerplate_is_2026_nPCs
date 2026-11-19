// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { consultarPosiciones } from "@/app/actions/posiciones";
const fetchMock = vi.fn();
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", fetchMock); vi.stubEnv("API_URL", "http://backend.test/api/v1"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("consulta posiciones sin autenticación, sin caché y sin recalcular", async () => {
  const data = { temporadaId: 1, posiciones: [{ lugar: 4, puntos: 13 }] };
  fetchMock.mockResolvedValue(Response.json(data));
  expect(await consultarPosiciones()).toEqual({ ok: true, data });
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/api/v1/posiciones");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
});
it.each([404, 500])("maneja %i sin revelar errores internos", async status => {
  fetchMock.mockResolvedValue(new Response("{}", { status }));
  expect(await consultarPosiciones()).toEqual({ ok: false, status, error: "No pudimos cargar la tabla. Intenta de nuevo." });
});
