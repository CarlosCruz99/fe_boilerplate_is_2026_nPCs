"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export function SelectorPartidoArbitro() {
  const router = useRouter();
  const [idTexto, setIdTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  function abrirPartido() {
    const valor = idTexto.trim();
    if (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor))) {
      setError("Ingresa un número de partido válido.");
      return;
    }
    setError(null);
    router.push(`/arbitro/partidos/${valor}`);
  }

  return (
    <main className="league-page">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <header className="bg-slate-900 px-8 py-8 text-white">
          <p className="text-sm font-semibold tracking-wide text-slate-300">Control del encuentro</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Mesa del árbitro</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Accede al partido asignado para iniciar el encuentro, actualizar el marcador y las faltas,
            registrar participantes y finalizarlo.
          </p>
        </header>

        <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tu próximo encuentro</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Accede a tu partido</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Introduce el número de partido que te proporcionó la organización para abrir la mesa de control.
              </p>
            </div>

            <form
              className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800"
              onSubmit={(event) => {
                event.preventDefault();
                abrirPartido();
              }}
            >
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Número de partido
                <input
                  className={`${campo} mt-2`}
                  type="number"
                  min="1"
                  step="1"
                  value={idTexto}
                  onChange={(event) => setIdTexto(event.target.value)}
                  placeholder="Ejemplo: 12"
                  required
                />
              </label>

              {error && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Abrir mesa del partido
                </button>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Volver al inicio
                </Link>
              </div>
            </form>
          </div>

          <aside className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Estados del partido</h2>
            <div className="mt-5 space-y-4">
              {[
                ["Programado", "Solo se permite iniciar"],
                ["En curso", "Marcador, faltas y participantes"],
                ["Finalizado", "Resultado y estadísticas en solo lectura"],
              ].map(([titulo, descripcion], indice) => (
                <div key={titulo} className="space-y-3">
                  <div className={`rounded-2xl border px-4 py-5 text-center ${indice === 1 ? "bg-slate-100 dark:bg-slate-900" : indice === 2 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-white dark:bg-slate-950"} dark:border-slate-800`}>
                    <p className="font-bold text-slate-900 dark:text-white">{titulo}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{descripcion}</p>
                  </div>
                  {indice < 2 && <div className="mx-auto h-8 w-px bg-blue-500" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
