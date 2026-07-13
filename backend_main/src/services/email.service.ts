import { db } from "../config/firebase";

const USERS_COLLECTION = "users";

/**
 * Verifica si un correo electrónico está disponible (no registrado por otro
 * usuario). El correo se normaliza a minúsculas y sin espacios antes de
 * consultar Firestore.
 *
 * @param email - Correo electrónico a verificar
 * @param excludeUid - UID del usuario actual para excluirlo de la verificación
 *   (útil al actualizar el propio perfil, donde el correo ya le pertenece)
 * @returns `true` si el correo está disponible, `false` si ya lo usa otro usuario
 */
export async function checkEmailAvailability(email: string, excludeUid?: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where("email", "==", normalized)
    .get();

  if (snapshot.empty) return true;

  if (excludeUid && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeUid) {
    return true;
  }
  return false;
}
