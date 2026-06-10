import { db } from "../config/firebase";

const USERS_COLLECTION = "users";

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
