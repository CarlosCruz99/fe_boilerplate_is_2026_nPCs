import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { FormularioPago } from "./formulario-pago";
export default function CuotasEquipoPage() {
  return <RutaProtegida rolesPermitidos={["JUGADOR"]} exigeCapitania><FormularioPago /></RutaProtegida>;
}
