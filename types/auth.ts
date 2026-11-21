//Solo admitiremos cualquiera de estos 3 roles definidos por el backend
export type Rol = "JUGADOR" | "ARBITRO" | "ORGANIZADOR";

// Usuario devuelto al registrar una cuenta.
export type UsuarioRegistrado = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

// Datos devueltos por GET /auth/me.
export type UsuarioSesion = UsuarioRegistrado & {
  equipoActualId: number | null;
  capitaneaEquipoId: number | null;
};
//Como detalle, number | null representa cuentas que no tienen equipo o capitan

// Credenciales devueltas por login y renovación.
export type TokensSesion = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

// El usuario del login tiene una estructura diferente a /auth/me.
export type RespuestaLogin = TokensSesion & {
  user: {
    id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  };
};

//Sirve para poder distinguir una sesion existente de un problema de conexion
export type ResultadoSesion =
  | { estado: "autenticado"; usuario: UsuarioSesion }
  | { estado: "sin-sesion" }
  | { estado: "error"; mensaje: string };