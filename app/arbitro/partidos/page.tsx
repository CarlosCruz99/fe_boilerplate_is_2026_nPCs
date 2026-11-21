import { RutaProtegida } from "@/components/auth/ruta-protegida";
import { SelectorPartidoArbitro } from "./selector-partido-arbitro";

export default function PartidosArbitroPage() {
  return (
    <RutaProtegida rolesPermitidos={["ARBITRO"]}>
      <SelectorPartidoArbitro />
    </RutaProtegida>
  );
}
