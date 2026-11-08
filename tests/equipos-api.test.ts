// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { equiposApi } from "@/lib/equipos-api";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
const fetchMock = vi.fn();
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("API_URL", "http://api.test/api/v1");
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(obtenerSesion).mockResolvedValue({
    estado: "autenticado",
    usuario: {
      id: "u1",
      nombre: "Ana",
      email: "a@test.sv",
      rol: "JUGADOR",
      equipoActualId: null,
      capitaneaEquipoId: null,
    },
  });
  vi.mocked(getSession).mockResolvedValue("private-token");
});
describe("Acceso al backend", () => {
  it("no consulta datos protegidos si el rol no coincide", async () => {
    const result = await equiposApi("ORGANIZADOR", "equipos");
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("adjunta Bearer del servidor y no lo devuelve al navegador", async () => {
    fetchMock.mockResolvedValue(Response.json([{ id: 1 }]));
    const result = await equiposApi("JUGADOR", "temporadas");
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "http://api.test/api/v1/temporadas",
    );
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer private-token",
    );
    expect(JSON.stringify(result)).not.toContain("private-token");
  });
});
