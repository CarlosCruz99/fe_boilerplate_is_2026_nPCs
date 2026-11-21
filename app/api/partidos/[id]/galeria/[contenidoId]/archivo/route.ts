import { enteroPositivoGaleria, solicitarGaleria } from "@/lib/galeria-consulta-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; contenidoId: string }> },
) {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff",
  });
  const { id, contenidoId } = await params;
  const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (!enteroPositivoGaleria(id) || !uuid.test(contenidoId)) {
    return new Response(null, { status: 400, headers });
  }

  const respuesta = await solicitarGaleria(
    `partidos/${id}/galeria/${contenidoId}/archivo`,
    request.headers.get("range"),
  );
  const rango = respuesta.headers.get("content-range");
  if (rango) headers.set("Content-Range", rango);

  if (!respuesta.ok) {
    await respuesta.body?.cancel();
    return new Response(null, { status: respuesta.status, headers });
  }

  const tipo = respuesta.headers.get("content-type")?.split(";")[0];
  if (tipo !== "image/jpeg" && tipo !== "image/png" && tipo !== "video/mp4") {
    await respuesta.body?.cancel();
    return new Response(null, { status: 502, headers });
  }

  headers.set("Content-Type", tipo);
  headers.set("Content-Disposition", "inline");
  for (const nombre of ["accept-ranges", "content-length"]) {
    const valor = respuesta.headers.get(nombre);
    if (valor) headers.set(nombre, valor);
  }
  return new Response(respuesta.body, { status: respuesta.status, headers });
}
