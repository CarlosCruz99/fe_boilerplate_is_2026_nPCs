"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { logout } from "@/app/actions/auth";
import { accesosUsuario, nombresRol } from "@/lib/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const publica = pathname === "/login" || pathname === "/registro";
  const accesos = usuario && !publica ? [{ href: "/", titulo: "Inicio" }, ...accesosUsuario(usuario)] : [];

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="app-header">
      <div className="app-header-inner">
        <Link href={publica ? "/login" : "/"} className="brand" aria-label="nPCs · Inicio">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nPCs<small>LIGA AMATEUR</small></span>
        </Link>
        {usuario && !publica ? <div className="app-account">
          <span>{usuario.nombre} · {nombresRol[usuario.rol]}</span>
          <form action={logout}><button type="submit">Cerrar sesión</button></form>
        </div> : <span className="eyebrow">Tu liga, en un solo lugar</span>}
      </div>
      {accesos.length > 0 && <nav className="app-nav" aria-label="Navegación principal">
        {accesos.map(({ href, titulo }) => <Link key={href} href={href}
          aria-current={(href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)) ? "page" : undefined}>
          {titulo}
        </Link>)}
      </nav>}
    </header>
    <div id="contenido" tabIndex={-1} className="app-content">{children}</div>
    <footer className="app-footer">nPCs · Liga amateur · Cada jornada cuenta.</footer>
  </>;
}
