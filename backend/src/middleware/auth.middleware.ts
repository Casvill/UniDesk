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
