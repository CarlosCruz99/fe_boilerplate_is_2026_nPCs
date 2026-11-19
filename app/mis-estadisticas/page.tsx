import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { VistaEstadisticasPersonales } from "@/components/estadisticas-personales/vista-estadisticas";

export default function MisEstadisticasPage() {
  return <RutaProtegida rolesPermitidos={["JUGADOR"]}><VistaEstadisticasPersonales /></RutaProtegida>;
}
