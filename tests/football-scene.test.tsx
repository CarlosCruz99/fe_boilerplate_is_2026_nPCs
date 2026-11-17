import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FootballScene } from "@/components/football-scene";

const route = vi.hoisted(() => ({ path: "/login" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));

beforeEach(() => {
  localStorage.clear();
  route.path = "/login";
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});

describe("Escenario de fútbol", () => {
  it("conserva la pausa al navegar y al volver a abrir la aplicación", () => {
    const first = render(<FootballScene />);
    fireEvent.click(screen.getByRole("button", { name: /Pausar movimiento/ }));
    expect(screen.getByRole("button", { name: /Activar movimiento/ })).toHaveAttribute("aria-pressed", "true");
    route.path = "/mi-calendario";
    first.rerender(<FootballScene />);
    expect(first.container.querySelector(".football-scene")).toHaveClass("is-paused", "scene-static");
    expect(screen.queryByRole("button", { name: /Ver entrenamiento/ })).not.toBeInTheDocument();
    expect(screen.getByText("Día de partido")).toBeInTheDocument();
    first.unmount();
    route.path = "/login";
    render(<FootballScene />);
    expect(screen.getByRole("button", { name: /Activar movimiento/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("inicia en pausa cuando el sistema solicita movimiento reducido", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    render(<FootballScene />);
    expect(screen.getByRole("button", { name: /Activar movimiento/ })).toHaveAttribute("aria-pressed", "true");
  });
});

 it("descarga el video solo al solicitarlo y lo retira al entrar a herramientas", () => {
    const vista = render(<FootballScene />);
    expect(vista.container.querySelector("video")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ver entrenamiento" }));
    expect(vista.container.querySelector("video")).toHaveAttribute("src", "/media/training-real.mp4");
    expect(vista.container.querySelector("video")).toHaveAttribute("preload", "none");
    route.path = "/organizador/calendario";
    vista.rerender(<FootballScene />);
    expect(vista.container.querySelector("video")).toBeNull();
  });
