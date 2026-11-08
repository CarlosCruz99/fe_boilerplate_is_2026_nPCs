import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { useAuth } from "@/contexts/auth-context";
import type { UsuarioSesion } from "@/types/auth";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

const solicitarDatos = vi.fn();

const usuario: UsuarioSesion = {
  id: "usuario-prueba",
  nombre: "Ana López",
  email: "ana@liga.test",
  rol: "JUGADOR",
  equipoActualId: null,
  capitaneaEquipoId: null,
};

type EstadoAuth = ReturnType<typeof useAuth>;

function configurarSesion(cambios: Partial<EstadoAuth> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    estado: "autenticado",
    usuario,
    rol: usuario.rol,
    equipoActualId: null,
    capitaneaEquipoId: null,
    mensaje: null,
    actualizarSesion: vi.fn(async () => {}),
    ...cambios,
  });
}

// Simula una pantalla que solicita datos cuando se monta.
function ContenidoPrivado() {
  useEffect(() => {
    solicitarDatos();
  }, []);

  return <h1>Contenido privado</h1>;
}

describe("RutaProtegida", () => {
  beforeEach(() => {
    configurarSesion();
  });

  it("permite entrar a un usuario con el rol autorizado", () => {
    render(
      <RutaProtegida rolesPermitidos={["JUGADOR"]}>
        <ContenidoPrivado />
      </RutaProtegida>,
    );

    expect(
      screen.getByRole("heading", { name: "Contenido privado" }),
    ).toBeInTheDocument();

    expect(solicitarDatos).toHaveBeenCalledTimes(1);
  });

  it("bloquea otro rol y no inicia solicitudes del contenido", () => {
    render(
      <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
        <ContenidoPrivado />
      </RutaProtegida>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No tienes permiso para ver esta página.",
    );

    expect(
      screen.queryByRole("heading", { name: "Contenido privado" }),
    ).not.toBeInTheDocument();

    expect(solicitarDatos).not.toHaveBeenCalled();
  });

  it("espera a comprobar la sesión antes de montar el contenido", () => {
    configurarSesion({
      estado: "cargando",
      usuario: null,
      rol: null,
    });

    render(
      <RutaProtegida>
        <ContenidoPrivado />
      </RutaProtegida>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Comprobando sesión...",
    );

    expect(solicitarDatos).not.toHaveBeenCalled();
  });

  it("redirige al login cuando no hay sesión", async () => {
    configurarSesion({
      estado: "sin-sesion",
      usuario: null,
      rol: null,
    });

    render(
      <RutaProtegida>
        <ContenidoPrivado />
      </RutaProtegida>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });

    expect(solicitarDatos).not.toHaveBeenCalled();
  });

  it("bloquea a un jugador sin capitanía cuando esta es obligatoria", () => {
    render(
      <RutaProtegida rolesPermitidos={["JUGADOR"]} exigeCapitania>
        <ContenidoPrivado />
      </RutaProtegida>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No tienes permiso para ver esta página.",
    );

    expect(solicitarDatos).not.toHaveBeenCalled();
  });

  it("permite entrar a un jugador con capitanía", () => {
    configurarSesion({
      usuario: {
        ...usuario,
        equipoActualId: 31,
        capitaneaEquipoId: 31,
      },
      equipoActualId: 31,
      capitaneaEquipoId: 31,
    });

    render(
      <RutaProtegida rolesPermitidos={["JUGADOR"]} exigeCapitania>
        <ContenidoPrivado />
      </RutaProtegida>,
    );

    expect(
      screen.getByRole("heading", { name: "Contenido privado" }),
    ).toBeInTheDocument();

    expect(solicitarDatos).toHaveBeenCalledTimes(1);
  });
});