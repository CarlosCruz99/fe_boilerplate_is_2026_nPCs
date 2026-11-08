"use client";

import { useActionState, type ComponentProps } from "react";
import {
  registrar,
  type RegistroState,
} from "@/app/actions/register";

const initialState: RegistroState = {};

type CampoProps = ComponentProps<"input"> & {
  id: string;
  label: string;
};

function Campo({ label, ...props }: CampoProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={props.id} className="text-sm font-medium">
        {label}
      </label>

      <input
        {...props}
        className="w-full min-w-0 rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
      />
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registrar,
    initialState,
  );

  return (
    <form action={formAction}>
      <fieldset
        disabled={pending}
        className="flex min-w-0 flex-col gap-4"
      >
        <legend className="sr-only">Datos de la nueva cuenta</legend>

        <Campo
          id="nombre"
          name="nombre"
          label="Nombre completo"
          type="text"
          autoComplete="name"
          minLength={3}
          maxLength={120}
          defaultValue={state.values?.nombre}
          required
        />

        <Campo
          id="email"
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          maxLength={254}
          defaultValue={state.values?.email}
          required
        />

        <Campo
          id="fechaNacimiento"
          name="fechaNacimiento"
          label="Fecha de nacimiento"
          type="date"
          autoComplete="bday"
          min="0001-01-01"
          defaultValue={state.values?.fechaNacimiento}
          required
        />

        <Campo
          id="password"
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          aria-describedby="password-ayuda"
          required
        />

        <p id="password-ayuda" className="text-sm text-zinc-600 dark:text-zinc-400">
          Usa al menos 8 caracteres, con una letra y un número.
        </p>

        <Campo
          id="confirmarPassword"
          name="confirmarPassword"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </fieldset>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 min-h-5 text-sm text-red-600"
      >
        {state.error}
      </p>
    </form>
  );
}