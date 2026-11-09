/** Datos que BE-16.1 envía a AvisosService para JORNADA_PUBLICADA.
 * H19 definirá el endpoint de lectura; este tipo no supone que ya exista.
 */
export type AvisoCalendarioPublicado = {
  id: number;
  tipo: "JORNADA_PUBLICADA";
  moduloOrigen: "CALENDARIO";
  titulo: string;
  mensaje: string;
  creadoEn: string;
  leidoEn: string | null;
  referenciaTipo: "JORNADA";
  referenciaId: number;
  datos: {
    jornada: number;
    rival: string;
    fecha: string;
    hora: string;
    cancha: string;
  };
};
