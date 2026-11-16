import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AsignacionArbitro } from "@/components/calendario/asignacion-arbitro";
import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { useAuth } from "@/contexts/auth-context";
import { asignarArbitro, consultarArbitrosDisponibles } from "@/app/actions/asignacion-arbitro";
vi.mock("@/app/actions/asignacion-arbitro", () => ({ asignarArbitro: vi.fn(), consultarArbitrosDisponibles: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const anterior = { id: "00000000-0000-4000-8000-000000000001", nombre: "Árbitro anterior" };
const nuevo = { id: "00000000-0000-4000-8000-000000000002", nombre: "Árbitro nuevo" };
const guardado = vi.fn(); const bloquear = vi.fn(() => true);
const props = { partidoId: 8, estado: "PROGRAMADO" as const, actual: anterior, ocupado: false, bloquear, guardado };
beforeEach(() => { vi.resetAllMocks(); bloquear.mockReturnValue(true); vi.mocked(consultarArbitrosDisponibles).mockResolvedValue({ ok: true, data: { partidoId: 8, arbitros: [anterior, nuevo] } }); vi.mocked(asignarArbitro).mockResolvedValue({ ok: true, data: { partidoId: 8, arbitroId: nuevo.id, arbitroNombre: nuevo.nombre } }); });
async function abrir() { fireEvent.click(screen.getByRole("button", { name: /Cambiar árbitro|Asignar árbitro/ })); return screen.findByLabelText("Árbitro disponible"); }
it("consulta candidatos solo al editar y sustituye tras confirmación", async () => {
 render(<AsignacionArbitro {...props} />);
 expect(consultarArbitrosDisponibles).not.toHaveBeenCalled();
 const selector = await abrir(); expect(selector).toHaveValue(anterior.id);
 fireEvent.change(selector, { target: { value: nuevo.id } });
 expect(screen.getByText(anterior.nombre)).toBeInTheDocument(); expect(guardado).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button", { name: "Guardar árbitro" }));
 await waitFor(() => expect(guardado).toHaveBeenCalledWith({ partidoId: 8, arbitroId: nuevo.id, arbitroNombre: nuevo.nombre }));
 expect(asignarArbitro).toHaveBeenCalledWith(8, nuevo.id);
 expect(bloquear).toHaveBeenLastCalledWith(false);
});
it("permite asignar cuando no hay árbitro", async () => {
 render(<AsignacionArbitro {...props} actual={null} />); expect(screen.getByText("Sin asignar")).toBeInTheDocument();
 const selector = await abrir(); expect(screen.getByRole("button", { name: "Guardar árbitro" })).toBeDisabled();
 fireEvent.change(selector, { target: { value: nuevo.id } }); fireEvent.click(screen.getByRole("button", { name: "Guardar árbitro" }));
 await waitFor(() => expect(guardado).toHaveBeenCalled());
});
it("en 409 conserva el árbitro y consulta nuevamente candidatos sin permitir el candidato eliminado", async () => {
 vi.mocked(asignarArbitro).mockResolvedValue({ ok: false, status: 409, error: "Ese árbitro ya tiene un partido en ese horario." });
 render(<AsignacionArbitro {...props} />); fireEvent.change(await abrir(), { target: { value: nuevo.id } });
 vi.mocked(consultarArbitrosDisponibles).mockResolvedValue({ ok: true, data: { partidoId: 8, arbitros: [anterior] } });
 fireEvent.click(screen.getByRole("button", { name: "Guardar árbitro" }));
 await screen.findByText("Ese árbitro ya tiene un partido en ese horario.");
 await waitFor(() => expect(consultarArbitrosDisponibles).toHaveBeenCalledTimes(2));
 expect(screen.getByText(anterior.nombre)).toBeInTheDocument(); expect(guardado).not.toHaveBeenCalled();
 expect(screen.getByRole("button", { name: "Guardar árbitro" })).toBeDisabled();
});
it("muestra lista vacía y errores de consulta con reintento", async () => {
 vi.mocked(consultarArbitrosDisponibles).mockResolvedValueOnce({ ok: false, status: 503, error: "Sin conexión" }).mockResolvedValueOnce({ ok: true, data: { partidoId: 8, arbitros: [] } });
 render(<AsignacionArbitro {...props} />); fireEvent.click(screen.getByRole("button", { name: "Cambiar árbitro" }));
 await screen.findByText("Sin conexión"); fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
 await screen.findByText("No hay árbitros disponibles para este horario."); expect(screen.getByRole("button", { name: "Guardar árbitro" })).toBeDisabled();
});
it("no consulta ni permite editar partidos fuera de Programado", () => {
 for (const estado of ["FINALIZADO", "EN_CURSO", "CANCELADO"] as const) {
   const vista = render(<AsignacionArbitro {...props} estado={estado} />);
   expect(screen.queryByRole("button", { name: "Cambiar árbitro" })).toBeNull(); vista.unmount();
 }
 expect(consultarArbitrosDisponibles).not.toHaveBeenCalled();
});
it("bloquea doble envío y no confirma fallos de red", async () => {
 let resolver!: (valor: Awaited<ReturnType<typeof asignarArbitro>>) => void;
 vi.mocked(asignarArbitro).mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
 render(<AsignacionArbitro {...props} />); await abrir();
 const boton=screen.getByRole("button", { name: "Guardar árbitro" }); fireEvent.click(boton); fireEvent.click(boton);
 expect(asignarArbitro).toHaveBeenCalledTimes(1); expect(screen.getByRole("button", { name: "Guardando asignación..." })).toBeDisabled();
 resolver({ ok: false, status: 503, error: "No se pudo confirmar" }); await screen.findByText("No se pudo confirmar"); expect(guardado).not.toHaveBeenCalled();
});
it("cancelar no modifica la asignación", async () => {
 render(<AsignacionArbitro {...props} />); fireEvent.change(await abrir(), { target: { value: nuevo.id } });
 fireEvent.click(screen.getByRole("button", { name: "Cancelar cambio" })); expect(asignarArbitro).not.toHaveBeenCalled(); expect(screen.getByText(anterior.nombre)).toBeInTheDocument();
});
it("el acceso restringido no monta el formulario ni pide candidatos", () => {
 vi.mocked(useAuth).mockReturnValue({ estado: "autenticado", usuario: { id:"u",nombre:"Jugador",email:"u@test.sv",rol:"JUGADOR",equipoActualId:null,capitaneaEquipoId:null },rol:"JUGADOR",equipoActualId:null,capitaneaEquipoId:null,mensaje:null,actualizarSesion:vi.fn() });
 render(<RutaProtegida rolesPermitidos={["ORGANIZADOR"]}><AsignacionArbitro {...props} /></RutaProtegida>);
 expect(screen.getByText("No tienes permiso para ver esta página.")).toBeInTheDocument(); expect(consultarArbitrosDisponibles).not.toHaveBeenCalled();
});
