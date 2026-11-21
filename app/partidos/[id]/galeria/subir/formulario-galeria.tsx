"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subirArchivoGaleria } from "@/lib/galeria-upload";
import { LIMITE_GALERIA, validarArchivoGaleria, validarDescripcionGaleria } from "@/lib/galeria-validation";
type Elemento = { id: string; archivo: File; estado: "Pendiente" | "Subiendo" | "Publicado" | "Error"; progreso: number; error?: string; contenidoId?: string; descripcion?: string };
export function FormularioGaleria({ partidoId }: { partidoId: number }) {
  const router = useRouter();
  const [cola, setCola] = useState<Elemento[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const bloqueo = useRef(false);
  const actualizar = (id: string, datos: Partial<Elemento>) => setCola(actual => actual.map(e => e.id === id ? { ...e, ...datos } : e));
  function seleccionar(archivos: File[]) {
    setError("");
    if (cola.length + archivos.length > LIMITE_GALERIA) { setError("La cola admite hasta 30 archivos. Retira elementos antes de agregar más."); return; }
    setCola(actual => [...actual, ...archivos.map(archivo => {
      const error = validarArchivoGaleria(archivo);
      return { id: crypto.randomUUID(), archivo, estado: error ? "Error" as const : "Pendiente" as const, progreso: 0, error: error ?? undefined };
    })]);
  }
  async function enviar(elementos: Elemento[]) {
    if (bloqueo.current) return;
    const fallo = validarDescripcionGaleria(descripcion);
    if (fallo) { setError(fallo); return; }
    if (!elementos.length) { setError("Selecciona archivos válidos para subir."); return; }
    bloqueo.current = true; setOcupado(true); setError("");
    let publicado = false;
    try {
      for (const elemento of elementos) {
        const fallo = validarArchivoGaleria(elemento.archivo);
        if (fallo) { actualizar(elemento.id, { estado: "Error", error: fallo }); continue; }
        // Conservar metadatos de cada intento para recuperar respuestas perdidas
        // con la deduplicación de BE-17.1, aunque se edite la descripción global.
        const texto = elemento.descripcion ?? descripcion;
        actualizar(elemento.id, { estado: "Subiendo", progreso: 0, error: undefined, descripcion: texto });
        try {
          const respuesta = await subirArchivoGaleria(partidoId, elemento.archivo, texto, progreso => actualizar(elemento.id, { progreso }));
          setTotal(respuesta.totalActivos);
          const resultado = respuesta.resultados[0];
          if (resultado.estado === "PUBLICADO") {
            publicado = true;
            actualizar(elemento.id, { estado: "Publicado", progreso: 100, contenidoId: resultado.contenidoId });
          } else actualizar(elemento.id, { estado: "Error", error: resultado.motivo });
        } catch (e) { actualizar(elemento.id, { estado: "Error", error: e instanceof Error ? e.message : "Fallo de red. Puedes reintentar." }); }
      }
    } finally {
      bloqueo.current = false; setOcupado(false);
      if (publicado) router.refresh();
    }
  }
  const pendientes = cola.filter(e => e.estado === "Pendiente");
  const fallidos = cola.filter(e => e.estado === "Error" && !validarArchivoGaleria(e.archivo));
  return <main className="league-page">
    <Link href={`/partidos/${partidoId}/galeria`} className="underline">Volver a la galería</Link>
    <h1 className="text-2xl font-semibold">Subir contenido · Partido #{partidoId}</h1>
    <p>Hasta 30 archivos por partido. Fotos JPG/PNG hasta 5 MiB y videos MP4 hasta 50 MiB.</p>
    {total !== null && <p role="status">{total} {total === 1 ? "archivo activo" : "archivos activos"} · {Math.max(0, 30 - total)} espacios disponibles. El cupo se confirma al publicar.</p>}
    {error && <p role="alert" className="league-alert">{error}</p>}
    <fieldset disabled={ocupado} className="league-card w-full">
      <legend className="font-semibold">Seleccionar contenido</legend>
      <label className="block">Archivos<input className="block w-full min-w-0 rounded border p-2" type="file" multiple accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4" onChange={e => { seleccionar(Array.from(e.target.files ?? [])); e.target.value = ""; }} /></label>
      <label className="block">Descripción opcional<textarea className="block w-full rounded border p-2" value={descripcion} aria-invalid={!!validarDescripcionGaleria(descripcion)} onChange={e => setDescripcion(e.target.value)} /></label>
      <p className="text-sm">{Array.from(descripcion).length}/200 caracteres. Los reintentos conservan la descripción del primer envío de cada archivo.</p>
      {validarDescripcionGaleria(descripcion) && <p role="alert">{validarDescripcionGaleria(descripcion)}</p>}
    </fieldset>
    {!cola.length && <p>No has seleccionado archivos.</p>}
    <ul className="space-y-4" aria-label="Cola de archivos">
      {cola.map(e => <li key={e.id} className="league-card">
        <h2 className="break-all font-semibold">{e.archivo.name}</h2>
        <p className="break-all">{e.archivo.type || "Formato desconocido"} · {e.archivo.size < 1024 ? `${e.archivo.size} bytes` : e.archivo.size < 1024 * 1024 ? `${(e.archivo.size / 1024).toFixed(2)} KiB` : `${(e.archivo.size / 1024 / 1024).toFixed(2)} MiB`}</p>
        <p role="status">{e.estado}{e.estado === "Subiendo" && (e.progreso === 100 ? " · Esperando confirmación de la publicación" : ` · ${e.progreso}%`)}</p>
        {e.estado === "Subiendo" && <progress aria-label={`Progreso de ${e.archivo.name}`} max={100} value={e.progreso} className="w-full" />}
        {e.error && <p role="alert">{e.error}</p>}
        {e.contenidoId && <p className="break-all">Registro: {e.contenidoId}</p>}
        {e.estado !== "Publicado" && <button type="button" disabled={ocupado} className="rounded border disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2" onClick={() => setCola(actual => actual.filter(a => a.id !== e.id))}>Retirar {e.archivo.name}</button>}
        {e.estado === "Error" && !validarArchivoGaleria(e.archivo) && <button type="button" disabled={ocupado} className="ml-2 rounded border disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2" onClick={() => void enviar([e])}>Reintentar {e.archivo.name}</button>}
      </li>)}
    </ul>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={ocupado || !pendientes.length} onClick={() => void enviar(pendientes)} className="league-primary">{ocupado ? "Subiendo contenido..." : "Subir pendientes"}</button>
      <button type="button" disabled={ocupado || !fallidos.length} onClick={() => void enviar(fallidos)} className="rounded border disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2">Reintentar fallidos</button>
    </div>
  </main>;
}
