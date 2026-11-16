import type { RespuestaGaleria } from "@/types/galeria";
// XHR permite medir los bytes transmitidos; 100% no significa publicación confirmada.
export function subirArchivoGaleria(partidoId: number, archivo: File, descripcion: string, progreso: (porcentaje: number) => void): Promise<RespuestaGaleria> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/partidos/${partidoId}/galeria`);
    xhr.timeout = 240000;
    xhr.upload.onprogress = e => { if (e.lengthComputable) progreso(Math.round(e.loaded / e.total * 100)); };
    xhr.onerror = () => reject(new Error("Fallo de red. Puedes reintentar este archivo."));
    xhr.ontimeout = () => reject(new Error("La publicación tardó demasiado. Puedes reintentar."));
    xhr.onabort = () => reject(new Error("La subida se interrumpió. Puedes reintentar."));
    xhr.onload = () => {
      try {
        const datos = JSON.parse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300) throw new Error(datos.error ?? `No se pudo publicar (${xhr.status}).`);
        if (datos.partidoId !== partidoId || !Number.isInteger(datos.totalActivos) || datos.totalActivos < 0 || datos.limite !== 30 || !Array.isArray(datos.resultados) || datos.resultados.length !== 1) throw new Error("El servidor no confirmó el archivo. Puedes reintentar.");
        const resultado = datos.resultados[0];
        if (resultado.nombre !== archivo.name || !(resultado.estado === "PUBLICADO" && typeof resultado.contenidoId === "string" && resultado.contenidoId.length > 0 || resultado.estado === "ERROR" && typeof resultado.motivo === "string")) throw new Error("Respuesta de publicación inválida. Puedes reintentar.");
        resolve(datos);
      } catch (e) { reject(e instanceof Error ? e : new Error("No se pudo confirmar la publicación.")); }
    };
    const datos = new FormData(); datos.append("archivos[]", archivo); datos.set("descripcion", descripcion);
    xhr.send(datos);
  });
}
