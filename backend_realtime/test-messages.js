import { io } from "socket.io-client";

const SERVER_URL = "https://unidesk-1.onrender.com/";
const ROOM_ID = "chat-test-room";
const JOSEJU_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlOTA0NmVhZDJlMDUwMDAxMGVkNTA0M2I0ODNkODRiMGM1MmM3YzQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTm9ta2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1ZfNEF4cjZSV3RyS05Vbm14WUJ1NGp3RkNfa2JTRlc1SjZhMi1WcUFkX3BWSDZtc1NGQT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS91bmktZGVzay1zaXgtc2V2ZW4iLCJhdWQiOiJ1bmktZGVzay1zaXgtc2V2ZW4iLCJhdXRoX3RpbWUiOjE3ODEyODM3MDgsInVzZXJfaWQiOiIwUjlTZ2N6NFQwTUZ1ekkxMDZWNFBwNVJGWTkzIiwic3ViIjoiMFI5U2djejRUME1GdXpJMTA2VjRQcDVSRlk5MyIsImlhdCI6MTc4MTI4ODQzNSwiZXhwIjoxNzgxMjkyMDM1LCJlbWFpbCI6Imp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAwMDAxODEzNDg0ODEwOTUzMDAxIl0sImVtYWlsIjpbImp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.VtNBFEHF6m81dEEvnjcbuOd_F427_z8hBs0ldgeWdRD-_2TROGfjtJR5n4hZg3sIXMQklsevzYRKjzwHITzORmCLO2ElvO1ylhGHmpR-2rR73Ry5LvG9i9-JBByOwlAK1ySUxu3bxFqCay0J79fpO_m_V4cFXQF26g2beQkqMf5SHvMxEyth5J1U5nbFsxlmliuywLEzPzZ2X3Z__5KJR8c9zuIXZYEaSmePSj1OaikTFQ4zWnlOneq4sykIPcaWeD1GOJ9cD-w67X1XfJgI1kUwGA9TM94__5lFOuIey_6g74R9KN8iNTv0NCMZ7XCaWDAwDah46Be4t3mq9WAvJA";
const JOSEPH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlOTA0NmVhZDJlMDUwMDAxMGVkNTA0M2I0ODNkODRiMGM1MmM3YzQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTm9ta2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1ZfNEF4cjZSV3RyS05Vbm14WUJ1NGp3RkNfa2JTRlc1SjZhMi1WcUFkX3BWSDZtc1NGQT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS91bmktZGVzay1zaXgtc2V2ZW4iLCJhdWQiOiJ1bmktZGVzay1zaXgtc2V2ZW4iLCJhdXRoX3RpbWUiOjE3ODEyODM3MDgsInVzZXJfaWQiOiIwUjlTZ2N6NFQwTUZ1ekkxMDZWNFBwNVJGWTkzIiwic3ViIjoiMFI5U2djejRUME1GdXpJMTA2VjRQcDVSRlk5MyIsImlhdCI6MTc4MTI4ODQzNSwiZXhwIjoxNzgxMjkyMDM1LCJlbWFpbCI6Imp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAwMDAxODEzNDg0ODEwOTUzMDAxIl0sImVtYWlsIjpbImp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.VtNBFEHF6m81dEEvnjcbuOd_F427_z8hBs0ldgeWdRD-_2TROGfjtJR5n4hZg3sIXMQklsevzYRKjzwHITzORmCLO2ElvO1ylhGHmpR-2rR73Ry5LvG9i9-JBByOwlAK1ySUxu3bxFqCay0J79fpO_m_V4cFXQF26g2beQkqMf5SHvMxEyth5J1U5nbFsxlmliuywLEzPzZ2X3Z__5KJR8c9zuIXZYEaSmePSj1OaikTFQ4zWnlOneq4sykIPcaWeD1GOJ9cD-w67X1XfJgI1kUwGA9TM94__5lFOuIey_6g74R9KN8iNTv0NCMZ7XCaWDAwDah46Be4t3mq9WAvJA";

const joseju = io(SERVER_URL, { auth: { token: JOSEJU_TOKEN } });
const joseph = io(SERVER_URL, { auth: { token: JOSEPH_TOKEN } });

// joseju listens for messages
joseju.on("new-message", (msg) => {
  console.log(`[joseju received] ${msg.senderUsername}: ${msg.content}`);
});

// joseph listens for messages
joseph.on("new-message", (msg) => {
  console.log(`[joseph received] ${msg.senderUsername}: ${msg.content}`);
});

joseju.on("connect", () => {
  joseju.emit("join-room", { roomId: ROOM_ID });
});

joseph.on("connect", () => {
  joseph.emit("join-room", { roomId: ROOM_ID });

  // joseph sends a message after joining
  setTimeout(() => {
    console.log("joseph is sending a message...");
    joseph.emit("send-message", { content: "ola" });
  }, 5000);
});
