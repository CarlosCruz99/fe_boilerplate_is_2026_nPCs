"use server";

import {
  createSession,
  deleteSession,
  getRefreshToken,
  getSession,
} from "@/lib/session";
import type {
  ResultadoSesion,
  TokensSesion,
  UsuarioSesion,
} from "@/types/auth";

function apiUrl(path: string) {
  const base = process.env.API_URL;

  if (!base) {
    throw new Error("Falta la variable de entorno API_URL.");
  }

  return new URL(path, base.replace(/\/?$/, "/"));
}

async function consultarUsuario(accessToken: string) {
  return fetch(apiUrl("auth/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
}

async function sinSesion(): Promise<ResultadoSesion> {
  await deleteSession();
  return { estado: "sin-sesion" };
}

async function leerUsuario(res: Response): Promise<ResultadoSesion> {
  if (res.status === 401) {
    return sinSesion();
  }

  if (!res.ok) {
    throw new Error(`auth/me respondió ${res.status}`);
  }

  const usuario: UsuarioSesion = await res.json();
  return { estado: "autenticado", usuario };
}

export async function obtenerSesion(): Promise<ResultadoSesion> {
  try {
    const accessToken = await getSession();

    if (accessToken) {
      const res = await consultarUsuario(accessToken);

      if (res.status !== 401) {
        return await leerUsuario(res);
      }
    }

    // Sin access token válido, intentamos renovar la sesión.
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return await sinSesion();
    }

    const res = await fetch(apiUrl("auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 401) {
      return await sinSesion();
    }

    if (!res.ok) {
      throw new Error(`auth/refresh respondió ${res.status}`);
    }

    const tokens: TokensSesion = await res.json();

    if (
      typeof tokens.accessToken !== "string" ||
      !tokens.accessToken ||
      typeof tokens.refreshToken !== "string" ||
      !tokens.refreshToken ||
      typeof tokens.expiresIn !== "number" ||
      !Number.isFinite(tokens.expiresIn) ||
      tokens.expiresIn <= 0
    ) {
      throw new Error("La API devolvió datos de sesión inválidos.");
    }

    await createSession(tokens);

    const usuarioResponse = await consultarUsuario(tokens.accessToken);
    return await leerUsuario(usuarioResponse);
  } catch (error) {
    console.error("No se pudo consultar la sesión:", error);

    return {
      estado: "error",
      mensaje: "No pudimos comprobar tu sesión. Intenta nuevamente.",
    };
  }
}