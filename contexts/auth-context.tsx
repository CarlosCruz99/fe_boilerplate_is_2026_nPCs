"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { obtenerSesion } from "@/app/actions/session";
import type {
  ResultadoSesion,
  Rol,
  UsuarioSesion,
} from "@/types/auth";

type AuthContextValue = {
  estado: "cargando" | ResultadoSesion["estado"];
  usuario: UsuarioSesion | null;
  rol: Rol | null;
  equipoActualId: number | null;
  capitaneaEquipoId: number | null;
  mensaje: string | null;
  actualizarSesion: () => Promise<void>;
};

type LecturaSesion = {
  ambito: object;
  resultado: ResultadoSesion;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publica = pathname === "/login" || pathname === "/registro";
  // La identidad cambia solo al entrar/salir del acceso público, no en cada menú.
  const ambito = useMemo(() => ({ publica }), [publica]);
  const [lectura, setLectura] = useState<LecturaSesion | null>(null);
  const peticion = useRef<{ ambito: object; promesa: Promise<ResultadoSesion> } | null>(null);

  const actualizarSesion = useCallback(async () => {
    if (ambito.publica) return;
    if (peticion.current?.ambito !== ambito) {
      peticion.current = {
        ambito,
        promesa: obtenerSesion().catch((): ResultadoSesion => ({
          estado: "error", mensaje: "No pudimos comprobar tu sesión. Intenta nuevamente.",
        })),
      };
    }
    const solicitud = peticion.current;
    const resultado = await solicitud.promesa;
    // Una respuesta anterior a un cambio de cuenta no puede reemplazar la nueva.
    if (peticion.current === solicitud) {
      setLectura(anterior =>
        resultado.estado === "error" && anterior?.ambito === ambito && anterior.resultado.estado === "autenticado"
          ? anterior // Un fallo transitorio al revalidar no desmonta formularios en uso.
          : { ambito, resultado },
      );
      peticion.current = null;
    }
  }, [ambito]);

  useEffect(() => {
    void actualizarSesion();
    if (publica) return;
    const revisar = () => { if (document.visibilityState === "visible") void actualizarSesion(); };
    const intervalo = window.setInterval(revisar, 60_000);
    window.addEventListener("focus", revisar);
    document.addEventListener("visibilitychange", revisar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", revisar);
      document.removeEventListener("visibilitychange", revisar);
    };
  }, [publica, actualizarSesion]);

  // La UI conserva la sesión mientras se navega. Cada acción sigue autorizándose
  // en el servidor; este estado no es una caché de permisos de la API.
  const resultado: ResultadoSesion | null = publica ? { estado: "sin-sesion" }
    : lectura?.ambito === ambito ? lectura.resultado : null;

  const usuario =
    resultado?.estado === "autenticado" ? resultado.usuario : null;

  const value: AuthContextValue = {
    estado: resultado?.estado ?? "cargando",
    usuario,
    rol: usuario?.rol ?? null,
    equipoActualId: usuario?.equipoActualId ?? null,
    capitaneaEquipoId: usuario?.capitaneaEquipoId ?? null,
    mensaje: resultado?.estado === "error" ? resultado.mensaje : null,
    actualizarSesion,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}