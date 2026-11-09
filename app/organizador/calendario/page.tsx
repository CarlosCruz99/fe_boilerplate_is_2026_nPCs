import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { CalendarioOrganizador } from "./calendario-organizador";
export default function Page() {
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <CalendarioOrganizador />
    </RutaProtegida>
  );
}
