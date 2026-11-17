import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegistroPage() {
  return (
    <main className="auth-layout auth-register">
      <section className="auth-story"><p className="eyebrow">EL SIGUIENTE CAPÍTULO ES TUYO</p><h1>EL FÚTBOL<br />SE JUEGA<br /><em>EN EQUIPO.</em></h1><p>Hazte parte de la liga.<br />La cancha te está esperando.</p></section>
      <div className="auth-card w-full">
        <p className="eyebrow">Forma parte de la liga</p>
        <h1 className="mb-6 text-2xl font-semibold">
          Crear cuenta
        </h1>

        <RegisterForm />

        <p className="mt-6 text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}