import { db, auth } from "../config/firebase";
import { UserProfile, CreateUserDTO, UpdateUserDTO } from "../types/user.types";
import admin from "../config/firebase";
import { normalizeUsername } from "./username.service";

const USERS_COLLECTION = "users";


/**
 * (C) Crea un perfil de usuario en Firestore.
 * 
 * @param data - Datos iniciales del usuario (uid, email, username, ...)
 * @returns El perfil de usuario creado con timestamps
 */
export async function createUserProfile(data: CreateUserDTO): Promise<UserProfile> {
  const now = admin.firestore.Timestamp.now();

  const userProfile: UserProfile = {
    ...data,
    username: normalizeUsername(data.username),
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(USERS_COLLECTION).doc(data.uid).set(userProfile);
  return userProfile;
}

/**
 * (R) Obtiene el perfil de un usuario por su UID.
 * 
 * @param uid - ID del usuario en Firebase Auth
 * @returns El perfil del usuario o null si no existe
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!doc.exists) return null;

  return doc.data() as UserProfile;
}

/**
 * (U) Actualiza parcialmente el perfil de un usuario.
 * 
 * @param uid - ID del usuario
 * @param data - Campos a actualizar
 * @throws Error si el usuario no existe
 * @returns El perfil actualizado
 */
export async function updateUserProfile(uid: string, data: UpdateUserDTO): Promise<UserProfile> {
  const docRef = db.collection(USERS_COLLECTION).doc(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Usuario con uid ${uid} no existe en Firestore`);
  }

  const updated = {
    ...data,
    ...(data.username && { username: normalizeUsername(data.username) }),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await docRef.update(updated);

  const currentData = doc.data() as UserProfile;
  return { ...currentData, ...updated };
}

/**
 * (D) Elimina el perfil del usuario en Firestore y también en Firebase Auth.
 * 
 * @param uid - ID del usuario
 * @throws Error si el usuario no existe en Firestore
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  const docRef = db.collection(USERS_COLLECTION).doc(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Usuario con uid ${uid} no existe en Firestore`);
  }

  await docRef.delete();
  await auth.deleteUser(uid);
}