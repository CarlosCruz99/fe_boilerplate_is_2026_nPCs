import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegistroPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="auth-card w-full max-w-md">
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