import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { PlantillaEquipo } from "./plantilla-equipo";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ temporadaId?: string }>;
}) {
  const { id } = await params;
  const { temporadaId } = await searchParams;
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]}>
      <PlantillaEquipo id={Number(id)} temporadaId={Number(temporadaId)} />
    </RutaProtegida>
  );
}
