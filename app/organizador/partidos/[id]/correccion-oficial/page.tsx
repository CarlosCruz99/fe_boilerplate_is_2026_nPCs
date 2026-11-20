import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { VistaCorreccionOficial } from "./vista-correccion-oficial";

export default async function CorreccionOficialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <VistaCorreccionOficial partidoId={/^[1-9]\d*$/.test(id) ? Number(id) : 0} />
    </RutaProtegida>
  );
}
