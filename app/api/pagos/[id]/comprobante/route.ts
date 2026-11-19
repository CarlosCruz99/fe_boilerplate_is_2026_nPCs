import { idHistorialValido, sesionCapitanHistorial } from "@/lib/historial-pagos-api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
  const { id } = await params;
  if (!/^\d+$/.test(id) || !idHistorialValido(Number(id))) return new Response(null, { status: 400, headers });
  const sesion = await sesionCapitanHistorial();
  if (!sesion.ok) return new Response(null, { status: sesion.status, headers });
  try {
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    const respuesta = await fetch(new URL(`pagos/${Number(id)}/comprobante`, base.replace(/\/?$/, "/")), {
      headers: { Authorization: `Bearer ${sesion.data.token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) return new Response(null, { status: respuesta.status, headers });
    const type = respuesta.headers.get("Content-Type")?.split(";")[0];
    const extension = type === "application/pdf" ? "pdf" : type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : null;
    if (!extension) return new Response(null, { status: 502, headers });
    return new Response(respuesta.body, { headers: { ...headers, "Content-Type": type!, "Content-Disposition": `attachment; filename="pago-${Number(id)}.${extension}"` } });
  } catch {
    return new Response(null, { status: 502, headers });
  }
}
