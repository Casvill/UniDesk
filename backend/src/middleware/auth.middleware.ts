import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

/**
 * Middleware de autenticación que verifica el token JWT de Firebase
 * presente en el header Authorization (Bearer token).
 *
 * Si el token es válido, asigna los datos decodificados a `req.user`
 * y llama a `next()`. Si no hay token o es inválido, responde con 401.
 *
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token requerido" });
    return;
  }

  const token = header.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ message: "Token requerido" });
    return;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}
