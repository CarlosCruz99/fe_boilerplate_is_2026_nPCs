"use client";
import { useCallback, useEffect, useState } from "react";
import {
  consultarDetalle,
  listarPendientes,
  listarTemporadas,
} from "@/app/actions/equipos";
import {
  ErrorConsulta,
  FotoJugador,
  MarcoEquipos,
  SelectorTemporada,
} from "@/components/equipos/ui";
import { useConsulta } from "@/hooks/use-consulta";
import type { EquipoDetalle } from "@/types/equipos";

export function EquiposPendientes() {
  const consulta = useCallback(() => listarTemporadas("ORGANIZADOR"), []);
  const { resultado, recargar } = useConsulta(consulta);
  const [temporada, setTemporada] = useState<number | null>(null);
  return (
    <MarcoEquipos titulo="Validar inscripciones">
      {!resultado ? (
        <p role="status">Cargando temporadas...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : !resultado.data.length ? (
        <p>No hay temporadas disponibles.</p>
      ) : (
        <>
          <SelectorTemporada
            temporadas={resultado.data}
            value={temporada ?? resultado.data[0].id}
            onChange={setTemporada}
          />
          <ListaPendientes
            key={temporada ?? resultado.data[0].id}
            temporadaId={temporada ?? resultado.data[0].id}
          />
        </>
      )}
    </MarcoEquipos>
  );
}
function ListaPendientes({ temporadaId }: { temporadaId: number }) {
  const [page, setPage] = useState(1);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const consulta = useCallback(
    () => listarPendientes(temporadaId, page),
    [temporadaId, page],
  );
  const { resultado, recargar } = useConsulta(consulta);
  // Si otro organizador vació la página, regresamos a una página existente.
  const total = resultado?.ok ? resultado.data.total : null;
  useEffect(() => {
    if (total !== null && page > Math.max(1, Math.ceil(total / 20))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(Math.max(1, Math.ceil(total / 20)));
    }
  }, [total, page]);
  return (
    <>
      {!resultado ? (
        <p role="status">Cargando equipos pendientes...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : (
        <>
          <p>{resultado.data.total} equipos pendientes</p>
          {!resultado.data.items.length ? (
            <p>No hay equipos pendientes en esta temporada.</p>
          ) : (
            <ul className="league-grid">
              {resultado.data.items.map((e) => (
                <li key={e.id} className="league-card">
                  <h2>{e.nombre}</h2>
                  <p>Capitán: {e.nombreCapitan}</p>
                  <p>{e.totalJugadores} jugadores</p>
                  <p>
                    Solicitud:{" "}
                    {new Date(e.creadoEn).toLocaleDateString("es-SV", {
                      timeZone: "America/El_Salvador",
                    })}
                  </p>
                  <button onClick={() => setSeleccion(e.id)}>
                    Revisar {e.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <nav aria-label="Paginación" className="league-row">
            <button
              disabled={page <= 1}
              onClick={() => {
                setSeleccion(null);
                setPage((p) => p - 1);
              }}
            >
              Anterior
            </button>
            <span>
              Página {page} de{" "}
              {Math.max(1, Math.ceil(resultado.data.total / 20))}
            </span>
            <button
              disabled={page * 20 >= resultado.data.total}
              onClick={() => {
                setSeleccion(null);
                setPage((p) => p + 1);
              }}
            >
              Siguiente
            </button>
          </nav>
        </>
      )}
      <button
        onClick={() => {
          setSeleccion(null);
          recargar();
        }}
      >
        Actualizar pendientes
      </button>
      {seleccion !== null && (
        <DetalleEquipo
          key={seleccion}
          id={seleccion}
          alCerrar={() => setSeleccion(null)}
        />
      )}
    </>
  );
}
function DetalleEquipo({ id, alCerrar }: { id: number; alCerrar: () => void }) {
  const consulta = useCallback(() => consultarDetalle(id), [id]);
  const { resultado, recargar } = useConsulta(consulta);
  return (
    <section className="league-card" aria-label="Detalle del equipo">
      <button onClick={alCerrar}>Cerrar detalle</button>
      {!resultado ? (
        <p role="status">Cargando detalle...</p>
      ) : !resultado.ok ? (
        <ErrorConsulta mensaje={resultado.error} reintentar={recargar} />
      ) : (
        <>
          <DatosDetalle equipo={resultado.data} />
        </>
      )}
    </section>
  );
}
function DatosDetalle({ equipo }: { equipo: EquipoDetalle }) {
  return (
    <>
      <h2>{equipo.nombre}</h2>
      <p>Capitán: {equipo.nombreCapitan}</p>
      <p>{equipo.jugadores.length} jugadores</p>
      {equipo.jugadores.length < 7 && (
        <p className="league-warning">
          Plantilla incompleta: se necesitan al menos 7 jugadores.
        </p>
      )}
      <ul className="league-grid w-full">
        {equipo.jugadores.map((j) => (
          <li className="league-card" key={j.id}>
            <FotoJugador nombre={j.nombreCompleto} url={j.fotoUrl} />
            <h3>{j.nombreCompleto}</h3>
            <p>
              {j.edad === undefined ? "Edad no disponible" : `${j.edad} años`}
            </p>
            {j.edad !== undefined && j.edad < 16 && (
              <p className="league-warning">Menor de 16 años</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
