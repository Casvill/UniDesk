import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "sync-test-room";

const client1 = io(SERVER_URL);
const client2 = io(SERVER_URL);

// Helper to log updates
const setupListener = (name, socket) => {
  socket.on("room-participants-update", (participants) => {
    console.log(`[${name}] Received participant update:`, participants.map(p => p.username));
  });
};

setupListener("Alice", client1);
setupListener("Bob", client2);

client1.on("connect", () => {
  console.log("Alice connected");
  client1.emit("join-room", { roomId: ROOM_ID, uid: "u1", username: "Alice" });
});

client2.on("connect", () => {
  console.log("Bob connected");

  // Wait for Alice to join first
  setTimeout(() => {
    client2.emit("join-room", { roomId: ROOM_ID, uid: "u2", username: "Bob" });
  }, 1000);

  // Bob leaves after 3 seconds
  setTimeout(() => {
    console.log("Bob leaving...");
    client2.emit("leave-room");
  }, 3000);
});
