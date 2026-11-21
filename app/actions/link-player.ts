"use server";

import { obtenerSesion } from "@/app/actions/session";
import { getSession } from "@/lib/session";

export type VincularFichaState = {
  error?: string;
  exito?: string;
  values?: {
    identificacion: string;
    fechaNacimiento: string;
  };
};

export async function vincularFicha(
  _prevState: VincularFichaState,
  formData: FormData,
): Promise<VincularFichaState> {
  const identificacion = String(
    formData.get("identificacion") ?? "",
  ).trim();

  const fechaNacimiento = String(
    formData.get("fechaNacimiento") ?? "",
  ).trim();

  const values = { identificacion, fechaNacimiento };

  try {
    // Comprobamos la sesión y el rol también en el servidor.
    const sesion = await obtenerSesion();

    if (sesion.estado === "error") {
      return { error: sesion.mensaje, values };
    }

    if (sesion.estado === "sin-sesion") {
      return {
        error: "Inicia sesión para vincular tu ficha.",
        values,
      };
    }

    if (sesion.usuario.rol !== "JUGADOR") {
      return {
        error: "No tienes permiso para esta acción.",
        values,
      };
    }

    if (!identificacion || !fechaNacimiento) {
      return { error: "Completa ambos campos.", values };
    }

    const accessToken = await getSession();

    if (!accessToken) {
      return {
        error: "Inicia sesión para vincular tu ficha.",
        values,
      };
    }

    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error("Falta la variable de entorno API_URL.");
    }

    const res = await fetch(
      new URL("jugadores/vincular", apiUrl.replace(/\/?$/, "/")),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          identificacion,
          fechaNacimiento,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (res.status === 400) {
      return { error: "Revisa los datos ingresados.", values };
    }

    if (res.status === 401) {
      return {
        error: "Tu sesión expiró. Inicia sesión nuevamente.",
        values,
      };
    }

    if (res.status === 403) {
      return {
        error: "No tienes permiso para esta acción.",
        values,
      };
    }

    if (res.status === 404) {
      const data: { message?: string } = await res.json();

      return {
        error:
          typeof data.message === "string"
            ? data.message
            : "No encontramos una ficha con esos datos.",
        values,
      };
    }

    if (res.status === 409) {
      return { error: "Esa ficha ya está vinculada.", values };
    }

    if (res.status !== 200) {
      throw new Error(`jugadores/vincular respondió ${res.status}`);
    }

    return { exito: "Tu ficha quedó vinculada." };
  } catch (error) {
    console.error("No se pudo completar la vinculación:", error);

    return {
      error: "No pudimos completar la vinculación. Intenta nuevamente.",
      values,
    };
  }
}