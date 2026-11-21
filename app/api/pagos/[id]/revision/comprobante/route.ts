import { obtenerSesion } from "@/app/actions/session";
import { idHistorialValido } from "@/lib/historial-pagos-api";
import { getSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff",
  });
  const fallo = (status: number) => new Response(null, { status, headers });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !idHistorialValido(Number(id))) return fallo(400);

  try {
    const sesion = await obtenerSesion();
    if (sesion.estado === "error") return fallo(503);
    if (sesion.estado !== "autenticado") return fallo(401);
    if (sesion.usuario.rol !== "ORGANIZADOR") return fallo(403);
    const token = await getSession();
    if (!token) return fallo(401);
    const base = process.env.API_URL;
    if (!base) return fallo(503);

    const respuesta = await fetch(new URL(`pagos/${Number(id)}/revision/comprobante`, base.replace(/\/?$/, "/")), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) {
      await respuesta.body?.cancel();
      return fallo(respuesta.status);
    }
    const tipo = respuesta.headers.get("Content-Type")?.split(";")[0];
    const extension = tipo === "application/pdf" ? "pdf" : tipo === "image/jpeg" ? "jpg" : tipo === "image/png" ? "png" : null;
    if (!extension || !tipo || !respuesta.body) {
      await respuesta.body?.cancel();
      return fallo(502);
    }
    headers.set("Content-Type", tipo);
    headers.set("Content-Disposition", `attachment; filename="pago-${Number(id)}.${extension}"`);
    return new Response(respuesta.body, { headers });
  } catch {
    return fallo(502);
  }
}
