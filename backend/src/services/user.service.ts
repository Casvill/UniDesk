import { db, auth } from "../config/firebase";
import { UserProfile, CreateUserDTO, UpdateUserDTO } from "../types/user.types";
import admin from "../config/firebase";

const USERS_COLLECTION = "users";

export async function createUserProfile(data: CreateUserDTO): Promise<UserProfile> {
  const now = admin.firestore.Timestamp.now();

  const userProfile: UserProfile = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(USERS_COLLECTION).doc(data.uid).set(userProfile);
  return userProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!doc.exists) return null;

  return doc.data() as UserProfile;
}

export async function updateUserProfile(uid: string, data: UpdateUserDTO): Promise<UserProfile> {
  const docRef = db.collection(USERS_COLLECTION).doc(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Usuario con uid ${uid} no existe en Firestore`);
  }

  const updated = {
    ...data,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await docRef.update(updated);

  const updatedDoc = await docRef.get();
  return updatedDoc.data() as UserProfile;
}

