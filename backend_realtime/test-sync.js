import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "sync-test-room";
const JOSEJU_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc5OTRiNGYzMTU2MzJiMjk3NzAwNmQ5M2U5NGIyYWNiZTMwNWZlNDYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTm9ta2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1ZfNEF4cjZSV3RyS05Vbm14WUJ1NGp3RkNfa2JTRlc1SjZhMi1WcUFkX3BWSDZtc1NGQT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS91bmktZGVzay1zaXgtc2V2ZW4iLCJhdWQiOiJ1bmktZGVzay1zaXgtc2V2ZW4iLCJhdXRoX3RpbWUiOjE3ODExMzYxODcsInVzZXJfaWQiOiIwUjlTZ2N6NFQwTUZ1ekkxMDZWNFBwNVJGWTkzIiwic3ViIjoiMFI5U2djejRUME1GdXpJMTA2VjRQcDVSRlk5MyIsImlhdCI6MTc4MTEzNjE4NywiZXhwIjoxNzgxMTM5Nzg3LCJlbWFpbCI6Imp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAwMDAxODEzNDg0ODEwOTUzMDAxIl0sImVtYWlsIjpbImp1YW5qb3NlMTExMTAyQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.G_9aWhlSc-1_M4OvHPnEBYm5CzO43qXZjd80_FXEKXZ-zYwD63b6kcYhzfxHg5e6pSgDDfGnGR4XwRNL0_tVEolNny6UWtGIyh9qD5lg97Mp3NtnZhhVazcs7jitE9UfhS-jkANXFBEkQnNQiQjeigOkVbHaKLlJ91Q_Z3PS18MSD3bHRf5lDUyyUmhwL_lwoMjQ6MW3fuUVOgH-Q5b1G8TEXPetIPJGd1xjqp0ubdcwVSeH0wkK49jFJjJvCzz-_bkeg_I_RzEYYsRxjn6r4lL9uhaAN9ZLMN_hdN7kLpnDIAVWJIJCEJal92CKS6Pmrn-E7DC851sIrMLu5UTSsw";
const JOSEPH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc5OTRiNGYzMTU2MzJiMjk3NzAwNmQ5M2U5NGIyYWNiZTMwNWZlNDYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoianVhbiBqb3NlcGgiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS0hsUUc0VGVFZzlHeUtBUjh5cF9NU1ZJS3hyRnM2cDhsaVRfZnVKVWhNazJVSmNnPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3VuaS1kZXNrLXNpeC1zZXZlbiIsImF1ZCI6InVuaS1kZXNrLXNpeC1zZXZlbiIsImF1dGhfdGltZSI6MTc4MTEzNjMxMiwidXNlcl9pZCI6InRDT1RKMnAzRjRmUXVkU09uQTU5ckFtWWdxejEiLCJzdWIiOiJ0Q09USjJwM0Y0ZlF1ZFNPbkE1OXJBbVlncXoxIiwiaWF0IjoxNzgxMTM2MzEyLCJleHAiOjE3ODExMzk5MTIsImVtYWlsIjoib2Rpb2Fsb3NqdWRpb3M5MTFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTIxNjE1MjEwMjk3Mjg2NjE4NTUiXSwiZW1haWwiOlsib2Rpb2Fsb3NqdWRpb3M5MTFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.n6CEelsDOi4700B8pLf43mgBCSE7vcuybnaqb1YcnNPdgcLMQzaxdROJKJ0jCSpDb4Tq-Bg2_eaB9koJOTwk0jJf7xvBhppGxCmeieKW8vNW4nryPxODnPI4IeNj_HEW_MoQhj1midufDO4UXGLbmTgZVPox63HYyh1SHZPXtKKLVmRSpgntYOiu0dL66HTqFw_4AjtK4jSPA7Wl5-2Lipy6-9fsNLtGdoD3Fzjz3C60AX0Jt2dgN3uPQOhm-D4EdFWjX2sHDCvuLfSmHOLEv3FBUhaMppoHx3bZBTNGJHk9dnAzaL-9IGsU3ALjBxmepiMo0TGp3IQe6oQ-9GABJg";

const client1 = io(SERVER_URL, { auth: { token: JOSEJU_TOKEN } });
const client2 = io(SERVER_URL, { auth: { token: JOSEPH_TOKEN } });

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
