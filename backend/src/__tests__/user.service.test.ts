import { getUserProfile, updateUserProfile, deleteUserProfile } from "../services/user.service";

jest.mock("../config/firebase", () => ({
  db: { collection: jest.fn(), batch: jest.fn() },
  auth: { deleteUser: jest.fn() },
}));

jest.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })) },
}));

jest.mock("../services/username.service", () => ({
  normalizeUsername: (u: string) => u.toLowerCase().trim(),
  getUsernameDocRef: jest.fn(() => ({ get: jest.fn(), id: "mockref" })),
}));

import { db, auth } from "../config/firebase";

const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDocRef = { get: mockGet, update: mockUpdate, delete: mockDelete };
const mockCollection = db.collection as jest.Mock;
mockCollection.mockReturnValue({ doc: jest.fn(() => mockDocRef) });

const fakeProfile = {
  uid: "uid-123",
  username: "anacleto",
  email: "unidesk@test.com",
  displayName: "Anacleto",
  photoURL: "",
  provider: "password",
  createdAt: { seconds: 0, nanoseconds: 0 },
  updatedAt: { seconds: 0, nanoseconds: 0 },
};

describe("getUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el perfil si el documento existe", async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => fakeProfile });
    const result = await getUserProfile("uid-123");
    expect(result).toEqual(fakeProfile);
  });

  it("retorna null si el documento no existe", async () => {
    mockGet.mockResolvedValue({ exists: false });
    const result = await getUserProfile("uid-inexistente");
    expect(result).toBeNull();
  });
});

describe("updateUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lanza error si el usuario no existe", async () => {
    mockGet.mockResolvedValue({ exists: false });
    await expect(updateUserProfile("uid-123", { displayName: "Nuevo" })).rejects.toThrow(
      "Usuario con uid uid-123 no existe en Firestore"
    );
  });

  it("actualiza correctamente sin cambiar username", async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => fakeProfile });
    mockUpdate.mockResolvedValue(undefined);
    const result = await updateUserProfile("uid-123", { displayName: "Nuevo Nombre" });
    expect(result.displayName).toBe("Nuevo Nombre");
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("deleteUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lanza error si el usuario no existe", async () => {
    mockGet.mockResolvedValue({ exists: false });
    await expect(deleteUserProfile("uid-123")).rejects.toThrow(
      "Usuario con uid uid-123 no existe en Firestore"
    );
  });

  it("llama a deleteUser de Auth después de borrar Firestore", async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => fakeProfile });
    const mockBatchDelete = jest.fn();
    const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
    (db.batch as jest.Mock).mockReturnValue({
      delete: mockBatchDelete,
      commit: mockBatchCommit,
    });
    (auth.deleteUser as jest.Mock).mockResolvedValue(undefined);

    await deleteUserProfile("uid-123");

    expect(mockBatchCommit).toHaveBeenCalled();
    expect(auth.deleteUser).toHaveBeenCalledWith("uid-123");
  });
});