import { getSession } from "@/lib/session";

export function enteroPositivoGaleria(valor: string): boolean {
  return /^[1-9]\d*$/.test(valor) && Number(valor) <= 2147483647;
}

export async function solicitarGaleria(ruta: string, range?: string | null) {
  const token = await getSession();
  if (!token) return new Response(null, { status: 401 });

  try {
    const base = process.env.API_URL;
    if (!base) return new Response(null, { status: 503 });

    const headers = new Headers({ Authorization: `Bearer ${token}` });
    if (range) headers.set("Range", range);

    return await fetch(new URL(ruta, base.replace(/\/?$/, "/")), {
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
