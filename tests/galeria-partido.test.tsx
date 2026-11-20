import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { consultarGaleria } from "@/app/actions/galeria";
import { GaleriaPartido } from "@/app/partidos/[id]/galeria/galeria-partido";

vi.mock("@/app/actions/galeria", () => ({ consultarGaleria: vi.fn() }));
const auth = vi.hoisted(() => ({ usuario: { rol: "JUGADOR" } }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));

beforeEach(() => {
  auth.usuario.rol = "JUGADOR";
  vi.mocked(consultarGaleria).mockReset();
});

it("muestra fotos y videos privados con controles y navegación", async () => {
  vi.mocked(consultarGaleria).mockResolvedValue({
    ok: true,
    data: {
      page: 2, pageSize: 6, totalElementos: 16, totalPaginas: 3,
      items: [
        { id: "foto", tipo: "FOTO", descripcion: "Atajada", creadoEn: "" },
        { id: "video", tipo: "VIDEO", descripcion: "Gol", creadoEn: "" },
      ],
    },
  });
  render(<GaleriaPartido id="5" pagina="2" />);
  const foto = await screen.findByRole("img", { name: "Atajada" });
  expect(new URL((foto as HTMLImageElement).src).pathname).toBe("/api/partidos/5/galeria/foto/archivo");
  expect(screen.getByLabelText("Gol")).toHaveAttribute("controls");
  expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/partidos/5/galeria?page=1");
  expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute("href", "/partidos/5/galeria?page=3");
  expect(screen.queryByRole("link", { name: "Subir contenido" })).toBeNull();
  fireEvent.error(foto);
  expect(screen.getByText("Este archivo no está disponible.")).toBeInTheDocument();
});

it("permite reintentar una consulta y publicar desde una galería vacía como organizador", async () => {
  auth.usuario.rol = "ORGANIZADOR";
  vi.mocked(consultarGaleria)
    .mockResolvedValueOnce({ ok: false, status: 503, error: "Error de servicio" })
    .mockResolvedValueOnce({ ok: true, data: { items: [], page: 1, pageSize: 6, totalElementos: 0, totalPaginas: 0 } });
  render(<GaleriaPartido id="5" pagina="1" />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("Este partido todavía no tiene fotos ni videos.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Subir contenido" })).toHaveAttribute("href", "/partidos/5/galeria/subir");
});
