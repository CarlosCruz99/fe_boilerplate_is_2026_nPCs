import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archivo: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const { archivo } = await params;
  if (!/^[1-9]\d*\.(jpg|png)$/.test(archivo))
    return new Response(null, { status: 404, headers });
  const token = await getSession();
  if (!token) return new Response(null, { status: 401, headers });
  try {
    const base = process.env.API_URL;
    if (!base) throw new Error("Falta API_URL");
    const res = await fetch(new URL(`/uploads/jugadores/${archivo}`, base), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return new Response(null, { status: res.status, headers });
    const type = res.headers.get("Content-Type")?.split(";")[0];
    if (type !== "image/jpeg" && type !== "image/png")
      return new Response(null, { status: 502, headers });
    return new Response(res.body, {
      headers: { ...headers, "Content-Type": type },
    });
  } catch {
    return new Response(null, { status: 502, headers });
  }
}
