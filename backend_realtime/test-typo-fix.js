import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "typo-test-room";
const TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc5OTRiNGYzMTU2MzJiMjk3NzAwNmQ5M2U5NGIyYWNiZTMwNWZlNDYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTm9ta2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1ZfNEF4cjZSV3RyS05Vbm14WUJ1NGp3RkNfa2JTRlc1SjZhMi1WcUFkX3BWSDZtc1NGQT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS91bmktZGVzay1zaXgtc2V2ZW4iLCJhdWQiOiJ1bmktZGVzay1zaXgtc2V2ZW4iLCJhdXRoX3RpbWUiOjE3ODExMzYxODcsInVzZXJfaWQiOiIwUjlTZ2N6NFQwTUZ1ekkxMDZWNFBwNVJGWTkzIiwic3ViIjoiMFI5U2djejRUME1GdXpJMTA2VjRQcDVSRlk5MyIsImlhdCI6MTc4MTEzNjE4NywiZXhwIjoxNzgxMTM5Nzg3LCJlbWFpbCI6Imp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAwMDAxODEzNDg0ODEwOTUzMDAxIl0sImVtYWlsIjpbImp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.G_9aWhlSc-1_M4OvHPnEBYm5CzO43qXZjd80_FXEKXZ-zYwD63b6kcYhzfxHg5e6pSgDDfGnGR4XwRNL0_tVEolNny6UWtGIyh9qD5lg97Mp3NtnZhhVazcs7jitE9UfhS-jkANXFBEkQnNQiQjeigOkVbHaKLlJ91Q_Z3PS18MSD3bHRf5lDUyyUmhwL_lwoMjQ6MW3fuUVOgH-Q5b1G8TEXPetIPJGd1xjqp0ubdcwVSeH0wkK49jFJjJvCzz-_bkeg_I_RzEYYsRxjn6r4lL9uhaAN9ZLMN_hdN7kLpnDIAVWJIJCEJal92CKS6Pmrn-E7DC851sIrMLu5UTSsw";

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
