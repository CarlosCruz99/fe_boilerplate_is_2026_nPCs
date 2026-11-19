import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import HistorialPagosPage from "@/app/equipo/pagos/page";
import { HistorialPagosEquipo } from "@/components/pagos/historial-pagos-equipo";
import { consultarHistorialPagos, temporadasHistorialPagos } from "@/app/actions/historial-pagos";
import { useAuth } from "@/contexts/auth-context";
import type { HistorialPagos } from "@/types/historial-pagos";
import type { Resultado } from "@/types/equipos";
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/app/actions/historial-pagos", () => ({ consultarHistorialPagos: vi.fn(), temporadasHistorialPagos: vi.fn() }));
const data: HistorialPagos = { equipoId: 2, temporadaId: 1, concepto: null, totales: { totalRegistrado: "60.00", totalVerificado: "30.00", pendienteVerificacion: "20.00", totalRechazado: "10.00" }, pagos: [
  { id: 1, concepto: "INSCRIPCION", monto: "30.00", fechaPago: "2026-11-18", estado: "VERIFICADO", tieneComprobante: true, motivoRechazo: null },
  { id: 2, concepto: "ARBITRAJE", monto: "20.00", fechaPago: "2026-11-17", estado: "PENDIENTE", tieneComprobante: false, motivoRechazo: null },
  { id: 3, concepto: "ARBITRAJE", monto: "10.00", fechaPago: "2026-11-16", estado: "RECHAZADO", tieneComprobante: true, motivoRechazo: "Comprobante ilegible" },
] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useAuth).mockReturnValue({ estado: "autenticado", usuario: { id: "cap", rol: "JUGADOR" }, capitaneaEquipoId: 7 } as ReturnType<typeof useAuth>);
  vi.mocked(temporadasHistorialPagos).mockResolvedValue({ ok: true, data: [{ id: 1, nombre: "Anterior", actual: false, inscripcionAbierta: false }, { id: 2, nombre: "Actual", actual: true, inscripcionAbierta: false }] });
  vi.mocked(consultarHistorialPagos).mockResolvedValue({ ok: true, data });
});
afterEach(() => vi.unstubAllGlobals());
async function seleccionar(id = "1") { fireEvent.change(await screen.findByLabelText("Temporada"), { target: { value: id } }); }
it("inicial sin ceros ni consulta hasta elegir temporada", async () => {
  render(<HistorialPagosEquipo />);
  await screen.findByText("Selecciona una temporada para consultar los pagos de tu equipo.");
  expect(consultarHistorialPagos).not.toHaveBeenCalled();
  expect(screen.queryByRole("region", { name: "Totales del historial" })).not.toBeInTheDocument();
});
it("muestra estados con texto, motivo y cuatro totales oficiales sin confundir verificado", async () => {
  render(<HistorialPagosEquipo />); await seleccionar(); await screen.findByRole("table");
  const totales = screen.getByRole("region", { name: "Totales del historial" });
  expect(totales).toHaveTextContent("Total registrado$60.00Total verificado$30.00Pendiente de verificación$20.00Total rechazado$10.00");
  expect(screen.getByRole("table")).toHaveTextContent("Pendiente de verificación");
  expect(screen.getByRole("table")).toHaveTextContent("Verificado");
  expect(screen.getByText("Comprobante ilegible")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /Ver comprobante/ })).toHaveLength(2);
});
it("combina filtros y descarta respuesta tardía", async () => {
  let resolver!: (r: Resultado<HistorialPagos>) => void;
  vi.mocked(consultarHistorialPagos).mockReturnValueOnce(new Promise(r => { resolver = r; })).mockResolvedValueOnce({ ok: false, status: 500, error: "Error" });
  render(<HistorialPagosEquipo />); await seleccionar();
  fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "ARBITRAJE" } });
  await screen.findByRole("alert");
  await act(async () => resolver({ ok: true, data }));
  expect(consultarHistorialPagos).toHaveBeenLastCalledWith(1, "ARBITRAJE");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Totales del historial" })).not.toBeInTheDocument();
});
it("vacío muestra cuatro ceros de respuesta válida", async () => {
  vi.mocked(consultarHistorialPagos).mockResolvedValue({ ok: true, data: { ...data, pagos: [], totales: { totalRegistrado: "0.00", totalVerificado: "0.00", pendienteVerificacion: "0.00", totalRechazado: "0.00" } } });
  render(<HistorialPagosEquipo />); await seleccionar();
  await screen.findByText("No hay pagos que coincidan con los filtros.");
  expect(within(screen.getByRole("region", { name: "Totales del historial" })).getAllByText("$0.00")).toHaveLength(4);
});
it("error permite reintentar sin totales ficticios", async () => {
  vi.mocked(consultarHistorialPagos).mockResolvedValueOnce({ ok: false, status: 503, error: "Red" });
  render(<HistorialPagosEquipo />); await seleccionar(); await screen.findByRole("alert");
  expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Reintentar")); await screen.findByRole("table");
});
it("403 bloquea pantalla y no deja solicitar más datos", async () => {
  vi.mocked(consultarHistorialPagos).mockResolvedValue({ ok: false, status: 403, error: "Sin permiso" });
  render(<HistorialPagosEquipo />); await seleccionar();
  await screen.findByText("No tienes permiso para ver esta página.");
  await waitFor(() => expect(screen.queryByLabelText("Temporada")).not.toBeInTheDocument());
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("401 redirige a login", async () => {
  vi.mocked(consultarHistorialPagos).mockResolvedValue({ ok: false, status: 401, error: "Sesión" });
  render(<HistorialPagosEquipo />); await seleccionar(); await screen.findByRole("alert");
  expect(replace).toHaveBeenCalledWith("/login");
});
it.each([400, 422])("%i indica corregir filtros y permite cambiar selección", async status => {
  vi.mocked(consultarHistorialPagos).mockResolvedValue({ ok: false, status, error: "Filtros" });
  render(<HistorialPagosEquipo />); await seleccionar();
  await screen.findByText("Revisa la temporada y el concepto seleccionados.");
  expect(screen.getByLabelText("Temporada")).toBeEnabled();
});
it("no capitán no monta ni consulta datos", () => {
  vi.mocked(useAuth).mockReturnValue({ estado: "autenticado", usuario: { id: "jugador", rol: "JUGADOR" }, capitaneaEquipoId: null } as ReturnType<typeof useAuth>);
  render(<HistorialPagosPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("No tienes permiso para ver esta página.");
  expect(temporadasHistorialPagos).not.toHaveBeenCalled();
});
it("descarga usa ruta privada y maneja 404 sin abrir URL pública", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 })); vi.stubGlobal("fetch", fetchMock);
  render(<HistorialPagosEquipo />); await seleccionar(); await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "Ver comprobante del pago 1" }));
  await screen.findByRole("alert");
  expect(fetchMock).toHaveBeenCalledWith("/api/pagos/1/comprobante", expect.objectContaining({ cache: "no-store" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
});
