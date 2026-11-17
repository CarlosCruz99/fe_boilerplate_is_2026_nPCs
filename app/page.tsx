"use client";

import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { useAuth } from "@/contexts/auth-context";
import { accesosUsuario, nombresRol } from "@/lib/navigation";
import Link from "next/link";

function ContenidoInicio() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return <main className="league-page">
    <header className="dashboard-hero">
      <p className="eyebrow">Tu espacio en la liga · {nombresRol[usuario.rol]}</p>
      <h1>EL JUEGO<br /><em>CONTINÚA.</em></h1>
      <p className="dashboard-welcome">Bienvenido, {usuario.nombre}.</p>
      <p>{usuario.rol === "ORGANIZADOR" ? "Todo listo para la próxima jornada. Organiza los encuentros y mantén a tu liga en movimiento." : usuario.rol === "ARBITRO" ? "Cada decisión cuenta. Accede a la mesa de tu partido y lleva el control del encuentro." : "Vive cada jornada. Consulta tus partidos, gestiona tu equipo y sigue las novedades de la liga."}</p>
    </header>
    <section aria-labelledby="accesos-titulo" className="league-stack">
      <h2 id="accesos-titulo">Tu liga a un paso</h2>
      <div className="league-grid">
        {accesosUsuario(usuario).map((acceso, index) => <Link className="dashboard-card" key={acceso.href} href={acceso.href}>
          <div className="card-index"><span>0{index + 1}</span><span aria-hidden="true">↗</span></div>
          <h3>{acceso.titulo}</h3>
          <p>{acceso.descripcion}</p>
          <span>Ir a {acceso.titulo.toLowerCase()} <span aria-hidden="true">→</span></span>
        </Link>)}
      </div>
    </section>
  </main>;
}

export default function Home() {
  return <RutaProtegida><ContenidoInicio /></RutaProtegida>;
}
