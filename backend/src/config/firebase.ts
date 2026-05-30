import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * Instancia de Firestore inciializada con las credenciales del proyecto
 */
export const db = admin.firestore();

/**
 * Instancia de Firestore Auth para administrar usuarios y verificar tokens
 */
export const auth = admin.auth();

/**
 * Módulo de Firebase Admin inizializado
 */
export default admin;