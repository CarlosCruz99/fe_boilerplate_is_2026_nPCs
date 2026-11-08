import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <main className="w-full max-w-sm rounded-xl border border-zinc-200 p-8 dark:border-zinc-800">
        <h1 className="mb-6 text-2xl font-semibold">Iniciar sesión</h1>
        <LoginForm />
        <p className="mt-6 text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/registro" className="underline">
            Crea una cuenta
          </Link>
        </p>
      </main>
    </div>
  );
}
