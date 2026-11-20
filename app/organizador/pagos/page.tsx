import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { BandejaVerificacion } from "./bandeja-verificacion";

export default function PagosPendientesPage() {
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <BandejaVerificacion />
    </RutaProtegida>
  );
}
