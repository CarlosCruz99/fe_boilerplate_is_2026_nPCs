"use server";
import { equiposApi } from "@/lib/equipos-api";
import { idValido, validarJugador } from "@/lib/equipos-validation";
import type {
  Equipo,
  Jugador,
  Resultado,
  Temporada,
  PaginaEquipos,
  EquipoDetalle,
  ValidacionEquipo,
} from "@/types/equipos";
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
export async function consultarPlantilla(
  id: number,
  temporadaId: number,
): Promise<Resultado<{ equipo: Equipo; jugadores: Jugador[] }>> {
  if (!idValido(id)) return invalido();
  const equipo = await consultarMiEquipo(temporadaId);
  if (!equipo.ok) return equipo;
  if (equipo.data.id !== id)
    return {
      ok: false,
      status: 403,
      error: "No tienes permiso para ver esta página.",
    };
  const jugadores = await equiposApi<Jugador[]>(
    "JUGADOR",
    `equipos/${id}/jugadores`,
  );
  return jugadores.ok
    ? { ok: true, data: { equipo: equipo.data, jugadores: jugadores.data } }
    : jugadores;
}
export async function agregarJugador(id: number, form: FormData) {
  if (!idValido(id)) return invalido();
  const error = validarJugador(form);
  if (error) return invalido(error);
  const body = new FormData();
  for (const field of ["nombreCompleto", "identificacion", "fechaNacimiento"])
    body.set(field, String(form.get(field)).trim());
  body.set("foto", form.get("foto") as File);
  // El backend verifica capitanía, estado y cupo dentro de la transacción.
  return equiposApi<Jugador>("JUGADOR", `equipos/${id}/jugadores`, {
    method: "POST",
    body,
  });
}
export async function quitarJugador(id: number, jugadorId: number) {
  if (!idValido(id) || !idValido(jugadorId)) return invalido();
  return equiposApi<void>("JUGADOR", `equipos/${id}/jugadores/${jugadorId}`, {
    method: "DELETE",
  });
}
export async function listarPendientes(temporadaId: number, page: number) {
  if (!idValido(temporadaId) || !idValido(page)) return invalido();
  return equiposApi<PaginaEquipos>(
    "ORGANIZADOR",
    `equipos?temporadaId=${temporadaId}&estado=PENDIENTE&page=${page}&pageSize=20`,
  );
}
export async function consultarDetalle(id: number) {
  if (!idValido(id)) return invalido();
  return equiposApi<EquipoDetalle>("ORGANIZADOR", `equipos/${id}`);
}
export async function validarEquipo(
  id: number,
  decision: "APROBAR" | "RECHAZAR",
  motivo = "",
) {
  if (!idValido(id) || !["APROBAR", "RECHAZAR"].includes(decision))
    return invalido();
  motivo = motivo.trim();
  if (decision === "RECHAZAR" && (motivo.length < 20 || motivo.length > 500))
    return invalido("El motivo debe tener entre 20 y 500 caracteres.");
  return equiposApi<ValidacionEquipo>(
    "ORGANIZADOR",
    `equipos/${id}/validacion`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        decision === "APROBAR" ? { decision } : { decision, motivo },
      ),
    },
  );
}
