export const LIMITE_GALERIA = 30;
export const LIMITE_FOTO = 5 * 1024 * 1024;
export const LIMITE_VIDEO = 50 * 1024 * 1024;
export function validarArchivoGaleria(archivo: File): string | null {
  const formatos: Record<string, RegExp> = { "image/jpeg": /\.jpe?g$/i, "image/png": /\.png$/i, "video/mp4": /\.mp4$/i };
  if (!formatos[archivo.type]?.test(archivo.name)) return "Formato no permitido. Usa JPG, PNG o MP4.";
  if (!archivo.size) return "El archivo está vacío.";
  if (archivo.size > (archivo.type === "video/mp4" ? LIMITE_VIDEO : LIMITE_FOTO)) return archivo.type === "video/mp4" ? "El video supera 50 MiB." : "La foto supera 5 MiB.";
  if (Array.from(archivo.name).length > 255) return "El nombre supera 255 caracteres.";
  return null;
}
export function validarDescripcionGaleria(descripcion: string) {
  return Array.from(descripcion).length > 200 ? "La descripción no debe superar 200 caracteres." : null;
}
