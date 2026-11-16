import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { LIMITE_VIDEO, validarArchivoGaleria, validarDescripcionGaleria } from "@/lib/galeria-validation";
export const runtime = "nodejs";
const fallo = (error: string, status: number) => Response.json({ error }, { status });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origen = request.headers.get("origin");
  if (origen && origen !== new URL(request.url).origin) return fallo("Origen no permitido.", 403);
  const sesion = await obtenerSesion();
  if (sesion.estado === "error") return fallo(sesion.mensaje, 503);
  if (sesion.estado !== "autenticado") return fallo("Inicia sesión nuevamente.", 401);
  if (sesion.usuario.rol !== "ORGANIZADOR") return fallo("No tienes permiso para esta acción.", 403);
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) return fallo("Partido inválido.", 400);
  const token = await getSession();
  if (!token) return fallo("Inicia sesión nuevamente.", 401);
  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.startsWith("multipart/form-data")) return fallo("Envía un archivo como multipart/form-data.", 400);
  // Una petición por archivo; limitar también cuerpos sin Content-Length.
  const maximo = LIMITE_VIDEO + 1024 * 1024;
  if (Number(request.headers.get("content-length")) > maximo) return fallo("El archivo supera 50 MiB.", 413);
  let bytes = 0;
  try {
    if (!request.body) return fallo("Selecciona un archivo.", 400);
    const body = request.body.pipeThrough(new TransformStream({ transform(chunk, controller) {
      bytes += chunk.byteLength;
      if (bytes > maximo) throw new Error("LIMITE");
      controller.enqueue(chunk);
    } }));
    const form = await new Response(body, { headers: { "Content-Type": tipo } }).formData();
    const archivos = form.getAll("archivos[]");
    if (archivos.length !== 1 || !(archivos[0] instanceof File)) return fallo("Envía un archivo por solicitud.", 400);
    const archivo = archivos[0];
    const descripcion = form.get("descripcion") ?? "";
    if (typeof descripcion !== "string") return fallo("Descripción inválida.", 400);
    const error = validarArchivoGaleria(archivo) ?? validarDescripcionGaleria(descripcion);
    if (error) return fallo(error, 400);
    const datos = new FormData(); datos.set("archivos[]", archivo); datos.set("descripcion", descripcion);
    const base = process.env.API_URL;
    if (!base) return fallo("No se pudo conectar con el servicio de galería.", 503);
    const respuesta = await fetch(new URL(`partidos/${id}/galeria`, base.replace(/\/?$/, "/")), {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: datos,
      cache: "no-store", signal: AbortSignal.timeout(180000),
    });
    const contenido = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      const mensaje = contenido?.message ?? contenido?.mensaje;
      return fallo(respuesta.status >= 500 ? "No se pudo confirmar la publicación. Puedes reintentar." : Array.isArray(mensaje) ? mensaje.join(" ") : typeof mensaje === "string" ? mensaje : `No se pudo publicar (${respuesta.status}).`, respuesta.status);
    }
    if (contenido?.resultados?.some((r: { estado: string }) => r.estado === "PUBLICADO")) revalidatePath(`/partidos/${id}/galeria`);
    return Response.json(contenido);
  } catch {
    return fallo(bytes > maximo ? "El archivo supera 50 MiB." : "No se pudo confirmar la publicación. Puedes reintentar.", bytes > maximo ? 413 : 503);
  }
}
