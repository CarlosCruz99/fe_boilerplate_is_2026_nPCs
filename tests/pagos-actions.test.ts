// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { obtenerSesion } from "@/app/actions/session";
import { equiposApi } from "@/lib/equipos-api";
import { consultarCuotasPago, registrarPago } from "@/app/actions/pagos";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/equipos-api", () => ({ equiposApi: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it("no consulta datos sin capitanía", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "sin-sesion" });
  expect(await consultarCuotasPago()).toMatchObject({ ok: false, status: 403 });
  expect(await registrarPago(1, new FormData(), "clave-valida-123456")).toMatchObject({ ok: false, status: 403 });
  expect(equiposApi).not.toHaveBeenCalled();
});
it("deriva equipo de sesión y reenvía multipart con clave sin Content-Type manual", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { id: "cap", nombre: "Cap", email: "cap@test.sv", rol: "JUGADOR", equipoActualId: 7, capitaneaEquipoId: 2 } });
  vi.mocked(equiposApi)
    .mockResolvedValueOnce({ ok: true, data: [{ id: 3 }, { id: 4 }] })
    .mockResolvedValueOnce({ ok: false, status: 404, error: "Sin equipo" })
    .mockResolvedValueOnce({ ok: true, data: { id: 2, temporadaId: 4 } })
    .mockResolvedValueOnce({ ok: true, data: { cuotas: [] } });
  await consultarCuotasPago();
  expect(equiposApi).toHaveBeenCalledWith("JUGADOR", "equipos/2/cuotas?temporadaId=4");
  const datos = new FormData(); datos.set("monto", "10.00"); datos.set("fechaPago", "2026-01-01"); datos.set("comprobante", new File(["pdf"], "pago.pdf", { type: "application/pdf" })); datos.set("equipoId", "999");
  vi.mocked(equiposApi).mockResolvedValue({ ok: true, data: { id: 1, cuotaId: 5, estado: "PENDIENTE" } });
  expect(await registrarPago(5, datos, "clave-valida-123456")).toMatchObject({ ok: true });
  const init = vi.mocked(equiposApi).mock.calls[4][2]!;
  expect(init.headers).toEqual({ "Idempotency-Key": "clave-valida-123456" });
  expect((init.body as FormData).has("equipoId")).toBe(false);
  vi.mocked(equiposApi).mockResolvedValue({ ok: true, data: { id: 1, cuotaId: 5, estado: "VERIFICADO" } });
  expect(await registrarPago(5, datos, "clave-valida-123456")).toMatchObject({ ok: false, status: 502 });
});
it("no consulta cuotas de otra temporada o equipo aunque exista capitanía histórica", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { id: "cap", nombre: "Cap", email: "cap@test.sv", rol: "JUGADOR", equipoActualId: 7, capitaneaEquipoId: 2 } });
  vi.mocked(equiposApi).mockResolvedValueOnce({ ok: true, data: [{ id: 3 }] }).mockResolvedValueOnce({ ok: true, data: { id: 99, temporadaId: 3 } });
  expect(await consultarCuotasPago()).toMatchObject({ ok: false, status: 404 });
  expect(equiposApi).toHaveBeenCalledTimes(2);
});
