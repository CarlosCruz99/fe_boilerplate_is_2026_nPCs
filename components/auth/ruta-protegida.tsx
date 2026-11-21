"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import type { Rol } from "@/types/auth";

type Props = {
  children: ReactNode;
  rolesPermitidos?: Rol[];
  exigeCapitania?: boolean;
};

export function RutaProtegida({
  children,
  rolesPermitidos,
  exigeCapitania = false,
}: Props) {
  const router = useRouter();

  const {
    estado,
    usuario,
    capitaneaEquipoId,
    mensaje,
    actualizarSesion,
  } = useAuth();

  useEffect(() => {
    if (estado === "sin-sesion") {
      router.replace("/login");
    }
  }, [estado, router]);

  if (estado === "cargando") {
    return <p role="status" className="p-6">Comprobando sesión...</p>;
  }

  if (estado === "error") {
    return (
      <div className="league-page">
        <p role="alert">{mensaje}</p>

        <button
          type="button"
          onClick={() => void actualizarSesion()}
          className="rounded-md border px-4 py-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (estado === "sin-sesion") {
    return <p role="status" className="p-6">Redirigiendo...</p>;
  }

  if (!usuario) {
    return null;
  }

  const rolPermitido =
    !rolesPermitidos || rolesPermitidos.includes(usuario.rol);

  const cumpleCapitania =
    !exigeCapitania ||
    (usuario.rol === "JUGADOR" && capitaneaEquipoId !== null);

  if (!rolPermitido || !cumpleCapitania) {
    return (
      <main className="league-page">
        <section className="league-card">
          <h1>Esta sección tiene acceso restringido</h1>
          <p role="alert">No tienes permiso para ver esta página.</p>
          <Link href="/" className="league-link league-primary">Volver al inicio</Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}