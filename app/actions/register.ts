//Se leen los campos que tendra el formulario, comprueba que esten completos,
//que las contraseñas coincidan. El backend valida los formatos y envía 
//los errores corrrespondientes establecidos en el Jira

"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

export type RegistroState = {
  error?: string;
  values?: {
    nombre: string;
    email: string;
    fechaNacimiento: string;
  };
};

export async function registrar(
  _prevState: RegistroState,
  formData: FormData,
): Promise<RegistroState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const fechaNacimiento = String(
    formData.get("fechaNacimiento") ?? "",
  ).trim();

  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(
    formData.get("confirmarPassword") ?? "",
  );

  const values = { nombre, email, fechaNacimiento };

  if (
    !nombre ||
    !email ||
    !fechaNacimiento ||
    !password ||
    !confirmarPassword
  ) {
    return { error: "Completa todos los campos.", values };
  }

  if (password !== confirmarPassword) {
    return { error: "Las contraseñas no coinciden.", values };
  }

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error("Falta la variable de entorno API_URL.");
    }

    const res = await fetch(
      new URL("users", apiUrl.replace(/\/?$/, "/")),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          fechaNacimiento,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (res.status === 400) {
      return { error: "Revisa los datos ingresados.", values };
    }

    if (res.status === 409) {
      return { error: "Este correo ya está registrado.", values };
    }

    if (res.status !== 201) {
      throw new Error(`users respondió ${res.status}`);
    }

    const accessToken = res.headers.get("X-Access-Token");
    const refreshToken = res.headers.get("X-Refresh-Token");
    const expiresIn = Number(res.headers.get("X-Token-Expires-In"));

    if (
      !accessToken ||
      !refreshToken ||
      !Number.isFinite(expiresIn) ||
      expiresIn <= 0
    ) {
      throw new Error("El registro no devolvió los tokens esperados.");
    }

    await createSession({
      accessToken,
      refreshToken,
      expiresIn,
    });
  } catch (error) {
    console.error("No se pudo completar el registro:", error);

    return {
      error:
        "No pudimos completar el registro. Si tu cuenta ya fue creada, intenta iniciar sesión.",
      values,
    };
  }

  redirect("/");
}