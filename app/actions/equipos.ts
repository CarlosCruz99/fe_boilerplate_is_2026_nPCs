"use server";
import { equiposApi } from "@/lib/equipos-api";
import { idValido } from "@/lib/equipos-validation";
import type { Equipo, Resultado, Temporada } from "@/types/equipos";
import type { Rol } from "@/types/auth";
function invalido(error = "Revisa los datos ingresados."): Resultado<never> {
  return { ok: false, status: 400, error };
}
export async function listarTemporadas(rol: Rol, abiertas = false) {
  if (rol !== "JUGADOR" && rol !== "ORGANIZADOR") return invalido();
  return equiposApi<Temporada[]>(
    rol,
    `temporadas${abiertas ? "?inscripcionAbierta=true" : ""}`,
  );
}
export async function consultarMiEquipo(temporadaId: number) {
  if (!idValido(temporadaId)) return invalido();
  return equiposApi<Equipo>(
    "JUGADOR",
    `equipos/mi-equipo?temporadaId=${temporadaId}`,
  );
}
export async function crearEquipo(nombre: string, temporadaId: number) {
  nombre = nombre.trim();
  if (nombre.length < 3 || nombre.length > 50 || !idValido(temporadaId))
    return invalido(
      "El nombre debe tener entre 3 y 50 caracteres y debes elegir una temporada.",
    );
  return equiposApi<Equipo>("JUGADOR", "equipos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, temporadaId }),
  });
}
