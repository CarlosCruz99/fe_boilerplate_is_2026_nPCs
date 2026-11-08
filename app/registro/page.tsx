import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegistroPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
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