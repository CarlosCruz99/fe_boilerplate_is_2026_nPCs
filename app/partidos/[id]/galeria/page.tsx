import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { GaleriaPartido } from "./galeria-partido";

export default async function GaleriaPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ id }, { page }] = await Promise.all([params, searchParams]);
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR", "JUGADOR"]}>
      <GaleriaPartido id={id} pagina={typeof page === "string" ? page : "1"} />
    </RutaProtegida>
  );
}
