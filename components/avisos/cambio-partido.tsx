import Link from "next/link";
import type { Aviso } from "@/types/avisos";

type Cambio = { campoModificado: "FECHA" | "HORA" | "CANCHA"; valorAnterior: string; valorNuevo: string };

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor : null;
}

function esCambio(valor: unknown): valor is Cambio {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const objeto = valor as Record<string, unknown>;
  return (objeto.campoModificado === "FECHA" || objeto.campoModificado === "HORA" || objeto.campoModificado === "CANCHA")
    && texto(objeto.valorAnterior) !== null && texto(objeto.valorNuevo) !== null;
}

const nombres: Record<Cambio["campoModificado"], string> = {
  FECHA: "Fecha",
  HORA: "Hora",
  CANCHA: "Cancha",
};

/** Datos producidos por AvisosCambioPartidoService (BE-15.1). */
export function CambioPartido({ aviso }: { aviso: Aviso }) {
  if (aviso.tipo !== "PARTIDO_MODIFICADO") return null;

  const datos = aviso.datos;
  const local = texto(datos?.equipoLocal);
  const visitante = texto(datos?.equipoVisitante);
  const cambios = Array.isArray(datos?.cambios) ? datos.cambios.filter(esCambio) : [];
  const equipos = local && visitante ? `${local} vs ${visitante}` : null;

  return (
    <section aria-label="Cambios del partido" className="mt-6 space-y-5">
      {cambios.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {equipos && <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Equipos</p>
            <p className="mt-1 font-semibold">{equipos}</p>
          </div>}
          {cambios.map((cambio, indice) => (
            <div key={`${cambio.campoModificado}-${indice}`} className="contents">
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Campo modificado</p>
                <p className="mt-1 font-semibold">{nombres[cambio.campoModificado]}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Valor anterior</p>
                <p className="mt-1 font-semibold">{cambio.valorAnterior}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Valor nuevo</p>
                <p className="mt-1 font-semibold">{cambio.valorNuevo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {aviso.referencia?.tipo === "PARTIDO" && (
        <Link href="/mi-calendario" className="inline-flex rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
          Ver partido en mi calendario
        </Link>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {cambios.length === 0 ? "Consulta el mensaje del aviso para conocer los cambios del encuentro." : "Consulta los cambios registrados para este partido."}
      </p>
    </section>
  );
}
