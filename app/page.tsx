"use client";

import { logout } from "@/app/actions/auth";
import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

function ContenidoInicio() {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <h1 className="text-center text-3xl font-semibold">
        Bienvenido, {usuario.nombre}
      </h1>

      <dl className="grid w-full max-w-md grid-cols-1 gap-2 break-words">
        <dt className="font-medium">Correo</dt>
        <dd>{usuario.email}</dd>

        <dt className="font-medium">Rol</dt>
        <dd>{usuario.rol}</dd>

        <dt className="font-medium">Equipo actual</dt>
        <dd>{usuario.equipoActualId ?? "Sin equipo"}</dd>

        <dt className="font-medium">Equipo que capitaneas</dt>
        <dd>{usuario.capitaneaEquipoId ?? "Sin capitanía"}</dd>
      </dl>

      {usuario.rol === "JUGADOR" && (
        <>
          <Link href="/equipos/nuevo" className="text-sm underline">
            Inscribir equipo / consultar estado
          </Link>
          <Link href="/vincular-ficha" className="text-sm underline">
            Vincular mi ficha
          </Link>
        </>
      )}

      {usuario.rol === "ORGANIZADOR" && (
        <Link href="/organizador/equipos" className="text-sm underline">
          Validar inscripciones
        </Link>
      )}

      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}

export default function Home() {
  return (
    <RutaProtegida>
      <ContenidoInicio />
    </RutaProtegida>
  );
}
