import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { MesaArbitro } from "./mesa-arbitro";

export default async function PartidoArbitroDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RutaProtegida rolesPermitidos={["ARBITRO"]}>
      <MesaArbitro idTexto={id} />
    </RutaProtegida>
  );
}
