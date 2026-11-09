import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { BandejaAvisos } from "@/components/avisos/bandeja-avisos";

export default async function AvisoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numero = Number(id);
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]}>
      {/^[0-9]+$/.test(id) && Number.isSafeInteger(numero) && numero > 0 ? (
        <BandejaAvisos seleccionInicialId={numero} />
      ) : (
        <main role="alert" className="p-6">Identificador de aviso inválido.</main>
      )}
    </RutaProtegida>
  );
}
