"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { consultarGaleria } from "@/app/actions/galeria";
import { useAuth } from "@/contexts/auth-context";
import { useConsulta } from "@/hooks/use-consulta";
import type { ContenidoGaleria } from "@/types/galeria";

function ArchivoGaleria({ id, item }: { id: string; item: ContenidoGaleria }) {
  const [fallo, setFallo] = useState(false);
  const src = `/api/partidos/${id}/galeria/${item.id}/archivo`;
  const etiqueta = item.descripcion || (item.tipo === "VIDEO" ? "Video del partido" : "Foto del partido");
  const marcarError = () => setFallo(true);

  return (
    <li className="league-card min-w-0">
      <figure className="grid w-full gap-3">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded bg-black/30">
          {fallo ? (
            <p role="status" className="p-3 text-center">Este archivo no está disponible.</p>
          ) : item.tipo === "VIDEO" ? (
            <video src={src} aria-label={etiqueta} controls playsInline preload="none"
              className="absolute inset-0 h-full w-full object-contain" onError={marcarError} />
          ) : (
            <Image src={src} alt={etiqueta} fill unoptimized className="object-contain" onError={marcarError} />
          )}
        </div>
        {item.descripcion && <figcaption className="wrap-anywhere">{item.descripcion}</figcaption>}
      </figure>
    </li>
  );
}

export function GaleriaPartido({ id, pagina }: { id: string; pagina: string }) {
  const { usuario } = useAuth();
  const organizador = usuario?.rol === "ORGANIZADOR";
  const consultar = useCallback(() => consultarGaleria(id, pagina), [id, pagina]);
  const { resultado, recargar } = useConsulta(consultar);
  const ruta = `/partidos/${id}/galeria`;

  return (
    <main className="league-page">
      <Link href={organizador ? "/organizador/calendario" : "/mi-calendario"} className="underline">
        Volver al calendario
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1>Galería del partido</h1>
          <p>Partido #{id}</p>
        </div>
        {organizador && resultado?.ok && (
          <Link className="league-link league-primary" href={`${ruta}/subir`}>Subir contenido</Link>
        )}
      </header>
      {!resultado && <p role="status">Cargando galería…</p>}
      {resultado && !resultado.ok && (
        <section className="league-card league-stack">
          <p role="alert">{resultado.error}</p>
          {resultado.status >= 500 && <button type="button" onClick={recargar}>Reintentar</button>}
          {resultado.status === 401 && <Link className="league-link" href="/login">Iniciar sesión</Link>}
        </section>
      )}
      {resultado?.ok && (
        <>
          {resultado.data.items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Fotos y videos del partido">
              {resultado.data.items.map(item => <ArchivoGaleria key={item.id} id={id} item={item} />)}
            </ul>
          ) : (
            <p className="league-card">
              {resultado.data.totalElementos === 0 ? "Este partido todavía no tiene fotos ni videos." : "No hay contenido en esta página."}
            </p>
          )}
          {resultado.data.page > Math.max(1, resultado.data.totalPaginas) ? (
            <Link href={ruta} className="league-link self-start">Volver a la primera página</Link>
          ) : resultado.data.totalPaginas > 1 && (
            <nav aria-label="Paginación de la galería" className="flex flex-wrap items-center gap-3">
              {resultado.data.page > 1 && <Link className="league-link" href={`${ruta}?page=${resultado.data.page - 1}`}>Anterior</Link>}
              <span>Página {resultado.data.page} de {resultado.data.totalPaginas}</span>
              {resultado.data.page < resultado.data.totalPaginas && (
                <Link className="league-link" href={`${ruta}?page=${resultado.data.page + 1}`}>Siguiente</Link>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
