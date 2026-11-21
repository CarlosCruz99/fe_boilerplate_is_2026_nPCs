import Image from "next/image";
import type { CSSProperties } from "react";
import { logosEquipos } from "./logos-equipos";

const simbolos: Record<string, string> = {
  aguila: "🦅", aguilas: "🦅", alacranes: "🦂", buhos: "🦉",
  cobras: "🐍", colibries: "🐦", condores: "🦅", coyotes: "🐺",
  delfines: "🐬", dragones: "🐉", gavilanes: "🦅", halcones: "🦅",
  iguanas: "🦎", jaguares: "🐆", leones: "🦁", lobos: "🐺",
  mapaches: "🦝", osos: "🐻", panteras: "🐈‍⬛", piranas: "🐟",
  pumas: "🐈", rayos: "⚡", tiburones: "🦈", tigres: "🐯",
  toros: "🐂", tucanes: "🐦", venados: "🦌", zorros: "🦊",
};

const formas = [
  "polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%)",
  "polygon(20% 0, 80% 0, 100% 20%, 100% 76%, 50% 100%, 0 76%, 0 20%)",
  "ellipse(49% 50% at 50% 50%)",
  "polygon(50% 0, 100% 18%, 100% 80%, 50% 100%, 0 80%, 0 18%)",
];

export function EscudoEquipo({ nombre, id }: { nombre: string; id?: number }) {
  const etiqueta = `Escudo de ${nombre}${id === undefined ? "" : `, equipo ${id}`}`;
  const asignacion = id === undefined ? undefined : logosEquipos[id];
  if (asignacion?.nombre === nombre) {
    return (
      <Image
        className="escudo-equipo-logo"
        src={`/logos-equipos/${asignacion.archivo}`}
        alt={etiqueta}
        width={90}
        height={90}
        unoptimized
      />
    );
  }

  let hash = 2166136261;
  for (const letra of nombre) {
    hash = Math.imul(hash ^ letra.codePointAt(0)!, 16777619) >>> 0;
  }

  const palabras = nombre.match(/[\p{L}\p{N}]+/gu) ?? [];
  const significativas = palabras.filter((palabra) => !/^(fc|cf|de|del|los|las|el|la)$/i.test(palabra));
  const partes = significativas.length ? significativas : palabras;
  const iniciales = (partes.length > 1
    ? partes.slice(0, 3).map((palabra) => Array.from(palabra)[0]).join("")
    : Array.from(partes[0] ?? nombre).slice(0, 3).join("")).toLocaleUpperCase("es");
  const simbolo = partes
    .map((palabra) => palabra.toLowerCase().normalize("NFD").replace(/\p{M}/gu, ""))
    .map((palabra) => Object.hasOwn(simbolos, palabra) ? simbolos[palabra] : undefined)
    .find(Boolean);

  const tono = hash % 360;
  const estilo = {
    "--escudo-forma": formas[(hash >>> 16) % formas.length],
    "--escudo-base": `hsl(${tono} 66% 19%)`,
    "--escudo-secundario": `hsl(${(tono + 38 + (hash >>> 24) % 145) % 360} 66% 29%)`,
    "--escudo-borde": `hsl(${tono} 86% 78%)`,
    "--escudo-angulo": `${[0, 35, 90, 145][(hash >>> 20) % 4]}deg`,
  } as CSSProperties;

  return (
    <span
      className="escudo-equipo"
      role="img"
      aria-label={etiqueta}
      style={estilo}
    >
      <span className="escudo-equipo-interior" aria-hidden="true">
        {simbolo && <span className="escudo-equipo-simbolo">{simbolo}</span>}
        <span className="escudo-equipo-siglas">{iniciales}</span>
      </span>
      {id !== undefined && <span className="escudo-equipo-registro" aria-hidden="true">{id}</span>}
    </span>
  );
}
