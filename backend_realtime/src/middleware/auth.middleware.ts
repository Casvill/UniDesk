import { Socket } from "socket.io";
import { auth } from "../config/firebase.js";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Socket de Socket.IO extendido con el usuario decodificado cuando el token
 * de Firebase es válido.
 */
export interface AuthenticatedSocket extends Socket {
  user?: DecodedIdToken;
}

/**
 * Middleware de Socket.IO que verifica el token JWT de Firebase recibido en
 * `socket.handshake.auth.token` al conectar.
 *
 * Comprueba primero un formato mínimo (3 partes separadas por `.`) para
 * descartar tokens malformados sin llamar a Firebase. Si el token es válido,
 * asigna los datos decodificados a `socket.user` y llama a `next()`.
 * En caso contrario emite un `error` al cliente y desconecta el socket.
 *
 * @param socket - Socket entrante a autenticar
 * @param next - Función next de Socket.IO
 */
export async function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token;

  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    console.error(`Socket ${socket.id}: Intento de conexión con token malformado`);
    socket.emit("error", { message: "No está autenticado" });
    socket.disconnect(true);
    return;
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    socket.user = decodedToken;
    console.log(`Socket ${socket.id}: Autenticado como ${decodedToken.email}`);
    next();
  } catch (error: any) {
    // Only log if it's not the argument-error, as we've already handled malformed tokens
    if (error?.errorInfo?.code !== 'auth/argument-error') {
       console.error(`Socket ${socket.id}: Error de autenticación`, error);
    }
    
    socket.emit("error", { message: "No está autenticado" });
    socket.disconnect(true);
  }
}
