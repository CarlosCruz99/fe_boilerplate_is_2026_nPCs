
"use client";

import { useEffect, useState } from "react";

type ResultadoConsulta<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      error: string;
      codigo?: string;
      fallas?: string[];
    };

export function useConsulta<T>(
  consultar: () => Promise<ResultadoConsulta<T>>
) {
  const [revision, setRevision] = useState(0);

  const [lectura, setLectura] = useState<{
    consultar: typeof consultar;
    revision: number;
    resultado: ResultadoConsulta<T>;
  } | null>(null);

  useEffect(() => {
    let vigente = true;

    void consultar()
      .catch((): ResultadoConsulta<T> => ({
        ok: false,
        status: 503,
        error: "No pudimos completar la consulta. Intenta nuevamente.",
      }))
      .then((resultado) => {
        if (vigente) {
          setLectura({ consultar, revision, resultado });
        }
      });

    return () => {
      vigente = false;
    };
  }, [consultar, revision]);

  return {
    resultado:
      lectura?.consultar === consultar &&
      lectura.revision === revision
        ? lectura.resultado
        : null,
    recargar: () => setRevision((r) => r + 1),
  };
}

