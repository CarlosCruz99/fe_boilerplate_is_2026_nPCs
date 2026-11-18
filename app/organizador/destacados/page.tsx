import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { VistaDestacados } from "@/components/destacados/vista-destacados";

export default function DestacadosPage() {
  return <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}><VistaDestacados /></RutaProtegida>;
}
