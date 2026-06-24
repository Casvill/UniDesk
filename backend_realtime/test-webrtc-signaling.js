/**
 * test-webrtc-signaling.js — exercises every WebRTC signaling event end-to-end.
 *
 * Usage:
 *   1. Start the realtime server:  cd backend_realtime && npm start
 *   2. Run this test:               node test-webrtc-signaling.js
 *
 * Both clients join the same room before signaling tests begin, matching
 * the real flow: you must join a room before you can receive any events in it.
 */

import { io } from "socket.io-client";
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const SERVER = "http://localhost:3001";
const ROOM = "test-webrtc-room";
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
if (!FIREBASE_WEB_API_KEY) {
  throw new Error("FIREBASE_WEB_API_KEY environment variable is required.");
}


// ── Firebase Admin init ──────────────────────────────────────────────────
const privateStr = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateStr,
  }),
});

async function getIdToken(uid, displayName) {
  const customToken = await admin.auth().createCustomToken(uid, { name: displayName });
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

// ── Helpers ─────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;

function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else      { fail++; console.log(`  ❌ ${label}`); }
}

function once(sock, event, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout on "${event}"`)), timeoutMs);
    sock.once(event, (data) => { clearTimeout(timer); resolve(data); });
  });
}

/** Attach listener on captureSock THEN emit on emitterSock. No race. */
function emitAndCapture(emitter, event, payload, receiver, recvEvent) {
  const p = once(receiver, recvEvent);
  emitter.emit(event, payload);
  return p;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  // Ensure test users
  console.log("── Ensuring test users exist ──");
  for (const [uid, name] of [["test-alice", "Alice"], ["test-bob", "Bob"]]) {
    try {
      await admin.auth().createUser({ uid, displayName: name, password: "testpass123" });
      console.log(`  Created ${name}`);
    } catch (e) {
      if (e.code === "auth/uid-already-exists") console.log(`  ${name} exists`);
      else throw e;
    }
  }

  // Mint real ID tokens
  console.log("\n── Minting Firebase ID tokens ──");
  const [token1, token2] = await Promise.all([
    getIdToken("test-alice", "Alice"),
    getIdToken("test-bob", "Bob"),
  ]);

  // Connect
  const c1 = io(SERVER, { auth: { token: token1 } });
  const c2 = io(SERVER, { auth: { token: token2 } });
  const [s1, s2] = await Promise.all([
    new Promise((r, j) => { c1.on("connect", () => r(c1)); c1.on("connect_error", j); }),
    new Promise((r, j) => { c2.on("connect", () => r(c2)); c2.on("connect_error", j); }),
  ]);
  console.log(`  c1: ${s1.id}  c2: ${s2.id}`);

  // Both join the room first (you must be in a room to receive events)
  console.log("\n── Both clients join room ──");
  s2.emit("join-room", { roomId: ROOM });
  await new Promise(r => setTimeout(r, 200)); // let the join settle

  // ── Test 1: c1 joins → c2 (already in room) receives user-joined ──────
  console.log("\n── Test 1: join-room triggers user-joined ──");
  const j = await emitAndCapture(s1, "join-room", { roomId: ROOM }, s2, "user-joined");
  assert(j.socketId === s1.id, `user-joined.socketId === s1.id`);
  assert(j.user.uid, `user-joined.user.uid is present`);

  // ── Test 2: send-offer → c2 receives receive-offer ─────────────────────
  console.log("\n── Test 2: send-offer → receive-offer relay ──");
  const o = await emitAndCapture(s1, "send-offer",
    { to: s2.id, sdp: { type: "offer", fake: true } }, s2, "receive-offer");
  assert(o.from === s1.id, `receive-offer.from === s1.id (server-verified)`);
  assert(o.sdp.fake === true, `receive-offer.sdp opaque blob preserved`);

  // ── Test 3: send-answer → c1 receives receive-answer ───────────────────
  console.log("\n── Test 3: send-answer → receive-answer relay ──");
  const a = await emitAndCapture(s2, "send-answer",
    { to: s1.id, sdp: { type: "answer", fake: true } }, s1, "receive-answer");
  assert(a.from === s2.id, `receive-answer.from === s2.id`);
  assert(a.sdp.fake === true, `receive-answer.sdp opaque blob preserved`);

  // ── Test 4: ice-candidate relay ────────────────────────────────────────
  console.log("\n── Test 4: send-ice-candidate → receive-ice-candidate ──");
  const ic = await emitAndCapture(s1, "send-ice-candidate",
    { to: s2.id, candidate: { candidate: "candidate:1 1 UDP 2130706431 192.168.1.1 4444 typ host", sdpMid: "0" } },
    s2, "receive-ice-candidate");
  assert(ic.from === s1.id, `receive-ice-candidate.from === s1.id`);
  assert(ic.candidate.sdpMid === "0", `receive-ice-candidate.candidate blob preserved`);

  // ── Test 5: offer to ghost socket → sender gets signaling-error ─────────
  console.log("\n── Test 5: send-offer to ghost socket → signaling-error ──");
  const e5 = await emitAndCapture(s1, "send-offer",
    { to: "socket-that-does-not-exist", sdp: {} }, s1, "signaling-error");
  assert(e5.event === "send-offer", `signaling-error.event === "send-offer"`);
  assert(e5.reason === "target-disconnected", `signaling-error.reason === "target-disconnected"`);
  assert(e5.target === "socket-that-does-not-exist", `signaling-error.target echoed back`);

  // ── Test 6: offer missing `to` → signaling-error ───────────────────────
  console.log("\n── Test 6: send-offer with no target → signaling-error ──");
  const e6 = await emitAndCapture(s1, "send-offer", { sdp: {} }, s1, "signaling-error");
  assert(e6.event === "send-offer", `signaling-error.event === "send-offer"`);
  assert(e6.reason === "missing-target", `signaling-error.reason === "missing-target"`);

  // ── Test 7: media synchronization events ──────────────────────────────
  console.log("\n── Test 7: media state synchronization events ──");
  const m1 = await emitAndCapture(s1, "user-muted", {}, s2, "user-muted");
  assert(m1.socketId === s1.id, `receive user-muted event has correct socketId`);

  const m2 = await emitAndCapture(s1, "user-unmuted", {}, s2, "user-unmuted");
  assert(m2.socketId === s1.id, `receive user-unmuted event has correct socketId`);

  const m3 = await emitAndCapture(s1, "camera-off", {}, s2, "camera-off");
  assert(m3.socketId === s1.id, `receive camera-off event has correct socketId`);

  const m4 = await emitAndCapture(s1, "camera-on", {}, s2, "camera-on");
  assert(m4.socketId === s1.id, `receive camera-on event has correct socketId`);

  // ── Test 7b: screen-share synchronization events ──────────────────────
  console.log("\n── Test 7b: screen-share state synchronization events ──");
  const m5 = await emitAndCapture(s1, "screen-share-started", { userId: "some-uid", estado: true }, s2, "screen-share-started");
  assert(m5.userId === j.user.uid, `receive screen-share-started event has correct userId`);
  assert(m5.estado === true, `receive screen-share-started event has estado === true`);

  const m6 = await emitAndCapture(s1, "screen-share-stopped", { userId: "some-uid", estado: false }, s2, "screen-share-stopped");
  assert(m6.userId === j.user.uid, `receive screen-share-stopped event has correct userId`);
  assert(m6.estado === false, `receive screen-share-stopped event has estado === false`);

  // ── Test 8: peer-closed signaling relay ────────────────────────────────
  console.log("\n── Test 8: peer-closed signaling → peer-disconnected ──");
  const pc = await emitAndCapture(s1, "peer-closed", { to: s2.id }, s2, "peer-disconnected");
  assert(pc.socketId === s1.id, `receive peer-disconnected event has correct socketId`);

  // ── Test 9: disconnect triggers user-left ──────────────────────────────

  console.log("\n── Test 9: disconnect → user-left ──");
  const s2Id = s2.id; // capture before disconnect destroys the reference
  const left = once(s1, "user-left");
  s2.disconnect();
  const l = await left;
  assert(l.socketId === s2Id, `user-left.socketId === s2.id`);
  assert(l.uid, `user-left.uid is present`);

  // ── Done ──────────────────────────────────────────────────────────────
  c1.disconnect();
  console.log(`\n══ Results: ${pass} passed, ${fail} failed ══`);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => { console.error("Fatal:", err.message); process.exit(1); });
