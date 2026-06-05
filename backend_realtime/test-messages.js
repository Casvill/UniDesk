import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "chat-test-room";

const alice = io(SERVER_URL);
const bob = io(SERVER_URL);

// Alice listens for messages
alice.on("new-message", (msg) => {
  console.log(`[Alice received] ${msg.senderUsername}: ${msg.content}`);
});

// Bob listens for messages
bob.on("new-message", (msg) => {
  console.log(`[Bob received] ${msg.senderUsername}: ${msg.content}`);
});

alice.on("connect", () => {
  alice.emit("join-room", { roomId: ROOM_ID, uid: "u1", username: "Alice" });
});

bob.on("connect", () => {
  bob.emit("join-room", { roomId: ROOM_ID, uid: "u2", username: "Bob" });

  // Bob sends a message after joining
  setTimeout(() => {
    console.log("Bob is sending a message...");
    bob.emit("send-message", { content: "q'hubo bn o q" });
  }, 1000);
});
