import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { EquiposPendientes } from "./equipos-pendientes";
export default function Page() {
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <EquiposPendientes />
    </RutaProtegida>
  );
}
