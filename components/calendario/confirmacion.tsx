"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function ConfirmacionCalendario({
  titulo,
  ocupado,
  confirmar,
  cerrar,
  children,
}: {
  titulo: string;
  ocupado: boolean;
  confirmar: () => void;
  cerrar: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="league-modal"
      aria-labelledby="confirmacion-calendario"
      onCancel={(event) => {
        event.preventDefault();
        if (!ocupado) cerrar();
      }}
    >
      <form
        className="league-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ocupado) confirmar();
        }}
      >
        <h2 id="confirmacion-calendario">{titulo}</h2>
        {children}
        <div className="league-row">
          <button type="button" disabled={ocupado} onClick={cerrar}>
            Volver
          </button>
          <button autoFocus className="league-primary" disabled={ocupado}>
            {ocupado ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
