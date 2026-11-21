import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { InscripcionEquipo } from "./registro-equipo";
export default function Page() {
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]}>
      <InscripcionEquipo />
    </RutaProtegida>
  );
}
