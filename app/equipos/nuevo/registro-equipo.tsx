"use client";
import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  consultarMiEquipo,
  crearEquipo,
  listarTemporadas,
} from "@/app/actions/equipos";
import { useAuth } from "@/contexts/auth-context";
import { useConsulta } from "@/hooks/use-consulta";
import {
  ErrorConsulta,
  EstadoInscripcion,
  MarcoEquipos,
  SelectorTemporada,
} from "@/components/equipos/ui";
import type { Temporada } from "@/types/equipos";

export function InscripcionEquipo() {
  const consultar = useCallback(async () => {
    const abiertas = await listarTemporadas("JUGADOR", true);
    if (!abiertas.ok) return abiertas;
    const todas = await listarTemporadas("JUGADOR");
    if (!todas.ok) return todas;
    return {
      ok: true as const,
      data: [
        ...abiertas.data,
        ...todas.data.filter((t) => !abiertas.data.some((a) => a.id === t.id)),
      ],
    };
  }, []);
  const { resultado, recargar } = useConsulta(consultar);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  return (
    <MarcoEquipos titulo="Inscribir mi equipo">
      {!resultado ? (
        <p role="status">Cargando temporadas...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : !resultado.data.length ? (
        <p>No hay temporadas disponibles.</p>
      ) : (
        <>
          <SelectorTemporada
            temporadas={resultado.data}
            value={seleccion ?? resultado.data[0].id}
            onChange={setSeleccion}
          />
          <RegistroTemporada
            key={seleccion ?? resultado.data[0].id}
            temporada={
              resultado.data.find((t) => t.id === seleccion) ??
              resultado.data[0]
            }
          />
        </>
      )}
    </MarcoEquipos>
  );
}
function RegistroTemporada({ temporada }: { temporada: Temporada }) {
  const consultar = useCallback(
    () => consultarMiEquipo(temporada.id),
    [temporada.id],
  );
  const { resultado, recargar } = useConsulta(consultar);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { actualizarSesion } = useAuth();
  const router = useRouter();
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    if (nombre.trim().length < 3 || nombre.trim().length > 50) {
      setError("El nombre debe tener entre 3 y 50 caracteres.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await crearEquipo(nombre, temporada.id);
      if (!res.ok) {
        setError(res.error);
        if (res.status === 409) recargar();
        return;
      }
      await actualizarSesion();
      router.push(
        `/equipos/${res.data.id}/jugadores?temporadaId=${temporada.id}`,
      );
    } catch {
      setError("No pudimos registrar el equipo. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }
  if (!resultado) return <p role="status">Consultando tu equipo...</p>;
  if (resultado.ok)
    return (
      <>
        <EstadoInscripcion equipo={resultado.data} />
        <Link
          className="league-link"
          href={`/equipos/${resultado.data.id}/jugadores?temporadaId=${temporada.id}`}
        >
          Ver plantilla
        </Link>
        <button onClick={recargar}>Actualizar estado</button>
      </>
    );
  if (resultado.status !== 404)
    return <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />;
  if (!temporada.inscripcionAbierta)
    return <p>La inscripción de la temporada está cerrada.</p>;
  return (
    <form className="league-card" onSubmit={enviar}>
      <h2>Registrar equipo</h2>
      <label className="league-field">
        Nombre del equipo
        <input
          required
          minLength={3}
          maxLength={50}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </label>
      {error && <ErrorConsulta mensaje={error} />}
      <button className="league-primary" disabled={enviando}>
        {enviando ? "Registrando..." : "Registrar equipo"}
      </button>
    </form>
  );
}
