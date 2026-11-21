"use client";

import { useActionState } from "react";
import {
  vincularFicha,
  type VincularFichaState,
} from "@/app/actions/link-player";
import { useAuth } from "@/contexts/auth-context";

const initialState: VincularFichaState = {};

const inputClass =
  "w-full min-w-0 rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

export function LinkPlayerForm() {
  const { actualizarSesion, equipoActualId } = useAuth();

  async function enviar(
    prevState: VincularFichaState,
    formData: FormData,
  ): Promise<VincularFichaState> {
    const resultado = await vincularFicha(prevState, formData);

    if (resultado.exito) {
      await actualizarSesion();
    }

    return resultado;
  }

  const [state, formAction, pending] = useActionState(
    enviar,
    initialState,
  );

  return (
    <form action={formAction}>
      <fieldset
        disabled={pending || Boolean(state.exito)}
        className="flex min-w-0 flex-col gap-4"
      >
        <legend className="sr-only">Datos de tu ficha</legend>

        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="identificacion" className="text-sm font-medium">
            Identificación
          </label>

          <input
            id="identificacion"
            name="identificacion"
            type="text"
            minLength={5}
            maxLength={20}
            pattern="[A-Za-z0-9\-]{5,20}"
            title="Usa entre 5 y 20 letras, números o guiones."
            defaultValue={state.values?.identificacion}
            className={inputClass}
            required
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="fechaNacimiento" className="text-sm font-medium">
            Fecha de nacimiento
          </label>

          <input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            autoComplete="bday"
            min="0001-01-01"
            defaultValue={state.values?.fechaNacimiento}
            className={inputClass}
            required
          />
        </div>

        <button
          type="submit"
          disabled={pending || Boolean(state.exito)}
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
        >
          {pending ? "Vinculando..." : "Vincular ficha"}
        </button>
      </fieldset>

      <p
        aria-live="polite"
        className="mt-4 min-h-5 text-sm text-red-600"
      >
        {state.error}
      </p>

      <div aria-live="polite" className="text-sm">
        {state.exito && (
          <>
            <p className="text-green-700 dark:text-green-400">
              {state.exito}
            </p>

            <p className="mt-2">
              Equipo actual:{" "}
              {equipoActualId ?? "Sin equipo en la temporada actual"}
            </p>
          </>
        )}
      </div>
    </form>
  );
}