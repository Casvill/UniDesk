import { createRoom, getRoomsByOwner, deleteRoomsByOwner } from "../services/room.service";
import { db } from "../config/firebase";

jest.mock("../config/firebase", () => ({
  db: {
    collection: jest.fn(),
    batch: jest.fn(),
  },
}));

jest.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

describe("room.service", () => {
  const mockBatchDelete = jest.fn();
  const mockBatchCommit = jest.fn();
  const mockWhere = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (db.batch as jest.Mock).mockReturnValue({
      delete: mockBatchDelete,
      commit: mockBatchCommit,
    });
  });

  describe("deleteRoomsByOwner", () => {
    it("debería borrar todas las salas del propietario usando un batch y retornarlas", async () => {
      const mockDocs = [
        { ref: "ref1", data: () => ({ id: "1", name: "Sala 1" }) },
        { ref: "ref2", data: () => ({ id: "2", name: "Sala 2" }) }
      ];
      mockGet.mockResolvedValue({
        empty: false,
        docs: mockDocs
      });
      mockWhere.mockReturnValue({ get: mockGet });
      const messagesMockGet = jest.fn().mockResolvedValue({ empty: true, docs: [] });
      const messagesMockWhere = jest.fn().mockReturnValue({ get: messagesMockGet });
      (db.collection as jest.Mock).mockImplementation((name: string) =>
        name === "messages" ? { where: messagesMockWhere } : { where: mockWhere }
      );

      const result = await deleteRoomsByOwner("owner-123");

      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(mockWhere).toHaveBeenCalledWith("ownerUid", "==", "owner-123");
      expect(mockBatchDelete).toHaveBeenCalledTimes(2);
      expect(mockBatchDelete).toHaveBeenCalledWith("ref1");
      expect(mockBatchDelete).toHaveBeenCalledWith("ref2");
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(result).toEqual([
        { id: "1", name: "Sala 1" },
        { id: "2", name: "Sala 2" }
      ]);
    });

    it("debería retornar un array vacío si el propietario no tiene salas", async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: []
      });
      mockWhere.mockReturnValue({ get: mockGet });
      (db.collection as jest.Mock).mockReturnValue({ where: mockWhere });

      const result = await deleteRoomsByOwner("owner-empty");

      expect(mockBatchCommit).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
