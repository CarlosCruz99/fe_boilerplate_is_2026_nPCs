import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { HistorialPagosEquipo } from "@/components/pagos/historial-pagos-equipo";
export default function HistorialPagosPage() {
  return <RutaProtegida rolesPermitidos={["JUGADOR"]} exigeCapitania><HistorialPagosEquipo /></RutaProtegida>;
}
