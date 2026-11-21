import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InscripcionEquipo } from "@/app/equipos/nuevo/registro-equipo";
import { PlantillaEquipo } from "@/app/equipos/[id]/jugadores/plantilla-equipo";
import RegistroPage from "@/app/equipos/nuevo/page";
import OrganizadorPage from "@/app/organizador/equipos/page";
import { EquiposPendientes } from "@/app/organizador/equipos/equipos-pendientes";
import * as api from "@/app/actions/equipos";
import { useAuth } from "@/contexts/auth-context";
import type {
  Equipo,
  EquipoDetalle,
  EquipoResumen,
  Jugador,
  Temporada,
} from "@/types/equipos";

vi.mock("@/app/actions/equipos", () => ({
  listarTemporadas: vi.fn(),
  consultarMiEquipo: vi.fn(),
  crearEquipo: vi.fn(),
  consultarPlantilla: vi.fn(),
  agregarJugador: vi.fn(),
  quitarJugador: vi.fn(),
  listarPendientes: vi.fn(),
  consultarDetalle: vi.fn(),
  validarEquipo: vi.fn(),
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
const { push, actualizarSesion } = vi.hoisted(() => ({
  push: vi.fn(),
  actualizarSesion: vi.fn(async () => {}),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
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
const detalle: EquipoDetalle = {
  ...equipo,
  nombreCapitan: "Capitán",
  creadoEn: "2026-11-01T12:00:00Z",
  totalJugadores: 1,
  motivoRechazo: null,
  jugadores: [
    {
      id: jugador.id,
      nombreCompleto: jugador.nombreCompleto,
      fotoUrl: jugador.fotoUrl,
      edad: 15,
    },
  ],
};

const resumen: EquipoResumen = {
  id: equipo.id,
  nombre: equipo.nombre,
  estado: equipo.estado,
  nombreCapitan: "Capitán",
  totalJugadores: 1,
  creadoEn: "2026-11-01T12:00:00Z",
};

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
  vi.mocked(api.listarPendientes).mockResolvedValue({
    ok: true,
    data: { items: [resumen], total: 1, page: 1, pageSize: 20 },
  });
  vi.mocked(api.consultarDetalle).mockResolvedValue({
    ok: true,
    data: detalle,
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
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

async function abrirDetalle() {
  render(<EquiposPendientes />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Revisar Tigres" }),
  );
  await screen.findByRole("button", { name: "Aprobar" });
}
describe("Organizador", () => {
  it("renderiza el resumen real sin campos de detalle ni capitán anidado", async () => {
    render(<EquiposPendientes />);
    expect(await screen.findByText("Capitán: Capitán")).toBeInTheDocument();
    expect(screen.getByText("Solicitud: 1/11/2026")).toBeInTheDocument();
  });

  it("muestra advertencias de plantilla y edad del servidor", async () => {
    await abrirDetalle();
    expect(screen.getByText(/Plantilla incompleta/)).toBeInTheDocument();
    expect(screen.getByText("Menor de 16 años")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Foto de Ana López" }),
    ).toHaveAttribute("src", "/api/fotos/jugadores/10.jpg");
  });
  it("bloquea rechazo corto, conserva motivo con error y envía motivo válido", async () => {
    vi.mocked(api.validarEquipo).mockResolvedValue({
      ok: false,
      status: 503,
      error: "Intenta otra vez",
    });
    await abrirDetalle();
    await userEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    const dialog = screen.getByRole("dialog");
    const textarea = within(dialog).getByLabelText("Motivo del rechazo");
    await userEvent.type(textarea, "corto");
    expect(
      within(dialog).getByRole("button", { name: "Confirmar rechazo" }),
    ).toBeDisabled();
    expect(api.validarEquipo).not.toHaveBeenCalled();
    await userEvent.clear(textarea);
    await userEvent.type(
      textarea,
      "Faltan jugadores para completar la plantilla.",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar rechazo" }),
    );
    expect(await screen.findByText("Intenta otra vez")).toBeInTheDocument();
    expect(textarea).toHaveValue(
      "Faltan jugadores para completar la plantilla.",
    );
    expect(api.validarEquipo).toHaveBeenCalledWith(
      3,
      "RECHAZAR",
      "Faltan jugadores para completar la plantilla.",
    );
  });
  it("aprueba con confirmación y retira el equipo de pendientes", async () => {
    vi.mocked(api.validarEquipo).mockImplementation(async () => {
      vi.mocked(api.listarPendientes).mockResolvedValue({
        ok: true,
        data: { items: [], total: 0, page: 1, pageSize: 20 },
      });
      return {
        ok: true,
        data: {
          id: equipo.id,
          estado: "INSCRITO",
          validadoPor: "org",
          fechaValidacion: "2026-11-08T15:00:00Z",
          motivoRechazo: null,
        },
      };
    });
    await abrirDetalle();
    await userEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(api.validarEquipo).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar aprobación" }),
    );
    expect(
      await screen.findByText("No hay equipos pendientes en esta temporada."),
    ).toBeInTheDocument();
  });
  it("muestra fallas específicas 422", async () => {
    vi.mocked(api.validarEquipo).mockResolvedValue({
      ok: false,
      status: 422,
      error: "Requisitos no cumplidos",
      fallas: ["Hay un jugador menor de 16 años", "Faltan jugadores"],
    });
    await abrirDetalle();
    await userEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar aprobación" }),
    );
    expect(
      await screen.findByText("Hay un jugador menor de 16 años"),
    ).toBeInTheDocument();
    expect(screen.getByText("Faltan jugadores")).toBeInTheDocument();
  });
  it("vuelve a consultar después de un 409", async () => {
    vi.mocked(api.validarEquipo).mockResolvedValue({
      ok: false,
      status: 409,
      error: "El equipo ya fue validado.",
    });
    await abrirDetalle();
    await userEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar aprobación" }),
    );
    expect(
      await screen.findByText("El equipo ya fue validado."),
    ).toBeInTheDocument();
    await waitFor(() => expect(api.listarPendientes).toHaveBeenCalledTimes(2));
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
  it("un capitán no pide datos del organizador", () => {
    render(<OrganizadorPage />);
    expect(
      screen.getByText("No tienes permiso para ver esta página."),
    ).toBeInTheDocument();
    expect(api.listarTemporadas).not.toHaveBeenCalled();
    expect(api.listarPendientes).not.toHaveBeenCalled();
  });
});

describe("Filtros y paginación", () => {
  it("reinicia en página 1 al cambiar de temporada", async () => {
    vi.mocked(api.listarTemporadas).mockResolvedValue({
      ok: true,
      data: [temporada, { ...temporada, id: 4, nombre: "Clausura" }],
    });
    vi.mocked(api.listarPendientes).mockImplementation(async (_id, page) => ({
      ok: true,
      data: { items: [detalle], total: 21, page, pageSize: 20 },
    }));
    render(<EquiposPendientes />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Siguiente" }),
    );
    await screen.findByText("Página 2 de 2");
    await userEvent.selectOptions(screen.getByLabelText("Temporada"), "4");
    await waitFor(() =>
      expect(api.listarPendientes).toHaveBeenLastCalledWith(4, 1),
    );
  });
  it("regresa a la página anterior si una decisión vacía la última", async () => {
    vi.mocked(api.listarPendientes).mockImplementation(async (_id, page) => ({
      ok: true,
      data: { items: [detalle], total: 21, page, pageSize: 20 },
    }));
    vi.mocked(api.validarEquipo).mockImplementation(async () => {
      vi.mocked(api.listarPendientes).mockImplementation(async (_id, page) => ({
        ok: true,
        data: {
          items: page === 1 ? [detalle] : [],
          total: 20,
          page,
          pageSize: 20,
        },
      }));
      return {
        ok: true,
        data: {
          id: equipo.id,
          estado: "INSCRITO",
          validadoPor: "org",
          fechaValidacion: "2026-11-08T15:00:00Z",
          motivoRechazo: null,
        },
      };
    });
    render(<EquiposPendientes />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Siguiente" }),
    );
    await screen.findByText("Página 2 de 2");
    await userEvent.click(
      screen.getByRole("button", { name: "Revisar Tigres" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Aprobar" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar aprobación" }),
    );
    await screen.findByText("Página 1 de 1");
    expect(api.listarPendientes).toHaveBeenLastCalledWith(2, 1);
  });
});
