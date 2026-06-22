import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { db, auth } from "./config/firebase.js";
import { Timestamp } from "firebase-admin/firestore";
import { socketAuthMiddleware, AuthenticatedSocket } from "./middleware/auth.middleware.js";
import {
  areInSameRoom,
  findRoomOf,
  UserInfo,
  SendOfferPayload,
  SendAnswerPayload,
  SendIceCandidatePayload,
  UserJoinedPayload,
  UserLeftPayload,
  SignalingErrorReason,
} from "./signaling.js";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || true,
    methods: ["GET", "POST"]
  }
});

// Middleware de autenticación global para Socket.IO
io.use(socketAuthMiddleware);

const PORT = process.env.PORT || process.env.REALTIME_PORT || 3001;

// Map<roomId, Map<socketId, UserInfo>> — shared with signaling relays.
const rooms = new Map<string, Map<string, UserInfo>>();

// ponytail: Design and implement a data structure to track multiple WebRTC peer connections per participant
const activePeerConnections = new Map<string, Set<string>>();

// Helper to get array of users in a room
function getParticipantsInRoom(roomId: string): (UserInfo & { socketId: string })[] {
  const roomUsers = rooms.get(roomId);
  return roomUsers
    ? Array.from(roomUsers.entries()).map(([socketId, info]) => ({ ...info, socketId }))
    : [];
}

