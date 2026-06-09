import { sendMessage, getMessagesByRoom, updateMessage, searchMessages } from "../services/message.service";
import { db } from "../config/firebase";

// 1. Mock dependencies
jest.mock("../config/firebase", () => ({
  db: { collection: jest.fn() },
}));

jest.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })) },
}));

// 2. Setup mocks for Firestore chain
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockOrderBy = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockStartAfter = jest.fn().mockReturnThis();
const mockDocRef = { set: mockSet, id: "msg_123" };

(db.collection as jest.Mock).mockReturnValue({
  doc: jest.fn(() => mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  startAfter: mockStartAfter,
  get: mockGet,
});

// 3. Define your test suite
describe("message.service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("sendMessage", () => {
    it("should successfully save a message to Firestore", async () => {
      const data = { roomId: "m47mRhpFv3W8nzojtNzx", senderUid: "AeGZNi7XzcMkw9eSTjE5FHaX0mg2", senderUsername: "jose", content: "hola cómo estás yo bien grasias a dios y tú" };
      const result = await sendMessage(data);

      expect(mockSet).toHaveBeenCalled();
      expect(result.id).toBe("msg_123");
      expect(result.content).toBe(data.content);
      });
  });

  describe("getMessagesByRoom", () => {
    it("should fetch messages with correct query parameters", async () => {
      mockGet.mockResolvedValue({ docs: [] });
      await getMessagesByRoom("r1");

      expect(mockWhere).toHaveBeenCalledWith("roomId", "==", "r1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "asc");
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it("should support pagination with startAfter", async () => {
      const mockDocGet = jest.fn().mockResolvedValue({ exists: true });
      (db.collection as jest.Mock).mockImplementation((col) => {
        if (col === "messages") {
          return {
            doc: jest.fn(() => ({ get: mockDocGet })),
            where: mockWhere,
            orderBy: mockOrderBy,
            limit: mockLimit,
            startAfter: mockStartAfter,
            get: mockGet,
          };
        }
        return {};
      });
      
      mockGet.mockResolvedValue({ docs: [] });
      await getMessagesByRoom("r1", 20, "last_msg_id");

      expect(mockStartAfter).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(20);
    });
  });

  describe("searchMessages", () => {
    it("should filter messages by search term in memory", async () => {
      const messages = [
        { id: "1", content: "apple pie", roomId: "r1" },
        { id: "2", content: "banana bread", roomId: "r1" },
        { id: "3", content: "apple cake", roomId: "r1" },
      ];
      mockGet.mockResolvedValue({
        docs: messages.map(m => ({ data: () => m }))
      });

      const result = await searchMessages("r1", "apple");

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("apple pie");
      expect(result[1].content).toBe("apple cake");
    });
  });

  describe("updateMessage", () => {
    it("should update an existing message", async () => {
      const mockUpdate = jest.fn();
      const mockDoc = jest.fn(() => ({ update: mockUpdate }));
      (db.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      await updateMessage("msg_123", "new content");

      expect(mockDoc).toHaveBeenCalledWith("msg_123");
      expect(mockUpdate).toHaveBeenCalledWith({ content: "new content" });
    });
  });
});
