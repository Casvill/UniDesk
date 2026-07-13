import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    } as admin.ServiceAccount),
  });
}

/**
 * Instancia de Firestore inicializada con las credenciales del proyecto,
 * usada para persistir y consultar mensajes y perfiles.
 */
export const db = admin.firestore();

/**
 * Instancia de Firebase Auth para verificar tokens de ID emitidos a los clientes.
 */
export const auth = admin.auth();

