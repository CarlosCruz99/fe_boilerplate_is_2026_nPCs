import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { FormularioEstadisticas } from "./formulario-estadisticas";

export default async function EstadisticasPartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RutaProtegida rolesPermitidos={["ARBITRO"]}>
      <FormularioEstadisticas idTexto={id} />
    </RutaProtegida>
  );
}
