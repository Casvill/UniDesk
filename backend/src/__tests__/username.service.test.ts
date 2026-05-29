import { checkUsernameAvailability, normalizeUsername } from "../services/username.service";

// Mock del módulo firebase config
jest.mock("../config/firebase", () => ({
  db: {
    collection: jest.fn(),
  },
  default: {},
  auth: {},
}));

import { db } from "../config/firebase";

const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet }));
const mockCollection = db.collection as jest.Mock;
mockCollection.mockReturnValue({ doc: mockDoc });

describe("normalizeUsername", () => {
  it("convierte a minúsculas", () => {
    expect(normalizeUsername("ANACLETO")).toBe("anacleto");
  });

  it("elimina espacios al inicio y al final", () => {
    expect(normalizeUsername("  anacleto  ")).toBe("anacleto");
  });

  it("elimina espacios internos", () => {
    expect(normalizeUsername("anac leto")).toBe("anacleto");
  });

  it("combina todas las normalizaciones", () => {
    expect(normalizeUsername("  AN AC LE TO  ")).toBe("anacleto");
  });
});

describe("checkUsernameAvailability", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna true si el username está disponible", async () => {
    mockGet.mockResolvedValue({ exists: false });
    const result = await checkUsernameAvailability("nuevouser");
    expect(result).toBe(true);
  });

  it("retorna false si el username ya existe", async () => {
    mockGet.mockResolvedValue({ exists: true });
    const result = await checkUsernameAvailability("anacletotest");
    expect(result).toBe(false);
  });

  it("lanza error si el username está vacío", async () => {
    await expect(checkUsernameAvailability("")).rejects.toThrow(
      "El username no puede estar vacío"
    );
  });

  it("normaliza el username antes de consultar", async () => {
    mockGet.mockResolvedValue({ exists: false });
    await checkUsernameAvailability("  ANACLETO  ");
    expect(mockDoc).toHaveBeenCalledWith("anacleto");
  });
});