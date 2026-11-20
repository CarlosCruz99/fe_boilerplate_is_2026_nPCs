import { describe, expect, it } from "vitest";
import { accesosUsuario } from "@/lib/navigation";
import type { UsuarioSesion } from "@/types/auth";

const jugador: UsuarioSesion = { id: "jugador", nombre: "Ana", email: "ana@liga.test", rol: "JUGADOR", equipoActualId: null, capitaneaEquipoId: null };
const rutas = (usuario: UsuarioSesion) => accesosUsuario(usuario).map((acceso) => acceso.href);

describe("Accesos de la liga", () => {
  it("hace accesibles calendario y avisos para jugadores sin ofrecer funciones de capitán", () => {
    expect(rutas(jugador)).toEqual(["/mis-estadisticas", "/mi-calendario", "/avisos", "/equipos/nuevo", "/vincular-ficha"]);
  });
  it("enlaza la plantilla del equipo capitaneado y sus pagos", () => {
    const accesos = rutas({ ...jugador, equipoActualId: 9, capitaneaEquipoId: 23 });
    expect(accesos).toContain("/equipos/23/jugadores");
    expect(accesos).toContain("/equipo/cuotas");
    expect(accesos).toContain("/equipo/pagos");
    expect(accesos).not.toContain("/equipos/9/jugadores");
  });
  it("ofrece las herramientas de organización y destacados", () => {
    expect(rutas({ ...jugador, rol: "ORGANIZADOR" })).toEqual(["/organizador/destacados", "/organizador/calendario", "/organizador/equipos", "/organizador/cuotas", "/organizador/pagos", "/reportes/pagos", "/reportes/deportivo"]);
  });
  it("lleva al árbitro a su mesa de control", () => {
    expect(rutas({ ...jugador, rol: "ARBITRO" })).toEqual(["/arbitro/partidos"]);
  });
});
