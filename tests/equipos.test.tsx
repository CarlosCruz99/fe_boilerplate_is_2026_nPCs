import * as api from "@/app/actions/equipos";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InscripcionEquipo } from "@/app/equipos/nuevo/registro-equipo";
import { PlantillaEquipo } from "@/app/equipos/[id]/jugadores/plantilla-equipo";
import RegistroPage from "@/app/equipos/nuevo/page";
import { useAuth } from "@/contexts/auth-context";
import type { Equipo, Jugador, Temporada } from "@/types/equipos";
const { push, actualizarSesion } = vi.hoisted(() => ({
  push: vi.fn(),
  actualizarSesion: vi.fn(async () => {}),
}));
const temporada: Temporada = {
  id: 2,
  nombre: "Apertura",
  actual: true,
  inscripcionAbierta: true,
};
const equipo: Equipo = {
  id: 3,
  nombre: "Tigres",
  temporadaId: 2,
  capitanId: "capitan",
  estado: "PENDIENTE",
  totalJugadores: 0,
};
const jugador: Jugador = {
  id: 10,
  nombreCompleto: "Ana López",
  identificacion: "SEED-0001",
  fechaNacimiento: "2000-05-10",
  fotoUrl: "/uploads/jugadores/10.jpg",
};
vi.mock("@/app/actions/equipos", () => ({
  listarTemporadas: vi.fn(),
  consultarMiEquipo: vi.fn(),
  crearEquipo: vi.fn(),
  consultarPlantilla: vi.fn(),
  agregarJugador: vi.fn(),
  quitarJugador: vi.fn(),
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    estado: "autenticado",
    usuario: {
      id: "capitan",
      nombre: "Capitán",
      email: "c@test.sv",
      rol: "JUGADOR",
      equipoActualId: null,
      capitaneaEquipoId: null,
    },
    rol: "JUGADOR",
    equipoActualId: null,
    capitaneaEquipoId: null,
    mensaje: null,
    actualizarSesion,
  });
  vi.mocked(api.listarTemporadas).mockResolvedValue({
    ok: true,
    data: [temporada],
  });
  vi.mocked(api.consultarMiEquipo).mockResolvedValue({
    ok: false,
    status: 404,
    error: "Sin equipo",
  });
  vi.mocked(api.consultarPlantilla).mockResolvedValue({
    ok: true,
    data: { equipo, jugadores: [jugador] },
  });
});
describe("Inscripción de equipo", () => {
  it("registra, actualiza sesión y navega conservando temporada", async () => {
    vi.mocked(api.crearEquipo).mockResolvedValue({ ok: true, data: equipo });
    render(<InscripcionEquipo />);
    await userEvent.type(
      await screen.findByLabelText("Nombre del equipo"),
      "  Tigres  ",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Registrar equipo" }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/equipos/3/jugadores?temporadaId=2"),
    );
    expect(actualizarSesion).toHaveBeenCalledOnce();
  });
  it.each([400, 403, 409, 422])(
    "muestra errores %s y conserva el nombre",
    async (status) => {
      vi.mocked(api.crearEquipo).mockResolvedValue({
        ok: false,
        status,
        error: "Nombre ya usado",
      });
      render(<InscripcionEquipo />);
      await userEvent.type(
        await screen.findByLabelText("Nombre del equipo"),
        "Tigres",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Registrar equipo" }),
      );
      expect(await screen.findByText("Nombre ya usado")).toBeInTheDocument();
      expect(screen.getByLabelText("Nombre del equipo")).toHaveValue("Tigres");
      expect(push).not.toHaveBeenCalled();
    },
  );
  it("muestra rechazo en temporada cerrada sin formulario", async () => {
    vi.mocked(api.listarTemporadas).mockImplementation(
      async (_rol, abiertas) => ({
        ok: true,
        data: abiertas ? [] : [{ ...temporada, inscripcionAbierta: false }],
      }),
    );
    vi.mocked(api.consultarMiEquipo).mockResolvedValue({
      ok: true,
      data: {
        ...equipo,
        estado: "RECHAZADO",
        motivoRechazo: "Faltan jugadores mayores de edad",
      },
    });
    render(<InscripcionEquipo />);
    expect(
      await screen.findByText(/Faltan jugadores mayores/),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Nombre del equipo"),
    ).not.toBeInTheDocument();
  });
  it("un error de consulta no abre el formulario", async () => {
    vi.mocked(api.consultarMiEquipo).mockResolvedValue({
      ok: false,
      status: 503,
      error: "Servidor no disponible",
    });
    render(<InscripcionEquipo />);
    expect(
      await screen.findByText("Servidor no disponible"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Nombre del equipo"),
    ).not.toBeInTheDocument();
  });
});
describe("Plantilla", () => {
  it("rechaza una foto inválida en el cliente", async () => {
    render(<PlantillaEquipo id={3} temporadaId={2} />);
    const input = await screen.findByLabelText(/Fotografía/);
    fireEvent.change(input, {
      target: {
        files: [new File(["pdf"], "foto.pdf", { type: "application/pdf" })],
      },
    });
    expect(
      await screen.findByText("La foto debe ser JPG o PNG."),
    ).toBeInTheDocument();
    expect(api.agregarJugador).not.toHaveBeenCalled();
  });
  it("bloquea alta con 15 y mantiene disponible quitar", async () => {
    vi.mocked(api.consultarPlantilla).mockResolvedValue({
      ok: true,
      data: {
        equipo,
        jugadores: Array.from({ length: 15 }, (_, i) => ({
          ...jugador,
          id: i + 1,
          nombreCompleto: `Jugador ${i}`,
        })),
      },
    });
    render(<PlantillaEquipo id={3} temporadaId={2} />);
    expect(
      await screen.findByText("El equipo ya tiene 15 jugadores."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar jugador" }),
    ).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: /^Quitar a/ })[0],
    ).toBeEnabled();
  });
  it.each(["INSCRITO", "RECHAZADO"] as const)(
    "bloquea modificaciones de equipo %s",
    async (estado) => {
      vi.mocked(api.consultarPlantilla).mockResolvedValue({
        ok: true,
        data: { equipo: { ...equipo, estado }, jugadores: [jugador] },
      });
      render(<PlantillaEquipo id={3} temporadaId={2} />);
      expect(
        await screen.findByText("El equipo ya no puede modificarse."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Agregar jugador" }),
      ).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: /^Quitar a/ }),
      ).not.toBeInTheDocument();
    },
  );
  it("actualiza la plantilla y el contador después de quitar", async () => {
    vi.mocked(api.quitarJugador).mockImplementation(async () => {
      vi.mocked(api.consultarPlantilla).mockResolvedValue({
        ok: true,
        data: { equipo, jugadores: [] },
      });
      return { ok: true, data: undefined };
    });
    render(<PlantillaEquipo id={3} temporadaId={2} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Quitar a Ana López" }),
    );
    expect(await screen.findByText(/0 \/ 15 jugadores/)).toBeInTheDocument();
    expect(api.quitarJugador).toHaveBeenCalledWith(3, 10);
  });
});
describe("Permisos de las nuevas pantallas", () => {
  it("un organizador no carga el formulario de inscripción", () => {
    vi.mocked(useAuth).mockReturnValue({
      estado: "autenticado",
      usuario: {
        id: "org",
        nombre: "Org",
        email: "org@test.sv",
        rol: "ORGANIZADOR",
        equipoActualId: null,
        capitaneaEquipoId: null,
      },
      rol: "ORGANIZADOR",
      equipoActualId: null,
      capitaneaEquipoId: null,
      mensaje: null,
      actualizarSesion,
    });
    render(<RegistroPage />);
    expect(
      screen.getByText("No tienes permiso para ver esta página."),
    ).toBeInTheDocument();
    expect(api.listarTemporadas).not.toHaveBeenCalled();
  });
});
