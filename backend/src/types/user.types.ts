export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: "password" | "google.com";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export type CreateUserDTO = Omit<UserProfile, "createdAt" | "updatedAt">;

export type UpdateUserDTO = Partial<Pick<UserProfile, "username" | "displayName" | "photoURL">>;