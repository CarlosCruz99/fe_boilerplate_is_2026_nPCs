// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { equiposApi } from "@/lib/equipos-api";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import { GET } from "@/app/api/fotos/jugadores/[archivo]/route";
import { agregarJugador, validarEquipo } from "@/app/actions/equipos";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
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
  it("envía multipart sin fijar Content-Type", async () => {
    const form = new FormData();
    form.set("nombreCompleto", "Ana López");
    form.set("identificacion", "ABC-001");
    form.set("fechaNacimiento", "2000-01-01");
    form.set("foto", new File(["photo"], "foto.png", { type: "image/png" }));
    fetchMock.mockResolvedValue(Response.json({ id: 1 }, { status: 201 }));
    expect(await agregarJugador(3, form)).toMatchObject({ ok: true });
    expect(fetchMock.mock.calls[0][1].headers.has("Content-Type")).toBe(false);
    expect(fetchMock.mock.calls[0][1].body.get("foto")).toBeInstanceOf(File);
  });
  it("valida el motivo también en servidor", async () => {
    expect(await validarEquipo(1, "RECHAZAR", "   corto  ")).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("traduce la respuesta real de temporada completa", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          codigo: "TEMPORADA_COMPLETA",
          mensaje: "La temporada está completa.",
        },
        { status: 422 },
      ),
    );
    expect(await equiposApi("JUGADOR", "equipos")).toMatchObject({
      ok: false,
      status: 422,
      error: "La temporada está completa.",
    });
  });
  it("muestra los requisitos cuando el backend devuelve fallas sin message", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          codigo: "REQUISITOS_NO_CUMPLIDOS",
          fallas: ["El equipo debe tener al menos 7 jugadores."],
        },
        { status: 422 },
      ),
    );
    expect(await equiposApi("JUGADOR", "equipos")).toMatchObject({
      ok: false,
      status: 422,
      error: "El equipo no cumple los requisitos de inscripción.",
      fallas: ["El equipo debe tener al menos 7 jugadores."],
    });
  });
  it("conserva el mensaje de jugador duplicado", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          message:
            "El jugador ya pertenece al equipo Leones en esta temporada.",
        },
        { status: 409 },
      ),
    );
    expect(await equiposApi("JUGADOR", "equipos/1/jugadores")).toMatchObject({
      ok: false,
      status: 409,
      error: expect.stringContaining("Leones"),
    });
  });
});
describe("Fotografía privada", () => {
  it("rechaza rutas arbitrarias antes de consultar el backend", async () => {
    const res = await GET(new Request("http://localhost/api/fotos"), {
      params: Promise.resolve({ archivo: "../secreto.png" }),
    });
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("exige sesión y no hace pública la respuesta", async () => {
    vi.mocked(getSession).mockResolvedValue(undefined);
    const res = await GET(new Request("http://localhost/api/fotos"), {
      params: Promise.resolve({ archivo: "1.jpg" }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("descarga foto real conservando tipo y caché privada", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    );
    fetchMock.mockResolvedValue(
      new Response(png, { headers: { "Content-Type": "image/png" } }),
    );
    const res = await GET(new Request("http://localhost/api/fotos"), {
      params: Promise.resolve({ archivo: "1.png" }),
    });
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "http://api.test/uploads/jugadores/1.png",
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer private-token",
    );
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(png);
  });
});
