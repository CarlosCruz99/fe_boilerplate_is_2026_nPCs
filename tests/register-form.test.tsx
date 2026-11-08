import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/app/registro/register-form";
import {
  registrar,
  type RegistroState,
} from "@/app/actions/register";

vi.mock("@/app/actions/register", () => ({
  registrar: vi.fn(),
}));

async function completarFormulario() {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("Nombre completo"),
    "Ana López",
  );

  await user.type(
    screen.getByLabelText("Correo electrónico"),
    "ana@liga.test",
  );

  fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), {
    target: { value: "2000-05-12" },
  });

  await user.type(
    screen.getByLabelText("Contraseña", { exact: true }),
    "Prueba123!",
  );

  await user.type(
    screen.getByLabelText("Confirmar contraseña"),
    "Prueba123!",
  );

  return user;
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.mocked(registrar).mockReset();
  });

  it("envía los datos escritos y muestra el error de correo duplicado", async () => {
    vi.mocked(registrar).mockResolvedValue({
      error: "Este correo ya está registrado.",
    });

    render(<RegisterForm />);

    const user = await completarFormulario();

    await user.click(
      screen.getByRole("button", { name: "Crear cuenta" }),
    );

    expect(
      await screen.findByText("Este correo ya está registrado."),
    ).toBeInTheDocument();

    expect(registrar).toHaveBeenCalledTimes(1);

    const formData = vi.mocked(registrar).mock.calls[0][1];

    expect(formData.get("nombre")).toBe("Ana López");
    expect(formData.get("email")).toBe("ana@liga.test");
    expect(formData.get("fechaNacimiento")).toBe("2000-05-12");
    expect(formData.get("password")).toBe("Prueba123!");
    expect(formData.get("confirmarPassword")).toBe("Prueba123!");
  });

  it("muestra el mensaje de datos inválidos devuelto por la acción", async () => {
    vi.mocked(registrar).mockResolvedValue({
      error: "Revisa los datos ingresados.",
    });

    render(<RegisterForm />);

    const user = await completarFormulario();

    await user.click(
      screen.getByRole("button", { name: "Crear cuenta" }),
    );

    expect(
      await screen.findByText("Revisa los datos ingresados."),
    ).toBeInTheDocument();
  });

  it("bloquea nuevos envíos mientras espera la respuesta", async () => {
    let responder!: (estado: RegistroState) => void;

    const respuesta = new Promise<RegistroState>((resolve) => {
      responder = resolve;
    });

    vi.mocked(registrar).mockReturnValue(respuesta);

    render(<RegisterForm />);

    const user = await completarFormulario();

    await user.click(
      screen.getByRole("button", { name: "Crear cuenta" }),
    );

    const boton = screen.getByRole("button", {
      name: "Creando cuenta...",
    });

    expect(boton).toBeDisabled();
    expect(screen.getByLabelText("Nombre completo")).toBeDisabled();

    await user.click(boton);

    expect(registrar).toHaveBeenCalledTimes(1);

    await act(async () => {
      responder({ error: "Revisa los datos ingresados." });
    });

    expect(
      screen.getByRole("button", { name: "Crear cuenta" }),
    ).toBeEnabled();
  });
});