/**
 * WebRTC signaling contract + pure helpers.
 *
 * The realtime server is a DUMB RELAY for opaque SDP/ICE blobs between two
 * peers that already share a Socket.io room. It never inspects or rewrites
 * SDP/ICE contents — those shapes are frontend-owned. The only integrity the
 * server enforces:
 *   1. Both sockets must currently share a room (see {@link areInSameRoom}).
 *   2. `from` on relayed messages is always the verified sender socket id,
 *      never a value supplied by the client.
 *   3. On any validation failure, the sender is notified via `signaling-error`
 *      (server-side logging also fires), so a dropped offer/answer is never
 *      silent — the client can surface feedback or retry.
 *
 * Naming convention:
 *   Client → Server : `send-offer` / `send-answer` / `send-ice-candidate`
 *   Server → Client : `receive-offer` / `receive-answer` / `receive-ice-candidate`
 */

/** A participant's resolved identity within a room. */
export interface UserInfo {
  uid: string;
  username: string;
  roomId: string;
  avatar?: string;
  microphoneEnabled?: boolean; 
  cameraEnabled?: boolean; 
}

/** In-memory membership index: roomId -> (socketId -> UserInfo). */
export type RoomsMap = Map<string, Map<string, UserInfo>>;

// ─── Client → Server payloads (what a peer sends) ────────────────────────

export interface SendOfferPayload {
  /** Socket id of the peer to deliver the offer to. */
  to: string;
  /** Opaque RTCSessionDescriptionInit (type "offer"). Frontend owns the shape. */
  sdp: unknown;
}

export interface SendAnswerPayload {
  to: string;
  /** Opaque RTCSessionDescriptionInit (type "answer"). */
  sdp: unknown;
}

export interface SendIceCandidatePayload {
  to: string;
  /** Opaque RTCIceCandidateInit. */
  candidate: unknown;
}

// ─── Server → Client payloads (relayed / enriched) ───────────────────────

export interface ReceiveOfferPayload {
  /** Verified sender socket id, overwritten by the server. */
  from: string;
  sdp: unknown;
}

export interface ReceiveAnswerPayload {
  from: string;
  sdp: unknown;
}

export interface ReceiveIceCandidatePayload {
  from: string;
  candidate: unknown;
}

/** Emitted to EXISTING participants when a new peer joins a room. */
export interface UserJoinedPayload {
  socketId: string;
  user: UserInfo;
}

/** Emitted to remaining participants when a peer leaves / disconnects. */
export interface UserLeftPayload {
  socketId: string;
  uid: string;
}

// ─── Error reporting ─────────────────────────────────────────────────────

/** Reason codes the server reports back to a sender on a failed relay. */
export type SignalingErrorReason =
  | "not-authenticated"
  | "missing-target"
  | "not-co-located"
  | "missing-payload"
  | "target-disconnected";

/** Emitted back to the SENDER when a signaling relay is refused. */
export interface SignalingErrorPayload {
  /** The event that was rejected (`send-offer` / `send-answer` / `send-ice-candidate`). */
  event: string;
  reason: SignalingErrorReason;
  /** The target socket id the sender tried to reach, for client-side context. */
  target?: string;
}

/**
 * Security boundary for every signaling relay: returns true only if both
 * sockets currently share at least one room. Robust to multi-room membership
 * (a socket joined to several rooms), so it is the actual invariant the relay
 * needs rather than "first room matches".
 */
export function areInSameRoom(rooms: RoomsMap, a: string, b: string): boolean {
  for (const users of rooms.values()) {
    if (users.has(a) && users.has(b)) return true;
  }
  return false;
}

/**
 * Locate the (first) room id a socket currently belongs to, or null.
 * Used only for logging context — routing itself relies on {@link areInSameRoom}.
 */
export function findRoomOf(rooms: RoomsMap, socketId: string): string | null {
  for (const [roomId, users] of rooms.entries()) {
    if (users.has(socketId)) return roomId;
  }
  return null;
}

// ─── Self-check (run: `node --import tsx src/signaling.ts`) ──────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const r: RoomsMap = new Map();
  const roomA = new Map([["s1", { uid: "u1", username: "a", roomId: "A" }]]);
  const roomB = new Map([["s2", { uid: "u2", username: "b", roomId: "B" }]]);
  r.set("A", roomA);
  r.set("B", roomB);
  roomA.set("s3", { uid: "u3", username: "c", roomId: "A" });
  assert(areInSameRoom(r, "s1", "s3") === true, "s1 & s3 share room A");
  assert(areInSameRoom(r, "s1", "s2") === false, "s1 & s2 in different rooms");
  assert(areInSameRoom(r, "s1", "ghost") === false, "ghost socket not co-located");
  roomB.set("s1", { uid: "u1", username: "a", roomId: "B" });
  assert(areInSameRoom(r, "s1", "s2") === true, "s1 now co-located with s2 via room B");
  assert(findRoomOf(r, "s1") === "A", "findRoomOf(s1) returns its first room");
  assert(findRoomOf(r, "ghost") === null, "findRoomOf(ghost) returns null");
  console.log("signaling.ts: all self-checks passed");
}

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error("ASSERT FAILED:", msg);
    process.exit(1);
  }
}
