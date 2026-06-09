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

  if (!token) {
    console.error(`Socket ${socket.id}: Intento de conexión sin token`);
    return next(new Error("Authentication error: Token required"));
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    socket.user = decodedToken;
    console.log(`Socket ${socket.id}: Autenticado como ${decodedToken.email}`);
    next();
  } catch (error) {
    console.error(`Socket ${socket.id}: Token inválido`, error);
    next(new Error("Authentication error: Invalid token"));
  }
}
