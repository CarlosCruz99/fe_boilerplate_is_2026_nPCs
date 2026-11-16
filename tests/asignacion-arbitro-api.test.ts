// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { consultarArbitrosDisponibles, asignarArbitro } from "@/app/actions/asignacion-arbitro";
import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
vi.mock("@/app/actions/session", () => ({ obtenerSesion: vi.fn() })); vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn(); const arbitroId="00000000-0000-4000-8000-000000000002";
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch",fetchMock);vi.stubEnv("API_URL","http://api.test/api/v1");vi.mocked(getSession).mockResolvedValue("privado");vi.mocked(obtenerSesion).mockResolvedValue({estado:"autenticado",usuario:{id:"org",nombre:"Org",email:"org@test.sv",rol:"ORGANIZADOR",equipoActualId:null,capitaneaEquipoId:null}}); });
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("usa candidatos del partido sin caché y token de servidor", async () => {
 fetchMock.mockResolvedValue(Response.json({ partidoId:8,arbitros:[] }));expect(await consultarArbitrosDisponibles(8)).toMatchObject({ok:true});
 expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.test/api/v1/partidos/8/arbitros-disponibles");expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer privado");
});
it("PUT envía solo arbitroId y confirma la identidad devuelta", async () => {
 fetchMock.mockResolvedValue(Response.json({partidoId:8,arbitroId,arbitroNombre:"Nuevo"}));expect(await asignarArbitro(8,arbitroId)).toMatchObject({ok:true});
 expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.test/api/v1/partidos/8/arbitro");expect(fetchMock.mock.calls[0][1]).toMatchObject({method:"PUT",body:JSON.stringify({arbitroId})});
 fetchMock.mockResolvedValue(Response.json({partidoId:9,arbitroId,arbitroNombre:"Otro"}));expect(await asignarArbitro(8,arbitroId)).toMatchObject({ok:false,status:502});
});
it("conserva 409 y causa del servicio", async () => {
 fetchMock.mockResolvedValue(Response.json({message:"Ese árbitro ya tiene un partido en ese horario."},{status:409}));expect(await asignarArbitro(8,arbitroId)).toMatchObject({ok:false,status:409,error:"Ese árbitro ya tiene un partido en ese horario."});
});
it("rechaza IDs inválidos sin consultar", async () => {
 expect(await consultarArbitrosDisponibles(2147483648)).toMatchObject({ok:false,status:400});expect(await asignarArbitro(8,"invalido")).toMatchObject({ok:false,status:400});expect(fetchMock).not.toHaveBeenCalled();
});
it("no consulta ni escribe con rol ajeno o sin sesión", async () => {
 vi.mocked(obtenerSesion).mockResolvedValue({estado:"sin-sesion"});expect(await consultarArbitrosDisponibles(8)).toMatchObject({ok:false,status:401});
 vi.mocked(obtenerSesion).mockResolvedValue({estado:"autenticado",usuario:{id:"j",nombre:"J",email:"j@test.sv",rol:"ARBITRO",equipoActualId:null,capitaneaEquipoId:null}});expect(await asignarArbitro(8,arbitroId)).toMatchObject({ok:false,status:403});expect(fetchMock).not.toHaveBeenCalled();
});
