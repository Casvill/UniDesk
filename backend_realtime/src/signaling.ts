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
 */

/** A participant's resolved identity within a room. */
export interface UserInfo {
  uid: string;
  username: string;
  roomId: string;
  avatar?: string;
}

/** In-memory membership index: roomId -> (socketId -> UserInfo). */
export type RoomsMap = Map<string, Map<string, UserInfo>>;

// ─── Client → Server payloads (what a peer sends) ────────────────────────

export interface WebRTCOfferPayload {
  /** Socket id of the peer to deliver the offer to. */
  to: string;
  /** Opaque RTCSessionDescriptionInit (type "offer"). Frontend owns the shape. */
  sdp: unknown;
}

export interface WebRTCAnswerPayload {
  to: string;
  /** Opaque RTCSessionDescriptionInit (type "answer"). */
  sdp: unknown;
}

export interface IceCandidatePayload {
  to: string;
  /** Opaque RTCIceCandidateInit. */
  candidate: unknown;
}

// ─── Server → Client payloads (relayed / enriched) ───────────────────────

export interface SignalingRelayed {
  /** Verified sender socket id, overwritten by the server. */
  from: string;
}

export interface WebRTCOfferRelayed extends SignalingRelayed {
  sdp: unknown;
}
export interface WebRTCAnswerRelayed extends SignalingRelayed {
  sdp: unknown;
}
export interface IceCandidateRelayed extends SignalingRelayed {
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

// ─── Self-check (run: `node --import tsx src/signaling.ts`) ──────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const r: RoomsMap = new Map();
  const roomA = new Map([["s1", { uid: "u1", username: "a", roomId: "A" }]]);
  const roomB = new Map([["s2", { uid: "u2", username: "b", roomId: "B" }]]);
  r.set("A", roomA);
  r.set("B", roomB);
  // same room
  roomA.set("s3", { uid: "u3", username: "c", roomId: "A" });
  assert(areInSameRoom(r, "s1", "s3") === true, "s1 & s3 share room A");
  // different rooms
  assert(areInSameRoom(r, "s1", "s2") === false, "s1 & s2 are in different rooms");
  // unknown socket
  assert(areInSameRoom(r, "s1", "ghost") === false, "ghost socket not co-located");
  // multi-room membership: s1 also in B
  roomB.set("s1", { uid: "u1", username: "a", roomId: "B" });
  assert(areInSameRoom(r, "s1", "s2") === true, "s1 now co-located with s2 via room B");
  console.log("signaling.ts: all self-checks passed");
}

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error("ASSERT FAILED:", msg);
    process.exit(1);
  }
}
