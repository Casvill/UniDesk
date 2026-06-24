import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { mintTurnCredential } from "../services/turn.service";

const router = Router();

/**
 * @swagger
 * /turn/credentials:
 *   get:
 *     summary: Short-lived TURN credentials for WebRTC relay
 *     description: Mints time-limited TURN REST credentials (username + HMAC password) so the client can build iceServers without exposing the shared secret.
 *     tags: [Turn]
 *     responses:
 *       200:
 *         description: TURN credentials valid for TTL seconds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 iceServers:
 *                   type: array
 *                   items:
 *                     type: object
 *       501:
 *         description: TURN no configurado en el servidor
 */
router.get("/credentials", verifyToken, (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const credential = mintTurnCredential(req.user.uid);
  // ponytail: no TURN configured → 501 (not a client error, server chose not to run TURN)
  if (!credential) {
    res.status(501).json({ message: "TURN no configurado" });
    return;
  }

  res.json({
    iceServers: [
      // ponytail: STUN first so direct paths win before falling back to TURN
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: credential.urls,
        username: credential.username,
        credential: credential.credential,
      },
    ],
    expiresAt: credential.expiresAt,
  });
});

export default router;
