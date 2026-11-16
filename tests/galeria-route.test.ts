// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/partidos/[id]/galeria/route";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const fetchMock = vi.fn();
const params = { params: Promise.resolve({ id: "5" }) };
function solicitud(archivo = new File(["png"], "foto.png", { type: "image/png" }), descripcion = "Gol") {
  const form = new FormData(); form.set("archivos[]", archivo); form.set("descripcion", descripcion);
  return new Request("http://app.test/api/partidos/5/galeria", { method: "POST", body: form, headers: { Origin: "http://app.test" } });
}
beforeEach(() => {
  vi.resetAllMocks(); vi.stubGlobal("fetch", fetchMock); vi.stubEnv("API_URL", "http://api.test/api/v1");
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { id: "org", nombre: "Org", email: "org@test.sv", rol: "ORGANIZADOR", equipoActualId: null, capitaneaEquipoId: null } });
  vi.mocked(getSession).mockResolvedValue("token-privado");
});
it("reenvía multipart autorizado y actualiza la galería solo tras publicación confirmada", async () => {
  fetchMock.mockResolvedValue(Response.json({ partidoId: 5, totalActivos: 1, limite: 30, resultados: [{ nombre: "foto.png", estado: "PUBLICADO", contenidoId: "uuid" }] }));
  const respuesta = await POST(solicitud(), params);
  expect(respuesta.status).toBe(200);
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.test/api/v1/partidos/5/galeria");
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token-privado");
  expect(fetchMock.mock.calls[0][1].body.get("archivos[]").name).toBe("foto.png");
  expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
  expect(revalidatePath).toHaveBeenCalledWith("/partidos/5/galeria");
  expect(await respuesta.text()).not.toContain("token-privado");
});
it("no pide datos sin sesión o sin permiso", async () => {
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "sin-sesion" });
  expect((await POST(solicitud(), params)).status).toBe(401);
  vi.mocked(obtenerSesion).mockResolvedValue({ estado: "autenticado", usuario: { id: "u", nombre: "U", email: "u@test.sv", rol: "JUGADOR", equipoActualId: null, capitaneaEquipoId: null } });
  expect((await POST(solicitud(), params)).status).toBe(403);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("valida formato, descripción y tamaño antes del servicio", async () => {
  expect((await POST(solicitud(new File(["x"], "f.exe", { type: "application/octet-stream" })), params)).status).toBe(400);
  expect((await POST(solicitud(undefined, "a".repeat(201)), params)).status).toBe(400);
  expect((await POST(new Request("http://app.test", { method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=x", "Content-Length": String(52 * 1024 * 1024) } }), params)).status).toBe(413);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("no confirma fallos de red ni errores de permiso y rechaza otro origen", async () => {
  fetchMock.mockResolvedValue(Response.json({ message: "Sin permiso" }, { status: 403 }));
  expect((await POST(solicitud(), params)).status).toBe(403);
  fetchMock.mockRejectedValue(new Error("red"));
  expect((await POST(solicitud(), params)).status).toBe(503);
  const req = solicitud(); req.headers.set("origin", "http://otro.test");
  expect((await POST(req, params)).status).toBe(403);
  expect(revalidatePath).not.toHaveBeenCalled();
});
