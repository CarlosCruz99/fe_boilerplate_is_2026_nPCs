import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { FormularioGaleria } from "./formulario-galeria";
export default async function SubirGaleriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>{/^[1-9]\d*$/.test(id) && Number(id) <= 2147483647 ? <FormularioGaleria partidoId={Number(id)} /> : <p role="alert">Partido inválido.</p>}</RutaProtegida>;
}
