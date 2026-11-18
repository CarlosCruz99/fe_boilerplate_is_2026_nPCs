import { DetalleMarcador } from "@/components/partidos/detalle-marcador";
export default async function MarcadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleMarcador key={id} partidoId={/^\d+$/.test(id) ? Number(id) : NaN} />;
}
