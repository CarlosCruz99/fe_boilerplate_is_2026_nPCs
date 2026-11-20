import Link from "next/link";
import type { ConceptoCuota } from "@/types/cuotas";
import type { EstadoRevisionPago } from "@/types/verificacion-pagos";

export const conceptosPago: Record<ConceptoCuota, string> = { INSCRIPCION: "Inscripción", ARBITRAJE: "Arbitraje" };
export const estadosPago: Record<EstadoRevisionPago, string> = {
  PENDIENTE: "Pendiente de verificación",
  VERIFICADO: "Verificado",
  RECHAZADO: "Rechazado",
};

const fechaPago = new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeZone: "UTC" });

export function FechaPago({ fecha }: { fecha: string }) {
  return <time dateTime={fecha}>{fechaPago.format(new Date(`${fecha}T00:00:00Z`))}</time>;
}

export function ErrorPago({ status, error, reintentar }: { status: number; error: string; reintentar: () => void }) {
  return (
    <section className="league-card">
      <p role="alert">{error}</p>
      {status === 401 && <Link href="/login" className="league-link">Iniciar sesión</Link>}
      {status >= 500 && <button type="button" onClick={reintentar}>Reintentar</button>}
    </section>
  );
}
