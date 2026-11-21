import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { VistaReporteDeportivo } from "./vista-reporte-deportivo";

export default function ReporteDeportivoPage() {
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <VistaReporteDeportivo />
    </RutaProtegida>
  );
}
