"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  ruta: string;
  resultado: ResultadoSesion;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [lectura, setLectura] = useState<LecturaSesion | null>(null);

  const peticion = useRef<Promise<ResultadoSesion> | null>(null);

  const actualizarSesion = useCallback(async () => {
    // Las llamadas simultáneas de este proveedor comparten una petición.
    if (!peticion.current) {
      peticion.current = obtenerSesion()
        .catch(
          (): ResultadoSesion => ({
            estado: "error",
            mensaje: "No pudimos comprobar tu sesión. Intenta nuevamente.",
          }),
        )
        .finally(() => {
          peticion.current = null;
        });
    }

    const resultado = await peticion.current;
    setLectura({ ruta: pathname, resultado });
  }, [pathname]);

  useEffect(() => {
    void actualizarSesion();
  }, [actualizarSesion]);

  // Al cambiar de página, esperamos la consulta de esa ruta.
  const resultado =
    lectura?.ruta === pathname ? lectura.resultado : null;

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