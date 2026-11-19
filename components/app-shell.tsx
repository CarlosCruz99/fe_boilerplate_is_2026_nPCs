"use client";

import Link from "next/link";
import Image from "next/image";
import strikersLogo from "@/public/media/Strikers_Logo.png";
import { FootballScene } from "@/components/football-scene";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { logout } from "@/app/actions/auth";
import { accesosUsuario, nombresRol } from "@/lib/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const publica = pathname === "/login" || pathname === "/registro";
  const accesos = usuario && !publica ? [{ href: "/", titulo: "Inicio" }, ...accesosUsuario(usuario), { href: "/partidos", titulo: "Marcadores" }, { href: "/posiciones", titulo: "Posiciones" }] : [{ href: "/partidos", titulo: "Marcadores" }, { href: "/posiciones", titulo: "Posiciones" }, { href: "/login", titulo: "Iniciar sesión" }];

  return <>
    <FootballScene />
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className={`app-header ${publica ? "public-header" : ""}`}>
      <div className="app-header-inner">
        <Link href={publica ? "/login" : "/"} className="brand" aria-label="Strikers by NPCs · Inicio">
          <Image className="brand-logo" src={strikersLogo} alt="" width={strikersLogo.width} height={strikersLogo.height} preload />
          <span>Strikers<small>by NPCs</small></span>
        </Link>
        {usuario && !publica ? <div className="app-account">
          <span>{usuario.nombre} · {nombresRol[usuario.rol]}</span>
          <form action={logout}><button type="submit">Cerrar sesión</button></form>
        </div> : <span className="eyebrow">Fútbol local. Pasión sin límites.</span>}
      </div>
      {accesos.length > 0 && <nav className="app-nav" aria-label="Navegación principal">
        {accesos.map(({ href, titulo }) => <Link key={href} href={href}
          aria-current={(href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)) ? "page" : undefined}>
          {titulo}
        </Link>)}
      </nav>}
    </header>
    <div id="contenido" tabIndex={-1} className={`app-content ${publica ? "public-content" : ""}`}><div className="route-transition">{children}</div></div>
    <footer className="app-footer"><span>Strikers by NPCs</span><span>El fútbol se vive. Cada jornada cuenta.</span></footer>
  </>;
}
