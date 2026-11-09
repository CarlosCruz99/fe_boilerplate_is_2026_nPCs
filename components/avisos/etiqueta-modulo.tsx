import type { ModuloAviso } from "@/types/avisos";

const etiqueta: Record<ModuloAviso, string> = {
  CALENDARIO: "Calendario", PAGOS: "Pagos", RESULTADOS: "Resultados",
};
export function EtiquetaModulo({ modulo }: { modulo: ModuloAviso }) {
  return <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{etiqueta[modulo]}</span>;
}
