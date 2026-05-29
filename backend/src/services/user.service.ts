import { db, auth } from "../config/firebase";
import { UserProfile, CreateUserDTO, UpdateUserDTO } from "../types/user.types";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeUsername, getUsernameDocRef } from "./username.service";

const USERS_COLLECTION = "users";

/**
 * (C) Crea un perfil de usuario en Firestore.
 * 
 * @param data - Datos iniciales del usuario (uid, email, username, ...)
 * @returns El perfil de usuario creado con timestamps
 */
export async function createUserProfile(data: CreateUserDTO): Promise<UserProfile> {
  const usernameRef = getUsernameDocRef(normalizeUsername(data.username));
  const usernameDoc = await usernameRef.get();

  if (usernameDoc.exists) {
    throw new Error("El username ya está en uso");
  }
  
  const now = Timestamp.now();
  const userProfile: UserProfile = {
    ...data,
    username: normalizeUsername(data.username),
    createdAt: now,
    updatedAt: now,
  };

  const userRef = db.collection(USERS_COLLECTION).doc(data.uid);

  const batch = db.batch();
  batch.set(userRef, userProfile);
  batch.create(usernameRef, { uid: data.uid });
  await batch.commit();

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

  const currentData = doc.data() as UserProfile;

  if (data.username) {
    const normalized = normalizeUsername(data.username);

    if (normalized !== currentData.username) {
      const usernameDoc = await getUsernameDocRef(normalized).get();
      if (usernameDoc.exists) {
        throw new Error("El username ya está en uso");
      }

      const updated = {
        ...data,
        username: normalized,
        updatedAt: Timestamp.now(),
      };

      const batch = db.batch();
      batch.update(docRef, updated);
      batch.delete(getUsernameDocRef(currentData.username));
      batch.create(getUsernameDocRef(normalized), { uid });
      await batch.commit();

      return { ...currentData, ...updated };
    }
  }

  const updated = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  await docRef.update(updated);
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

  const { username } = doc.data() as UserProfile;

  const batch = db.batch();
  batch.delete(docRef);
  batch.delete(getUsernameDocRef(username));
  await batch.commit();
  await auth.deleteUser(uid);
}