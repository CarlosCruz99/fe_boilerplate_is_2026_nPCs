export function idValido(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}
export function fechaValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const date = new Date(`${fecha}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === fecha &&
    fecha <= new Date().toISOString().slice(0, 10)
  );
}
export function validarFoto(foto: File | null) {
  if (!foto || !foto.size) return "La foto es obligatoria.";
  if (!["image/jpeg", "image/png"].includes(foto.type))
    return "La foto debe ser JPG o PNG.";
  if (foto.size > 2 * 1024 * 1024) return "La foto supera los 2 MiB.";
  return null;
}
export function validarJugador(form: FormData) {
  const nombre = String(form.get("nombreCompleto") ?? "").trim();
  if (nombre.length < 3 || nombre.length > 120)
    return "El nombre debe tener entre 3 y 120 caracteres.";
  if (!/^[A-Za-z0-9-]{5,20}$/.test(String(form.get("identificacion") ?? "")))
    return "La identificación debe tener entre 5 y 20 letras, números o guiones.";
  if (!fechaValida(String(form.get("fechaNacimiento") ?? "")))
    return "Ingresa una fecha válida y no futura.";
  const foto = form.get("foto");
  return validarFoto(foto instanceof File ? foto : null);
}
