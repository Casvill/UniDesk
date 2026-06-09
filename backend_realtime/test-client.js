// backend_realtime/test-client.js
import { io } from "socket.io-client";

// Connect to the server
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("✅ Successfully connected to server!");
  console.log("Socket ID:", socket.id);

  // Close the connection after verifying
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection failed:", err.message);
});
