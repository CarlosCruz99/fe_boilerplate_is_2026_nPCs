import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { VistaRevisionPago } from "@/app/organizador/pagos/[id]/vista-revision-pago";
import { BandejaVerificacion } from "@/app/organizador/pagos/bandeja-verificacion";
import { decidirPago } from "@/app/actions/verificacion-pagos";
import { calendarioApi } from "@/lib/calendario-api";
import type { RevisionPago } from "@/types/verificacion-pagos";

vi.mock("@/lib/calendario-api", () => ({ calendarioApi: vi.fn() }));
const api = vi.mocked(calendarioApi);
const pago: RevisionPago = {
  id: 104, estado: "PENDIENTE", monto: "25.00", fechaPago: "2026-11-05", tieneComprobante: true,
  cuota: { id: 31, equipo: { id: 7, nombre: "Leones" }, temporadaId: 1, concepto: "INSCRIPCION",
    montoTotal: "100.00", saldo: "100.00", disponible: "75.00" },
  verificadoPor: null, verificadoEn: null, motivoRechazo: null,
};
const resuelto = { id: 104, verificadoPor: "org", verificadoEn: "2026-11-05T20:00:00Z" };

beforeEach(() => {
  api.mockReset();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

it("pagina la cola y enlaza el detalle del pago", async () => {
  api.mockResolvedValueOnce({ ok: true, data: { total: 21, page: 1, pageSize: 20, pagos: [
    { ...pago, equipo: pago.cuota.equipo, concepto: pago.cuota.concepto, cuotaId: 31 },
  ] } }).mockResolvedValueOnce({ ok: true, data: { total: 0, page: 2, pageSize: 20, pagos: [] } });
  render(<BandejaVerificacion />);
  expect(await screen.findByRole("link", { name: /Revisar pago/ })).toHaveAttribute("href", "/organizador/pagos/104");
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("No hay pagos pendientes de verificación.")).toBeInTheDocument();
  expect(api).toHaveBeenLastCalledWith("pagos/pendientes?page=2", {}, expect.any(String));
});

it("verifica únicamente después de confirmar y presenta el saldo devuelto", async () => {
  api.mockResolvedValueOnce({ ok: true, data: pago })
    .mockResolvedValueOnce({ ok: true, data: { ...resuelto, estado: "VERIFICADO", saldo: "75.00", disponible: "75.00" } });
  render(<VistaRevisionPago id={104} />);
  fireEvent.click(await screen.findByRole("button", { name: "Verificar pago" }));
  expect(api).toHaveBeenCalledTimes(1);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }));
  expect(await screen.findByText("Pago verificado.")).toBeInTheDocument();
  expect(screen.getByText("Saldo de la cuota").nextElementSibling).toHaveTextContent("$75.00");
  expect(screen.queryByRole("button", { name: "Verificar pago" })).toBeNull();
  expect(api).toHaveBeenLastCalledWith("pagos/104/verificacion", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: '{"estado":"VERIFICADO"}',
  }, expect.any(String));
});

it("permite rechazar sin archivo y exige un motivo antes de liberar el disponible", async () => {
  api.mockResolvedValueOnce({ ok: true, data: { ...pago, tieneComprobante: false } })
    .mockResolvedValueOnce({ ok: true, data: { ...resuelto, estado: "RECHAZADO", saldo: "100.00", disponible: "100.00" } });
  render(<VistaRevisionPago id={104} />);
  expect(await screen.findByRole("button", { name: "Verificar pago" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Rechazar con motivo" }));
  const modal = within(screen.getByRole("dialog"));
  const motivo = "El comprobante del pago no está disponible.";
  fireEvent.change(modal.getByRole("textbox"), { target: { value: "corto" } });
  fireEvent.click(modal.getByRole("button", { name: "Confirmar" }));
  expect(modal.getByRole("alert")).toHaveTextContent("entre 20 y 500");
  expect(api).toHaveBeenCalledTimes(1);
  fireEvent.change(modal.getByRole("textbox"), { target: { value: motivo } });
  fireEvent.click(modal.getByRole("button", { name: "Confirmar" }));
  expect(await screen.findByText("Pago rechazado.")).toBeInTheDocument();
  expect(screen.getByText(motivo)).toBeInTheDocument();
  expect(screen.getByText("Disponible para registrar").nextElementSibling).toHaveTextContent("$100.00");
});

it("refresca el pago en un conflicto y retira las acciones si ya fue resuelto", async () => {
  api.mockResolvedValueOnce({ ok: true, data: pago })
    .mockResolvedValueOnce({ ok: false, status: 409, error: "El pago ya fue resuelto." })
    .mockResolvedValueOnce({ ok: true, data: { ...pago, ...resuelto, estado: "VERIFICADO" } });
  render(<VistaRevisionPago id={104} />);
  fireEvent.click(await screen.findByRole("button", { name: "Verificar pago" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }));
  expect(await screen.findByText("El pago ya fue resuelto.")).toBeInTheDocument();
  expect(await screen.findByText("Verificado")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Rechazar con motivo" })).toBeNull();
});

it("valida el motivo del rechazo antes de invocar el backend", async () => {
  expect(await decidirPago(104, "RECHAZADO", "   corto   ")).toMatchObject({ ok: false, status: 400 });
  expect(api).not.toHaveBeenCalled();
});
