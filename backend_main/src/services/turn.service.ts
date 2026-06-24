/**
 * Mints short-lived TURN credentials (RFC 5389 / TURN REST API, a.k.a.
 * "time-limited credentials") so the frontend never ships the long-lived
 * TURN shared secret in its bundle. The browser receives a per-user
 * username + password valid for TTL seconds; coturn validates the password
 * as the HMAC-SHA1 of the username keyed by the same shared secret.
 *
 * Uses only Node `crypto` — no dependency. The browser-side `iceServers`
 * assembly (which actually opens the TURN allocation) stays in the frontend;
 * this endpoint only hands out credentials.
 *
 * Env:
 *   TURN_URL       e.g. "turn:turn.example.com:3478"   (omit → 404)
 *   TURN_SHARED_SECRET   shared secret configured on coturn's `static-auth-secret`
 *   TURN_TTL_SECONDS     credential lifetime (default 3600)
 */
import crypto from "crypto";

const SHARED_SECRET = process.env.TURN_SHARED_SECRET ?? "";
const TTL_SECONDS = Number(process.env.TURN_TTL_SECONDS ?? 3600);

export interface TurnCredential {
  urls: string[];
  username: string;
  credential: string;
  expiresAt: number; // unix seconds
}

/**
 * Mint a TURN REST credential for a user. Returns null when TURN is not
 * configured (caller should 404 / 501), never throws on missing config.
 */
export function mintTurnCredential(
  userIdentifier: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): TurnCredential | null {
  if (!process.env.TURN_URL || !SHARED_SECRET) return null;

  const expiresAt = nowSeconds + TTL_SECONDS;
  // ponytail: coturn expects "<expiryUnixSeconds>:<userTag>"
  const username = `${expiresAt}:${userIdentifier}`;
  const credential = crypto
    .createHmac("sha1", SHARED_SECRET)
    .update(username)
    .digest("base64");

  const urls = process.env.TURN_URL!.split(",").map((u) => u.trim()).filter(Boolean);

  return { urls, username, credential, expiresAt };
}

// ─── Self-check (run: `ts-node src/services/turn.service.ts`) ────────────
// ponytail: known vector pins the HMAC so a hash/secret misconfig fails loudly
if (require.main === module) {
  const t0 = 1_000_000_000;
  const cred = mintTurnCredential("user1", t0);
  const expected = "TI5jLC9l3PksBSlAMz0VMdOfVag=";
  if (!cred) throw new Error("TURN_URL/TURN_SHARED_SECRET must be set to run self-check");
  if (cred.username !== "1000003600:user1") throw new Error(`username mismatch: ${cred.username}`);
  if (cred.credential !== expected) throw new Error(`credential mismatch: ${cred.credential}`);
  if (cred.expiresAt !== t0 + TTL_SECONDS) throw new Error(`expiry mismatch: ${cred.expiresAt}`);
  console.log("turn.service.ts: all self-checks passed");
}
