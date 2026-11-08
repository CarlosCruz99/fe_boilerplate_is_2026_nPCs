import { cookies } from "next/headers";
import type { TokensSesion } from "@/types/auth";

export const SESSION_COOKIE = "session";
export const REFRESH_COOKIE = "refresh_session";

// Coincide con la configuración actual del backend: siete días.
const REFRESH_DURATION_SECONDS = 7 * 24 * 60 * 60;

export async function createSession(tokens: TokensSesion) {
  const cookieStore = await cookies();

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  cookieStore.set(SESSION_COOKIE, tokens.accessToken, {
    ...options,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...options,
    maxAge: REFRESH_DURATION_SECONDS,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}