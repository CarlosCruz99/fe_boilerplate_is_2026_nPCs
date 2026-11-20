import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { VistaRevisionPago } from "./vista-revision-pago";

export default async function RevisionPagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RutaProtegida rolesPermitidos={["ORGANIZADOR"]}>
      <VistaRevisionPago key={id} id={/^\d+$/.test(id) ? Number(id) : 0} />
    </RutaProtegida>
  );
}
