// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { consultarDestacados } from "@/app/actions/destacados";
import { calendarioApi } from "@/lib/calendario-api";
vi.mock("@/lib/calendario-api", () => ({ calendarioApi: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it("consume el endpoint real BE-11.1 sin recalcular empates", async () => {
  const respuesta = { ok: true as const, data: { temporadaId: 3, metrica: "goles", jugadores: [{ jugadorId: 1, nombre: "Ana", posicion: 1, total: 2 }, { jugadorId: 2, nombre: "Luis", posicion: 1, total: 2 }] } };
  vi.mocked(calendarioApi).mockResolvedValue(respuesta);
  expect(await consultarDestacados(3, "goles")).toEqual(respuesta);
  expect(calendarioApi).toHaveBeenCalledWith("temporadas/3/jugadores-destacados?metrica=goles", {}, expect.any(String));
});
it.each([0, -1, 1.5, NaN, 2147483648])("rechaza temporada inválida %s antes de consultar", async id => {
  expect(await consultarDestacados(id, "goles")).toMatchObject({ ok: false, status: 400 });
  expect(calendarioApi).not.toHaveBeenCalled();
});
