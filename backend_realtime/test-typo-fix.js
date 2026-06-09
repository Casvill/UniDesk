import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "typo-test-room";
const TOKEN = "YOUR_FIREBASE_ID_TOKEN_HERE"; // Need a real token now

const client = io(SERVER_URL, {
  auth: {
    token: TOKEN
  }
});

client.on("connect", () => {
  console.log("Connected to server");
  client.emit("join-room", { roomId: ROOM_ID });
});

client.on("new-message", (msg) => {
  console.log("\n[New Message Received]:", msg);
  
  if (msg.content === "Hello with a typoo") {
    console.log("\n--- Sending edit request for message:", msg.id);
    client.emit("edit-message", { 
      messageId: msg.id, 
      newContent: "Hello with a typo (fixed!)" 
    });
  }
});

client.on("message-updated", (update) => {
  console.log("\n[Message Updated Received]:", update);
  console.log("Test Success: Typo managed and broadcasted.");
  process.exit(0);
});

setTimeout(() => {
  console.log("\n--- Sending message with typo...");
  client.emit("send-message", { content: "Hello with a typoo" });
}, 1000);

// Timeout safety
setTimeout(() => {
  console.log("Test timed out");
  process.exit(1);
}, 10000);
