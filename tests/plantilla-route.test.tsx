import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import Page from "@/app/equipos/[id]/jugadores/page";
import { listarTemporadas } from "@/app/actions/equipos";

vi.mock("@/app/actions/equipos", () => ({ listarTemporadas: vi.fn() }));
vi.mock("@/components/auth/ruta-protegida", () => ({ RutaProtegida: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/app/equipos/[id]/jugadores/plantilla-equipo", () => ({ PlantillaEquipo: ({ id, temporadaId }: { id: number; temporadaId: number }) => <p>Equipo {id} · Temporada {temporadaId}</p> }));
beforeEach(() => vi.resetAllMocks());
it("abre la plantilla desde el menú general usando la temporada actual", async () => {
  vi.mocked(listarTemporadas).mockResolvedValue({ ok: true, data: [{ id: 7, nombre: "Actual", actual: true, inscripcionAbierta: true }] });
  render(await Page({ params: Promise.resolve({ id: "23" }), searchParams: Promise.resolve({}) }));
  expect(screen.getByText("Equipo 23 · Temporada 7")).toBeInTheDocument();
});
it("conserva la temporada de los enlaces desde inscripciones", async () => {
  render(await Page({ params: Promise.resolve({ id: "23" }), searchParams: Promise.resolve({ temporadaId: "4" }) }));
  expect(screen.getByText("Equipo 23 · Temporada 4")).toBeInTheDocument();
  expect(listarTemporadas).not.toHaveBeenCalled();
});
