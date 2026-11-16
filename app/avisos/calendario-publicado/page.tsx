import { redirect } from "next/navigation";

// Los avisos publicados se consultan en la bandeja con datos reales.
export default function AvisoCalendarioPublicadoPage() {
  redirect("/avisos");
}
