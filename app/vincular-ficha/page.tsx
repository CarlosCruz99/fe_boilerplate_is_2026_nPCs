import type { Metadata } from "next";
import Link from "next/link";
import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { LinkPlayerForm } from "./link-player-form";

export const metadata: Metadata = {
  title: "Vincular ficha",
};

export default function VincularFichaPage() {
  return (
    <RutaProtegida rolesPermitidos={["JUGADOR"]}>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h1 className="mb-4 text-2xl font-semibold">
            Vincular mi ficha
          </h1>

          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Ingresa la identificación y la fecha de nacimiento
            que tu capitán registró en tu ficha.
          </p>

          <LinkPlayerForm />

          <Link href="/" className="mt-6 inline-block text-sm underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    </RutaProtegida>
  );
}