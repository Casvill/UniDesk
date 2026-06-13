import { Socket } from "socket.io";
import { auth } from "../config/firebase.js"; // Note: I used firebase.ts in the previous turn, but I should check the export
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedSocket extends Socket {
  user?: DecodedIdToken;
}

/**
 * Middleware de Socket.IO para verificar el token de Firebase.
 * El token debe enviarse en el objeto `auth` al conectar.
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
