import { db } from "../config/firebase";

const USERS_COLLECTION = "users";

/**
 * Normaliza un username eliminando espacios y convirtiéndolo a minúsculas.
 *
 * Esto asegura que usernames como "Juan Cortes", "juancortes" y " JUAN  CORTES "
 * sean tratados como equivalentes.
 *
 * @param username - Username original
 * @returns Username normalizado
 */
function normalizeUsername(username: string): string {
  return username.toLowerCase().trim().replace(/\s+/g, "");
}

/**
 * Verifica si un username está disponible en la colección de usuarios.
 *
 * El username se normaliza (minúsculas, sin espacios) antes de consultar
 * en Firestore para garantizar consistencia en la comparación.
 *
 * @param username - Nombre de usuario a validar
 * @returns `true` si el username está disponible, `false` si ya está en uso
 * @throws Error si el username está vacío o es inválido
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  if (!username || username.trim().length === 0) {
    throw new Error("El username no puede estar vacío");
  }

  const normalized = normalizeUsername(username);

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where("username", "==", normalized)
    .limit(1)
    .get();

  return snapshot.empty;
}

export { normalizeUsername };