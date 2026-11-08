export function idValido(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}
