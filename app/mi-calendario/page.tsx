import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { CalendarioEquipoVista } from "./calendario-equipo";

export default function MiCalendarioPage() {
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]}>
      <CalendarioEquipoVista />
    </RutaProtegida>
  );
}
