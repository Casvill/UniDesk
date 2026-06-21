import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Middleware de Express para verificar el token de Firebase.
 * El token debe enviarse en el header `Authorization: Bearer <token>`.
 */
export async function httpAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error(`HTTP Request: Falta el token de autenticación`);
    return res.status(401).json({ error: "Authentication error: Token required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error(`HTTP Request: Token mal formado`);
    return res.status(401).json({ error: "Authentication error: Token malformed" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    console.log(`HTTP Request: Autenticado como ${decodedToken.email}`);
    next();
  } catch (error) {
    console.error(`HTTP Request: Token inválido`, error);
    return res.status(401).json({ error: "Authentication error: Invalid token" });
  }
}