io.on("connection", (socket: AuthenticatedSocket) => {
  console.log("Usuario conectado:", socket.id, "UID:", socket.user?.uid);

  socket.on("join-room", (data: { roomId: string; username?: string; microphoneEnabled?: boolean; cameraEnabled?: boolean }) => {
    if (!socket.user) {
      return;
    }

    const { roomId, username: clientUsername, microphoneEnabled, cameraEnabled } = data;
    const { uid, name, email } = socket.user;
    const username = clientUsername || name || email || "Anonymous";
    
    // Track user
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId)!.set(socket.id, { 
      uid, 
      username, 
      roomId, 
      avatar: (socket.user as any).picture,
      microphoneEnabled: microphoneEnabled ?? false,
      cameraEnabled: cameraEnabled ?? false,
    });
    
    socket.join(roomId);
    console.log(`Usuario ${username} (${uid}) se unió a la sala ${roomId}`);

    // Fetch and send chat history
    db.collection("messages")
      .where("roomId", "==", roomId)
      .orderBy("createdAt", "asc")
      .get()
      .then((snapshot: any) => {
        const messages = snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate().toISOString(),
        }));
        socket.emit("chat-history", messages);
      })
      .catch((err: any) => console.error("Error fetching chat history:", err));

    // Notify EXISTING participants that a new peer joined — they initiate offers.
    const joinerInfo: UserInfo = rooms.get(roomId)!.get(socket.id)!;
    const joinedPayload: UserJoinedPayload = { socketId: socket.id, user: joinerInfo };
    socket.to(roomId).emit("user-joined", joinedPayload);

    // Broadcast full updated list
    io.to(roomId).emit("room-participants-update", getParticipantsInRoom(roomId));
  });

  socket.on("send-message", (data: { content: string }) => {
    const { content } = data;
    
    // Check if user is authenticated
    if (!socket.user) {
      socket.emit("error", { message: "No autenticado" });
      return;
    }

    // Find sender info
    let userInfo: UserInfo | undefined;
    for (const users of rooms.values()) {
      if (users.has(socket.id)) {
        userInfo = users.get(socket.id);
        break;
      }
    }

    if (!userInfo) {
      console.error(`Error: Socket ${socket.id} intentó enviar un mensaje sin estar en una sala`);
      socket.emit("error", { message: "Debe unirse a una sala primero" });
      return;
    }

    // Basic validation
    if (!content || content.trim().length === 0) {
      socket.emit("error", { message: "El mensaje no puede estar vacío" });
      return;
    }

    const { roomId, uid, username } = userInfo;
    
    console.log(`Mensaje de ${username} en sala ${roomId}: ${content}`);

    // Persist message to Firestore
    const messageRef = db.collection("messages").doc();
    const now = Timestamp.now();
    const messageData = {
      id: messageRef.id,
      roomId,
      senderUid: uid,
      senderUsername: username,
      content: content.trim(),
      createdAt: now,
    };

    messageRef.set(messageData)
      .then(() => console.log(`Mensaje ${messageRef.id} guardado en Firestore`))
      .catch((err: any) => console.error("Error al guardar mensaje en Firestore:", err));

    // Broadcast message to the room
    io.to(roomId).emit("new-message", {
      ...messageData,
      createdAt: now.toDate().toISOString() // Send as ISO string for frontend
    });
  });

  socket.on("edit-message", async (data: { messageId: string; newContent: string }) => {
    const { messageId, newContent } = data;

    if (!messageId || !newContent || newContent.trim().length === 0 || !socket.user) {
      return;
    }

    try {
      // Verify ownership in Firestore
      const messageDoc = await db.collection("messages").doc(messageId).get();
      if (!messageDoc.exists) return;

      if (messageDoc.data()?.senderUid !== socket.user.uid) {
        console.error(`Socket ${socket.id}: Intento de editar mensaje de otro usuario`);
        return;
      }

      // Update in Firestore
      await db.collection("messages").doc(messageId).update({
        content: newContent.trim(),
        updatedAt: Timestamp.now()
      });

      console.log(`Mensaje ${messageId} actualizado por ${socket.user.uid}`);

      // Find room to broadcast
      let roomId: string | undefined;
      for (const users of rooms.values()) {
        if (users.has(socket.id)) {
          roomId = users.get(socket.id)?.roomId;
          break;
        }
      }

      if (roomId) {
        io.to(roomId).emit("message-updated", {
          id: messageId,
          content: newContent.trim(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error al actualizar mensaje:", err);
    }
  });

  // ─── WebRTC signaling relays ───────────────────────────────────────────
  // The server never parses SDP/ICE. It only enforces that sender and target
  // share a room, then relays the opaque blob with a SERVER-VERIFIED `from`.
  //
  // On validation failure the sender gets a `signaling-error` and the server
  // logs it — a refused relay is never silent. By default SDP relays log
  // success verbosely and ICE relays stay quiet (trickling fires many times
  // per second and would spam the log). Set DEBUG_SIGNALING=1 to audit every
  // ICE candidate relay too.
  //
  // Naming: `send-offer`/`send-answer`/`send-ice-candidate` (client→server)
  // become `receive-offer`/`receive-answer`/`receive-ice-candidate`
  // (server→client target).
  const DEBUG_SIGNALING = process.env.DEBUG_SIGNALING === "1";

  /** Tagged log: signaling debug line, prefixed for easy grep/audit. */
  // ponytail: Standardized diagnostic logging utility to audit WebRTC lifecycle & signaling errors
  const logDiagnostic = (level: "INFO" | "DEBUG" | "WARN" | "ERROR", event: string, msg: string, socketId: string, targetId?: string) => {
    const roomId = findRoomOf(rooms, socketId) ?? "-";
    const targetInfo = targetId ? ` | target=${targetId}` : "";
    const logMsg = `[${level}] [signaling] [room=${roomId}] [sender=${socketId}]${targetInfo} | ${event} | ${msg}`;
    if (level === "ERROR") {
      console.error(logMsg);
    } else if (level === "WARN") {
      console.warn(logMsg);
    } else {
      console.log(logMsg);
    }
  };

  /**
   * Validate a signaling relay request. Returns a reason code on failure, or
   * null on success. Centralizes the auth + room-scoping + payload checks so
   * all three relay handlers share one ruleset.
   */
  const validateRelay = (
    data: { to?: unknown },
  ): { ok: true; target: string } | { ok: false; reason: SignalingErrorReason } => {
    if (!socket.user) return { ok: false, reason: "not-authenticated" };
    const target = data?.to;
    if (typeof target !== "string" || !target) {
      return { ok: false, reason: "missing-target" };
    }
    if (!areInSameRoom(rooms, socket.id, target)) {
      // target could be a valid socket in a different room, or a ghost id.
      const inSomeRoom = findRoomOf(rooms, target) !== null;
      return { ok: false, reason: inSomeRoom ? "not-co-located" : "target-disconnected" };
    }
    return { ok: true, target };
  };

  /** Reject a relay: notify the sender + log with room context. */
  const rejectRelay = (
    event: string,
    reason: SignalingErrorReason,
    target: string | undefined,
    verbose: boolean,
  ): void => {
    socket.emit("signaling-error", { event, reason, target });
    logDiagnostic("WARN", event, `Relay rechazado: ${reason}`, socket.id, target);
  };

  socket.on("send-offer", (data: SendOfferPayload) => {
    const v = validateRelay(data ?? {});
    if (!v.ok) { rejectRelay("send-offer", v.reason, data?.to, true); return; }
    const payload = data?.sdp;
    if (payload === undefined) { rejectRelay("send-offer", "missing-payload", v.target, true); return; }

    // ponytail: Associate/map active peer connections directly to connected user sessions (Socket IDs)
    if (!activePeerConnections.has(socket.id)) activePeerConnections.set(socket.id, new Set());
    activePeerConnections.get(socket.id)!.add(v.target);
    if (!activePeerConnections.has(v.target)) activePeerConnections.set(v.target, new Set());
    activePeerConnections.get(v.target)!.add(socket.id);

    io.to(v.target).emit("receive-offer", { from: socket.id, sdp: payload });
    logDiagnostic("INFO", "send-offer", "Offer relayed successfully", socket.id, v.target);
  });

  socket.on("send-answer", (data: SendAnswerPayload) => {
    const v = validateRelay(data ?? {});
    if (!v.ok) { rejectRelay("send-answer", v.reason, data?.to, true); return; }
    const payload = data?.sdp;
    if (payload === undefined) { rejectRelay("send-answer", "missing-payload", v.target, true); return; }
    io.to(v.target).emit("receive-answer", { from: socket.id, sdp: payload });
    logDiagnostic("INFO", "send-answer", "Answer relayed successfully", socket.id, v.target);
  });

  socket.on("send-ice-candidate", (data: SendIceCandidatePayload) => {
    const v = validateRelay(data ?? {});
    if (!v.ok) { rejectRelay("send-ice-candidate", v.reason, data?.to, true); return; }
    const payload = data?.candidate;
    if (payload === undefined) { rejectRelay("send-ice-candidate", "missing-payload", v.target, true); return; }
    io.to(v.target).emit("receive-ice-candidate", { from: socket.id, candidate: payload });
    // ICE trickles are high-volume; only audit when DEBUG_SIGNALING=1.
    if (DEBUG_SIGNALING) {
      logDiagnostic("DEBUG", "send-ice-candidate", "ICE candidate relayed successfully", socket.id, v.target);
    }
  });

  // ponytail: Listen to media state changes, sync to UserInfo, and broadcast to other peers in room
  socket.on("user-muted", () => {
    const roomId = findRoomOf(rooms, socket.id);
    if (!roomId) return;
    const user = rooms.get(roomId)?.get(socket.id);
    if (user) {
      user.microphoneEnabled = false;
      socket.to(roomId).emit("user-muted", { socketId: socket.id, uid: user.uid });
    }
  });

  socket.on("user-unmuted", () => {
    const roomId = findRoomOf(rooms, socket.id);
    if (!roomId) return;
    const user = rooms.get(roomId)?.get(socket.id);
    if (user) {
      user.microphoneEnabled = true;
      socket.to(roomId).emit("user-unmuted", { socketId: socket.id, uid: user.uid });
    }
  });

  socket.on("camera-on", () => {
    const roomId = findRoomOf(rooms, socket.id);
    if (!roomId) return;
    const user = rooms.get(roomId)?.get(socket.id);
    if (user) {
      user.cameraEnabled = true;
      socket.to(roomId).emit("camera-on", { socketId: socket.id, uid: user.uid });
    }
  });

  socket.on("camera-off", () => {
    const roomId = findRoomOf(rooms, socket.id);
    if (!roomId) return;
    const user = rooms.get(roomId)?.get(socket.id);
    if (user) {
      user.cameraEnabled = false;
      socket.to(roomId).emit("camera-off", { socketId: socket.id, uid: user.uid });
    }
  });

  socket.on("user-speaking", (data: { speaking: boolean }) => {
    try {
      const roomId = findRoomOf(rooms, socket.id);
      if (!roomId) return;
      const user = rooms.get(roomId)?.get(socket.id);
      if (user) {
        socket.to(roomId).emit("user-speaking", { socketId: socket.id, uid: user.uid, speaking: data.speaking });
      }
    } catch (err) {
      console.error(`[signaling] Error en user-speaking de ${socket.id}:`, err);
    }
  });

  const handleLeaveRoom = (socketId: string) => {
    // ponytail: Wrap in try-catch to prevent a single peer leave failure from crashing the server
    try {
      let roomIdToNotify: string | null = null;
      let leftUser: UserInfo | null = null;

      for (const [roomId, users] of rooms.entries()) {
        if (users.has(socketId)) {
          leftUser = users.get(socketId)!;
          users.delete(socketId);
          roomIdToNotify = roomId;

          // Clean up empty rooms
          if (users.size === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }

      // ponytail: Dynamic destruction and state purging of peer references when a user leaves/disconnects
      const connectedPeers = activePeerConnections.get(socketId);
      if (connectedPeers) {
        for (const peerId of connectedPeers) {
          activePeerConnections.get(peerId)?.delete(socketId);
          if (activePeerConnections.get(peerId)?.size === 0) {
            activePeerConnections.delete(peerId);
          }
        }
        activePeerConnections.delete(socketId);
      }

      if (roomIdToNotify && leftUser) {
        console.log(`Usuario ${leftUser.username} salió de la sala ${roomIdToNotify}`);
        // Tell remaining peers to tear down their peer connection to the leaver.
        const leftPayload: UserLeftPayload = { socketId, uid: leftUser.uid };
        io.to(roomIdToNotify).emit("user-left", leftPayload);
        // Broadcast full updated list
        io.to(roomIdToNotify).emit("room-participants-update", getParticipantsInRoom(roomIdToNotify));
      }
    } catch (err) {
      console.error(`[signaling] Error en handleLeaveRoom para ${socketId}:`, err);
    }
  };

  socket.on("leave-room", () => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    handleLeaveRoom(socket.id);
  });

  socket.on("disconnecting", () => {
    // ponytail: clean up on disconnecting to ensure early and robust purge
    handleLeaveRoom(socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    handleLeaveRoom(socket.id);
  });

  // ponytail: handle explicit peer connection closed/failed events gracefully
  socket.on("peer-closed", (data: { to?: unknown }) => {
    try {
      const target = data?.to;
      if (typeof target !== "string" || !target) return;
      
      activePeerConnections.get(socket.id)?.delete(target);
      activePeerConnections.get(target)?.delete(socket.id);
      
      if (activePeerConnections.get(socket.id)?.size === 0) activePeerConnections.delete(socket.id);
      if (activePeerConnections.get(target)?.size === 0) activePeerConnections.delete(target);

      io.to(target).emit("peer-disconnected", { socketId: socket.id });
      logDiagnostic("INFO", "peer-closed", "Peer connection explicitly closed", socket.id, target);
    } catch (err) {
      console.error(`[signaling] Error en peer-closed de ${socket.id}:`, err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de tiempo real corriendo en puerto ${PORT}`);
});
