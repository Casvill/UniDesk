import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

// Client 1: Joins a room
const client1 = io(SERVER_URL);
// Client 2: Joins the same room
const client2 = io(SERVER_URL);

const ROOM_ID = "test-room-123";

client1.on("connect", () => {
  console.log("Client 1 connected");

  // Client 1 listens for presence changes
  client1.on("presence-change", (data) => {
    console.log("Client 1 received presence update:", data);
  });

  // Client 1 joins the room
  client1.emit("join-room", { roomId: ROOM_ID, uid: "user1", username: "Alice" });
});

client2.on("connect", () => {
  console.log("Client 2 connected");

  // Client 2 joins the same room
  client2.emit("join-room", { roomId: ROOM_ID, uid: "user2", username: "Bob" });

  // After 2 seconds, Client 2 leaves
  setTimeout(() => {
    console.log("Client 2 leaving room...");
    client2.emit("leave-room");
  }, 2000);
});
