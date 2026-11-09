import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { BandejaAvisos } from "@/components/avisos/bandeja-avisos";
export default function AvisosPage() {
  return <RutaProtegida rolesPermitidos={["JUGADOR"]}><BandejaAvisos /></RutaProtegida>;
}
