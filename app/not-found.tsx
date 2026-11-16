import Link from "next/link";

export default function NotFound() {
  return <main className="league-page">
    <section className="league-card">
      <p className="eyebrow">Fuera de la cancha · 404</p>
      <h1>No encontramos esta página</h1>
      <p>El enlace puede haber cambiado. Vuelve al inicio para encontrar tu equipo y tus partidos.</p>
      <Link href="/" className="league-link league-primary">Volver al inicio</Link>
    </section>
  </main>;
}
