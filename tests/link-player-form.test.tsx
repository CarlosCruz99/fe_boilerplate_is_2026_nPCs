import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinkPlayerForm } from "@/app/vincular-ficha/link-player-form";
import { vincularFicha } from "@/app/actions/link-player";
import { useAuth } from "@/contexts/auth-context";

vi.mock("@/app/actions/link-player", () => ({
  vincularFicha: vi.fn(),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

const actualizarSesion = vi.fn(async () => {});

async function completarFormulario() {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("Identificación"),
    "SEED-0002",
  );

  fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), {
    target: { value: "1994-03-11" },
  });

  return user;
}

describe("LinkPlayerForm", () => {
  beforeEach(() => {
    vi.mocked(vincularFicha).mockReset();
    actualizarSesion.mockClear();

    vi.mocked(useAuth).mockReturnValue({
      estado: "autenticado",
      usuario: {
        id: "usuario-prueba",
        nombre: "Ana López",
        email: "ana@liga.test",
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
  });

  it("envía los datos y solicita actualizar la sesión tras el éxito", async () => {
    vi.mocked(vincularFicha).mockResolvedValue({
      exito: "Tu ficha quedó vinculada.",
    });

    render(<LinkPlayerForm />);

    const user = await completarFormulario();

    await user.click(
      screen.getByRole("button", { name: "Vincular ficha" }),
    );

    expect(
      await screen.findByText("Tu ficha quedó vinculada."),
    ).toBeInTheDocument();

    expect(vincularFicha).toHaveBeenCalledTimes(1);

    const formData = vi.mocked(vincularFicha).mock.calls[0][1];

    expect(formData.get("identificacion")).toBe("SEED-0002");
    expect(formData.get("fechaNacimiento")).toBe("1994-03-11");

    expect(actualizarSesion).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("button", { name: "Vincular ficha" }),
    ).toBeDisabled();
  });

  it.each([
    "No encontramos una ficha con esos datos.",
    "Esa ficha ya está vinculada.",
  ])("muestra '%s' sin actualizar la sesión", async (mensaje) => {
    vi.mocked(vincularFicha).mockResolvedValue({
      error: mensaje,
    });

    render(<LinkPlayerForm />);

    const user = await completarFormulario();

    await user.click(
      screen.getByRole("button", { name: "Vincular ficha" }),
    );

    expect(await screen.findByText(mensaje)).toBeInTheDocument();

    expect(actualizarSesion).not.toHaveBeenCalled();

    expect(
      screen.getByRole("button", { name: "Vincular ficha" }),
    ).toBeEnabled();
  });
});