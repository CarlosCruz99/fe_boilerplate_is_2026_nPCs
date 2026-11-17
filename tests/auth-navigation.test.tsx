import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import type { ResultadoSesion } from "@/types/auth";

const route = vi.hoisted(() => ({ path: "/" }));
const api = vi.hoisted(() => ({ leer: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));
vi.mock("@/app/actions/session", () => ({ obtenerSesion: api.leer }));
const sesion = (nombre: string): ResultadoSesion => ({ estado: "autenticado", usuario: { id: nombre, nombre, email: "u@liga.test", rol: "JUGADOR", equipoActualId: 1, capitaneaEquipoId: 1 } });
function Contenido() {
  const auth = useAuth();
  return <><p>{auth.usuario?.nombre ?? auth.estado}</p><button onClick={() => void auth.actualizarSesion()}>Actualizar sesión</button></>;
}
const vista = <AuthProvider><Contenido /></AuthProvider>;
beforeEach(() => { route.path = "/"; api.leer.mockReset().mockResolvedValue(sesion("Ana")); });

describe("Sesión durante la navegación", () => {
  it("mantiene la sesión entre menús sin solicitudes ni estados de carga repetidos", async () => {
    const app = render(vista);
    await screen.findByText("Ana");
    route.path = "/mi-calendario"; app.rerender(<AuthProvider><Contenido /></AuthProvider>);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(api.leer).toHaveBeenCalledTimes(1);
    route.path = "/avisos"; app.rerender(<AuthProvider><Contenido /></AuthProvider>);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(api.leer).toHaveBeenCalledTimes(1);
  });
  it("revalida al volver a la ventana y retira una sesión revocada", async () => {
    render(vista); await screen.findByText("Ana");
    api.leer.mockResolvedValue({ estado: "sin-sesion" });
    fireEvent(window, new Event("focus"));
    expect(await screen.findByText("sin-sesion")).toBeInTheDocument();
    expect(api.leer).toHaveBeenCalledTimes(2);
  });
  it("conserva los formularios ante una falla transitoria de revalidación", async () => {
    render(vista); await screen.findByText("Ana");
    api.leer.mockResolvedValue({ estado: "error", mensaje: "Sin conexión" });
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(api.leer).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("error")).not.toBeInTheDocument();
  });
  it("no arrastra la cuenta anterior al cerrar sesión y volver a entrar", async () => {
    const app = render(vista); await screen.findByText("Ana");
    route.path = "/login"; app.rerender(<AuthProvider><Contenido /></AuthProvider>);
    expect(screen.getByText("sin-sesion")).toBeInTheDocument();
    expect(api.leer).toHaveBeenCalledTimes(1);
    let resolver!: (r: ResultadoSesion) => void;
    api.leer.mockImplementation(() => new Promise<ResultadoSesion>(r => { resolver = r; }));
    route.path = "/"; app.rerender(<AuthProvider><Contenido /></AuthProvider>);
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    await act(async () => resolver(sesion("Luis")));
    expect(screen.getByText("Luis")).toBeInTheDocument();
  });
  it("agrupa solicitudes simultáneas y permite actualizar la capitanía tras una inscripción", async () => {
    render(vista); await screen.findByText("Ana");
    let resolver!: (r: ResultadoSesion) => void;
    api.leer.mockImplementation(() => new Promise<ResultadoSesion>(r => { resolver = r; }));
    fireEvent.click(screen.getByRole("button")); fireEvent.click(screen.getByRole("button"));
    expect(api.leer).toHaveBeenCalledTimes(2);
    await act(async () => resolver(sesion("Capitana Ana")));
    await waitFor(() => expect(screen.getByText("Capitana Ana")).toBeInTheDocument());
  });
});
