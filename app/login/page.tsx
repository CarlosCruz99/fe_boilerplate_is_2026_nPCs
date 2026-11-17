import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="auth-layout">
      <section className="auth-story" aria-labelledby="lema-login">
        <p className="eyebrow"><span className="status-dot" /> LA PASIÓN NO SE QUEDA EN LA GRADA</p>
        <h1 id="lema-login">ESTO ES<br />MÁS QUE<br /><em>FÚTBOL.</em></h1>
        <p>Tu equipo. Tu gente. Tu próxima victoria.<br />El lugar donde empieza cada jornada.</p>
        <div className="story-caption"><span>01 /</span> EL JUEGO LO HACEMOS TODOS <span aria-hidden="true">↗</span></div>
      </section>
      <section className="auth-card auth-login" aria-labelledby="login-titulo">
        <div className="auth-card-top"><span className="eyebrow">ACCESO A LA LIGA</span><span aria-hidden="true">↗</span></div>
        <h2 id="login-titulo">Vuelve al juego.</h2>
        <p className="auth-description">Tu próxima jornada empieza aquí.</p>
        <LoginForm />
        <p className="auth-switch">¿No tienes una cuenta? <Link href="/registro">Crea una cuenta <span aria-hidden="true">↗</span></Link></p>
        <div className="auth-card-bottom"><span aria-hidden="true">◈</span> TU LIGA, SIEMPRE CONTIGO</div>
      </section>
    </main>
  );
}
