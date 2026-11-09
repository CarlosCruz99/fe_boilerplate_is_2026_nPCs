// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calendarioApi } from "@/lib/calendario-api";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import {
  agendarPartido,
  cancelarPartido,
  catalogosCalendario,
  generarCalendario,
  reprogramarPartido,
  consultarCalendario,
  publicarJornada,
} from "@/app/actions/calendario-organizador";
import {
  camposInicio,
  fechaSalvador,
  inicioSalvador,
  validarGeneracion,
} from "@/lib/calendario-validation";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
const arbitroId = "00000000-0000-4000-8000-000000000012";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("API_URL", "http://api.test/api/v1");
  vi.mocked(obtenerSesion).mockResolvedValue({
    estado: "autenticado",
    usuario: {
      id: "org",
      nombre: "Org",
      email: "org@test.sv",
      rol: "ORGANIZADOR",
      equipoActualId: null,
      capitaneaEquipoId: null,
    },
  });
  vi.mocked(getSession).mockResolvedValue("private-token");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("H3 servidor", () => {
  it("consulta el calendario por temporada con una sola lectura autorizada", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ temporadaId: 8, jornadas: [] }),
    );
    expect(await consultarCalendario(8)).toMatchObject({ ok: true });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api.test/api/v1/temporadas/8/calendario",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("publica por ID sin cuerpo y conserva el 409 del backend", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { message: "La jornada ya está publicada." },
        { status: 409 },
      ),
    );
    expect(await publicarJornada(91)).toMatchObject({
      ok: false,
      status: 409,
      error: "La jornada ya está publicada.",
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api.test/api/v1/jornadas/91/publicar",
    );
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it("comprueba rol en servidor antes de consultar", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      estado: "autenticado",
      usuario: {
        id: "c",
        nombre: "Cap",
        email: "c@test.sv",
        rol: "JUGADOR",
        equipoActualId: 1,
        capitaneaEquipoId: 1,
      },
    });
    expect(await cancelarPartido(1)).toMatchObject({ ok: false, status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("envía Bearer y mantiene privados los tokens", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    const res = await calendarioApi("arbitros");
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer private-token",
    );
    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
    expect(JSON.stringify(res)).not.toContain("private-token");
  });
  it.each([
    "Esa cancha ya tiene un partido en ese horario.",
    "Ese árbitro ya tiene un partido en ese horario.",
    "Esos equipos ya se enfrentan en la temporada.",
  ])("conserva 409: %s", async (message) => {
    fetchMock.mockResolvedValue(Response.json({ message }, { status: 409 }));
    expect(await calendarioApi("partidos")).toMatchObject({
      ok: false,
      status: 409,
      error: message,
    });
  });
  it.each([
    [
      { inscritos: 10, requeridos: 12, faltan: 2 },
      "Faltan 2 equipos inscritos para generar el calendario.",
    ],
    [
      { arbitros: 1, requeridos: 2 },
      "Se necesitan al menos 2 árbitros para generar el calendario.",
    ],
  ])("traduce 422 estructurado", async (body, error) => {
    fetchMock.mockResolvedValue(Response.json(body, { status: 422 }));
    expect(await calendarioApi("partidos")).toMatchObject({
      ok: false,
      status: 422,
      error,
    });
  });
  it("normaliza red y 500 con el mensaje de la operación", async () => {
    fetchMock.mockRejectedValueOnce(new Error("red"));
    expect(await cancelarPartido(1)).toMatchObject({
      ok: false,
      status: 503,
      error: "No pudimos cancelar el partido. Intenta de nuevo.",
    });
    fetchMock.mockResolvedValue(
      Response.json({ message: "stack privado" }, { status: 500 }),
    );
    expect(await cancelarPartido(1)).toMatchObject({
      ok: false,
      status: 500,
      error: "No pudimos cancelar el partido. Intenta de nuevo.",
    });
  });
  it("cancela sin mezclar cambios", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 1, estado: "CANCELADO" }));
    await cancelarPartido(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      estado: "CANCELADO",
    });
  });
  it("elimina equipos, jornada y fin al reprogramar", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 1 }));
    const datos = {
      canchaId: 1,
      arbitroId,
      inicio: "2035-01-01T08:00:00-06:00",
      fin: "extra",
      equipoLocalId: 9,
      jornada: 8,
    };
    await reprogramarPartido(1, datos);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      canchaId: 1,
      arbitroId,
      inicio: datos.inicio,
    });
  });
  it("no envía fin al agendar y valida equipos distintos en servidor", async () => {
    const datos = {
      temporadaId: 1,
      jornada: 1,
      equipoLocalId: 1,
      equipoVisitanteId: 1,
      canchaId: 1,
      arbitroId,
      inicio: "2035-01-01T08:00:00-06:00",
      fin: "extra",
    };
    expect(await agendarPartido(datos)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValue(Response.json({ id: 1 }));
    await agendarPartido({ ...datos, equipoVisitanteId: 2 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty(
      "fin",
    );
  });
  it("consulta únicamente inscritos y catálogos disponibles, sin endpoints inventados", async () => {
    const urls: string[] = [];
    fetchMock.mockImplementation(async (url) => {
      urls.push(String(url));
      if (String(url).includes("equipos?"))
        return Response.json({ items: [], total: 0, page: 1, pageSize: 50 });
      return Response.json([]);
    });
    expect(await catalogosCalendario(1)).toMatchObject({
      ok: true,
      data: { totalInscritos: 0 },
    });
    expect(urls).toEqual(
      expect.arrayContaining([
        "http://api.test/api/v1/canchas?activa=true",
        "http://api.test/api/v1/arbitros",
        "http://api.test/api/v1/equipos?temporadaId=1&estado=INSCRITO&page=1&pageSize=50",
      ]),
    );
    expect(urls).toHaveLength(3);
  });
  it("rechaza generación inválida antes de enviar", async () => {
    expect(
      await generarCalendario(1, {
        fechaPrimeraJornada: "2035-02-30",
        horaPrimerTurno: "08:00",
        canchaIds: [1],
        arbitroIds: [arbitroId],
      }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
describe("Fechas del calendario", () => {
  it("usa El Salvador aunque el navegador esté en otro huso", () => {
    expect(inicioSalvador("2035-02-10", "08:00")).toBe(
      "2035-02-10T08:00:00-06:00",
    );
    expect(camposInicio("2035-02-10T14:00:00Z")).toEqual({
      fecha: "2035-02-10",
      hora: "08:00",
    });
    expect(fechaSalvador(new Date("2026-11-09T03:00:00Z"))).toBe("2026-11-08");
    expect(inicioSalvador("2035-02-30", "08:00")).toBeNull();
  });
  it("exige árbitros para las canchas simultáneas", () => {
    expect(
      validarGeneracion({
        fechaPrimeraJornada: "2035-01-01",
        horaPrimerTurno: "08:00",
        canchaIds: [1, 2],
        arbitroIds: [arbitroId],
      }),
    ).toBe("Se necesitan al menos 2 árbitros para generar el calendario.");
  });
});
