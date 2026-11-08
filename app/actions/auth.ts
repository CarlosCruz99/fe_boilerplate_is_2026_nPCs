"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession, getRefreshToken,} from "@/lib/session";
import type { RespuestaLogin, TokensSesion } from "@/types/auth";

export type LoginState = {
  error?: string;
  email?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Llama a la API de autenticación. Devuelve el token si las credenciales son
// válidas, o null si la API responde 401/403.
// Devuelve ambos tokens o null si las credenciales son inválidas.
async function authenticate(email: string, password: string,): Promise<TokensSesion | null> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta la variable de entorno API_URL.");
  }

  const res = await fetch(
    new URL("auth/login", apiUrl.replace(/\/?$/, "/")),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  );

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`auth/login respondió ${res.status}`);
  }

  const data: RespuestaLogin = await res.json();

  if (
    typeof data.accessToken !== "string" ||
    !data.accessToken ||
    typeof data.refreshToken !== "string" ||
    !data.refreshToken ||
    typeof data.expiresIn !== "number" ||
    !Number.isFinite(data.expiresIn) ||
    data.expiresIn <= 0
  ) {
    throw new Error("La API devolvió datos de sesión inválidos.");
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña.", email };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Ingresa un correo válido.", email };
  }

  let tokens: TokensSesion | null;

  try {
    tokens = await authenticate(email, password);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return {
      error: "No se pudo iniciar sesión. Intenta más tarde.",
      email,
    };
  }

  if (!tokens) {
    return { error: "Correo o contraseña incorrectos.", email };
  }

  await createSession(tokens);
  redirect("/");
}

export async function logout() {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      const apiUrl = process.env.API_URL;

      if (!apiUrl) {
        throw new Error("Falta la variable de entorno API_URL.");
      }

      const res = await fetch(
        new URL("auth/logout", apiUrl.replace(/\/?$/, "/")),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        },
      );

      if (res.status !== 204) {
        throw new Error(`auth/logout respondió ${res.status}`);
      }
    }
  } catch (error) {
    console.error("No se pudo revocar la sesión en el backend:", error);
  }

  await deleteSession();
  redirect("/login");
}