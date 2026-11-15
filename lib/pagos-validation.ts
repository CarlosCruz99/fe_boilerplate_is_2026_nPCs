export function hoySalvador() {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
export function centavos(monto: string): number | null {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(monto)) return null;
  const [entero, decimal = ""] = monto.split(".");
  return Number(entero) * 100 + Number(decimal.padEnd(2, "0"));
}
export function validarPago(monto: string, fecha: string, archivo: File | null, disponible?: string) {
  const valor = centavos(monto);
  if (valor === null || valor <= 0) return "Ingresa un monto positivo con máximo dos decimales.";
  if (disponible !== undefined && (centavos(disponible) === null || valor > centavos(disponible)!)) return "El monto no puede superar el disponible de la cuota.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(Date.parse(fecha)) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha || fecha > hoySalvador()) return "Ingresa una fecha válida que no sea futura en El Salvador.";
  if (!archivo || archivo.size === 0) return "Adjunta un comprobante obligatorio.";
  if (archivo.size > 5 * 1024 * 1024) return "El comprobante no debe superar 5 MiB.";
  const formatos: Record<string, RegExp> = { "application/pdf": /\.pdf$/i, "image/jpeg": /\.jpe?g$/i, "image/png": /\.png$/i };
  if (!formatos[archivo.type]?.test(archivo.name)) return "El comprobante debe ser PDF, JPG o PNG.";
  return null;
}
