import Link from "next/link";
import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { AvisoCalendarioPublicadoVista } from "@/components/avisos/aviso-calendario-publicado";
import type { AvisoCalendarioPublicado } from "@/types/avisos-calendario";

// Datos de muestra solo para revisar el mockup; no constituyen un aviso recibido.
const avisoEjemplo: AvisoCalendarioPublicado = {
  id: 0,
  tipo: "JORNADA_PUBLICADA",
  moduloOrigen: "CALENDARIO",
  titulo: "Calendario publicado: jornada 3",
  mensaje: "Tu equipo juega contra Tigres el 21/11/2026 a las 08:00 en Cancha 1.",
  creadoEn: "2026-11-05T15:10:00.000Z",
  leidoEn: null,
  referenciaTipo: "JORNADA",
  referenciaId: 3,
  datos: { jornada: 3, rival: "Tigres", fecha: "21/11/2026", hora: "08:00", cancha: "Cancha 1" },
};

export default async function AvisoCalendarioPublicadoPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]} exigeCapitania>
      <main className="flex-1 bg-slate-50 px-4 py-8 dark:bg-slate-950">
        {demo === "1" ? (
          <AvisoCalendarioPublicadoVista aviso={avisoEjemplo} esDemostracion />
        ) : (
          <section className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h1 className="text-xl font-bold">Avisos de calendario</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              La vista del aviso está preparada. La bandeja de notificaciones H19 aún debe proporcionar el aviso recibido para mostrar información real.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/mi-calendario" className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Ver mi calendario</Link>
              <Link href="/avisos/calendario-publicado?demo=1" className="rounded-lg border px-4 py-2 text-sm font-medium">Ver ejemplo visual</Link>
            </div>
          </section>
        )}
      </main>
    </RutaProtegida>
  );
}
