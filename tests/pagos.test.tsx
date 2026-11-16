import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { FormularioPago } from "@/app/equipo/cuotas/formulario-pago";
import { consultarCuotasPago, registrarPago } from "@/app/actions/pagos";
import { validarPago } from "@/lib/pagos-validation";
vi.mock("@/app/actions/pagos", () => ({ consultarCuotasPago: vi.fn(), registrarPago: vi.fn() }));
const cuota = { id: 1, equipoId: 2, concepto: "INSCRIPCION" as const, montoTotal: "100.00", totalVerificado: "20.00", saldo: "80.00", pendienteVerificacion: "10.00", disponible: "70.00" };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(consultarCuotasPago).mockResolvedValue({ ok: true, data: { cuotas: [cuota] } }); });
const archivo = () => new File(["%PDF-1"], "pago.pdf", { type: "application/pdf" });
async function llenar() {
  render(<FormularioPago />);
  await screen.findByText("Cuota #1 · Inscripción");
  fireEvent.change(screen.getByLabelText("Cuota"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Monto (USD)"), { target: { value: "10" } });
  fireEvent.change(screen.getByLabelText("Fecha de pago"), { target: { value: "2026-01-01" } });
  fireEvent.change(screen.getByLabelText("Comprobante"), { target: { files: [archivo()] } });
}
it("valida monto, fecha y comprobante", () => {
  expect(validarPago("70.01", "2026-01-01", archivo(), "70.00")).toContain("disponible");
  for (const monto of ["0", "-1", "1.123", "NaN"]) expect(validarPago(monto, "2026-01-01", archivo(), "70.00")).toBeTruthy();
  expect(validarPago("1", "2026-02-30", archivo())).toContain("fecha");
  expect(validarPago("1", "2999-01-01", archivo())).toContain("fecha");
  expect(validarPago("1", "2026-01-01", null)).toContain("obligatorio");
  expect(validarPago("1", "2026-01-01", new File(["x"], "x.svg", { type: "image/svg+xml" }))).toContain("PDF");
  expect(validarPago("1", "2026-01-01", new File([new Uint8Array(5 * 1024 * 1024 + 1)], "x.pdf", { type: "application/pdf" }))).toContain("5 MiB");
  expect(validarPago("70.00", "2026-01-01", archivo(), "70.00")).toBeNull();
});
it("conserva clave al reintentar y cambia al editar; confirma y actualiza cuotas", async () => {
  vi.mocked(registrarPago).mockResolvedValueOnce({ ok: false, status: 503, error: "Sin conexión" }).mockResolvedValueOnce({ ok: false, status: 500, error: "Error temporal" }).mockResolvedValueOnce({ ok: true, data: { id: 99, cuotaId: 1, monto: "11.00", fechaPago: "2026-01-01", estado: "PENDIENTE", saldo: "80.00", disponible: "59.00" } });
  await llenar();
  fireEvent.submit(screen.getByRole("button", { name: "Registrar pago" }).closest("form")!);
  await screen.findByText("Sin conexión");
  expect(screen.queryByText("Número de registro: 99")).toBeNull();
  fireEvent.submit(screen.getByRole("button", { name: "Registrar pago" }).closest("form")!);
  await screen.findByText("Error temporal");
  expect(vi.mocked(registrarPago).mock.calls[0][2]).toBe(vi.mocked(registrarPago).mock.calls[1][2]);
  fireEvent.change(screen.getByLabelText("Monto (USD)"), { target: { value: "11" } });
  vi.mocked(consultarCuotasPago).mockResolvedValue({ ok: true, data: { cuotas: [{ ...cuota, disponible: "59.00", pendienteVerificacion: "21.00" }] } });
  fireEvent.submit(screen.getByRole("button", { name: "Registrar pago" }).closest("form")!);
  await screen.findByText("Número de registro: 99");
  expect(vi.mocked(registrarPago).mock.calls[2][2]).not.toBe(vi.mocked(registrarPago).mock.calls[1][2]);
  expect(screen.getByText("El saldo se actualizará cuando un organizador apruebe el pago")).toBeInTheDocument();
  await waitFor(() => expect(consultarCuotasPago).toHaveBeenCalledTimes(2));
  expect(screen.getByText("$80.00")).toBeInTheDocument();
});
it("refresca disponible ante 409 sin confirmar éxito", async () => {
  vi.mocked(registrarPago).mockResolvedValue({ ok: false, status: 409, error: "Disponible insuficiente" });
  await llenar();
  fireEvent.submit(screen.getByRole("button", { name: "Registrar pago" }).closest("form")!);
  await screen.findByText("Disponible insuficiente");
  expect(consultarCuotasPago).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/Número de registro/)).toBeNull();
});
it("bloquea envíos repetidos mientras espera confirmación", async () => {
  let resolver!: (valor: Awaited<ReturnType<typeof registrarPago>>) => void;
  vi.mocked(registrarPago).mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
  await llenar();
  const formulario = screen.getByRole("button", { name: "Registrar pago" }).closest("form")!;
  fireEvent.submit(formulario); fireEvent.submit(formulario);
  expect(registrarPago).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
  resolver({ ok: false, status: 503, error: "Sin conexión" });
  await screen.findByText("Sin conexión");
});
it("recupera el pago con la misma clave aunque actualizar cuotas haya reservado su monto", async () => {
  vi.mocked(registrarPago).mockResolvedValueOnce({ ok: false, status: 503, error: "Respuesta perdida" }).mockResolvedValueOnce({ ok: true, data: { id: 100, cuotaId: 1, monto: "10.00", fechaPago: "2026-01-01", estado: "PENDIENTE", saldo: "80.00", disponible: "0.00", advertencia: "El pago se registró, pero no se pudo enviar el aviso." } });
  await llenar();
  fireEvent.submit(screen.getByRole("button", { name: "Registrar pago" }).closest("form")!);
  await screen.findByText("Respuesta perdida");
  vi.mocked(consultarCuotasPago).mockResolvedValue({ ok: true, data: { cuotas: [{ ...cuota, disponible: "0.00" }] } });
  fireEvent.click(screen.getByRole("button", { name: "Actualizar cuotas" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Registrar pago" })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
  await screen.findByText("Número de registro: 100");
  expect(screen.getByText("El pago se registró, pero no se pudo enviar el aviso.")).toBeInTheDocument();
  expect(vi.mocked(registrarPago).mock.calls[0][2]).toBe(vi.mocked(registrarPago).mock.calls[1][2]);
});
