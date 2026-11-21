import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { subirArchivoGaleria } from "@/lib/galeria-upload";
class XhrFalso {
  static actual: XhrFalso;
  upload = { onprogress: null as null | ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) };
  onload?: () => void; onerror?: () => void; ontimeout?: () => void;
  status = 200; responseText = ""; timeout = 0;
  open = vi.fn(); send = vi.fn();
  constructor() { XhrFalso.actual = this; }
}
beforeEach(() => vi.stubGlobal("XMLHttpRequest", XhrFalso));
afterEach(() => vi.unstubAllGlobals());
const foto = () => new File(["png"], "foto.png", { type: "image/png" });
it("informa bytes reales sin resolver antes de la respuesta", async () => {
  const progreso = vi.fn(); const confirmado = vi.fn();
  const pendiente = subirArchivoGaleria(5, foto(), "Gol", progreso).then(confirmado);
  expect(XhrFalso.actual.open).toHaveBeenCalledWith("POST", "/api/partidos/5/galeria");
  expect(XhrFalso.actual.send.mock.calls[0][0].get("archivos[]").name).toBe("foto.png");
  XhrFalso.actual.upload.onprogress!({ lengthComputable: true, loaded: 50, total: 100 });
  expect(progreso).toHaveBeenCalledWith(50);
  XhrFalso.actual.upload.onprogress!({ lengthComputable: true, loaded: 100, total: 100 });
  await Promise.resolve(); expect(confirmado).not.toHaveBeenCalled();
  XhrFalso.actual.responseText = JSON.stringify({ partidoId: 5, totalActivos: 1, limite: 30, resultados: [{ nombre: "foto.png", estado: "PUBLICADO", contenidoId: "uuid" }] });
  XhrFalso.actual.onload!(); await pendiente; expect(confirmado).toHaveBeenCalledOnce();
});
it("rechaza respuesta de otro partido y conserva errores de permiso", async () => {
  const pendiente = subirArchivoGaleria(5, foto(), "", vi.fn());
  XhrFalso.actual.responseText = JSON.stringify({ partidoId: 9, resultados: [] }); XhrFalso.actual.onload!();
  await expect(pendiente).rejects.toThrow("no confirmó");
  const permiso = subirArchivoGaleria(5, foto(), "", vi.fn());
  XhrFalso.actual.status = 403; XhrFalso.actual.responseText = JSON.stringify({ error: "No tienes permiso" }); XhrFalso.actual.onload!();
  await expect(permiso).rejects.toThrow("No tienes permiso");
});
it("un fallo de red permite reintentar sin confirmar publicación", async () => {
  const pendiente = subirArchivoGaleria(5, foto(), "", vi.fn()); XhrFalso.actual.onerror!();
  await expect(pendiente).rejects.toThrow("Fallo de red");
});
