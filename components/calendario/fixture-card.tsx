import type { ReactNode } from "react";
import { EscudoEquipo } from "@/components/equipos/escudo-equipo";
import type { EquipoBasico, EstadoPartido } from "@/types/calendario";

const fecha = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
const hora = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", hour: "2-digit", minute: "2-digit", hour12: false });
const estados = { PROGRAMADO: "Programado", EN_CURSO: "En curso", FINALIZADO: "Finalizado", CANCELADO: "Cancelado" };

function Equipo({ equipo }: { equipo: EquipoBasico }) {
  return <div className="fixture-team" title={equipo.nombre}>
    <EscudoEquipo nombre={equipo.nombre} id={equipo.id} />
    <strong>{equipo.nombre}</strong>
  </div>;
}

export function FixtureCard({ id, inicio, local, visitante, cancha, estado, children, footer, highlighted = false }: {
  id: number; inicio: string; local: EquipoBasico | null; visitante: EquipoBasico | null; cancha: string; estado: EstadoPartido;
  children: ReactNode; footer?: ReactNode; highlighted?: boolean;
}) {
  const duelo = `${local?.nombre ?? "Mi equipo"} vs. ${visitante?.nombre ?? "Mi equipo"}`;
  return <article className={`fixture-card ${highlighted ? "fixture-next" : ""}`} aria-label={duelo}>
    <header className="fixture-date"><time dateTime={inicio}>{fecha.format(new Date(inicio))}</time><strong>{hora.format(new Date(inicio))}</strong></header>
    <div className="fixture-body">
      <div className="fixture-match">
        {local ? <Equipo equipo={local} /> : <strong>Mi equipo</strong>}
        <span className="fixture-vs" aria-hidden="true">VS</span>
        {visitante ? <Equipo equipo={visitante} /> : <strong>Mi equipo</strong>}
        <h3 className="sr-only">{duelo}</h3>
      </div>
      <div className="fixture-actions">{children}</div>
    </div>
    <div className="fixture-venue"><span aria-hidden="true">⌖</span> {cancha}<span className={`fixture-state state-${estado.toLowerCase()}`}>Estado: {estados[estado]}</span></div>
    <footer className="fixture-footer">{footer}<span className="fixture-id">PARTIDO / {String(id).padStart(3, "0")}</span></footer>
  </article>;
}
