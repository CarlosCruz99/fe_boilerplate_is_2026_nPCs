import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { FormularioCuota } from "./formulario-cuota";

export default function CuotasPage() {
  return <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}><FormularioCuota /></RutaProtegida>;
}
