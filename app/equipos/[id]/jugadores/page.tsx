import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { listarTemporadas } from "@/app/actions/equipos";
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
  // El menú general abre la plantilla en la temporada actual; los enlaces
  // desde inscripciones conservan la temporada seleccionada explícitamente.
  const temporadas = temporadaId === undefined ? await listarTemporadas("JUGADOR") : null;
  const temporadaSeleccionada = temporadaId === undefined
    ? (temporadas?.ok ? temporadas.data.find((temporada) => temporada.actual)?.id : undefined)
    : Number(temporadaId);
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]}>
      <PlantillaEquipo id={Number(id)} temporadaId={Number(temporadaSeleccionada)} />
    </RutaProtegida>
  );
}
