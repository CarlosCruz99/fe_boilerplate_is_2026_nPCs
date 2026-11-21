import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { VistaReportePagos } from "./vista-reporte-pagos";

export default function ReportePagosPage() {
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <VistaReportePagos />
    </RutaProtegida>
  );
}
