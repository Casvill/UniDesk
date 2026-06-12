import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { db, auth } from "./config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { socketAuthMiddleware, AuthenticatedSocket } from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware de autenticación global para Socket.IO
io.use(socketAuthMiddleware);

const PORT = process.env.PORT || process.env.REALTIME_PORT || 3001;

interface UserInfo {
  uid: string;
  username: string;
  roomId: string;
}

// Map<roomId, Map<socketId, UserInfo>>
const rooms = new Map<string, Map<string, UserInfo>>();

// Helper to get array of users in a room
function getParticipantsInRoom(roomId: string): UserInfo[] {
  const roomUsers = rooms.get(roomId);
  return roomUsers ? Array.from(roomUsers.values()) : [];
}

io.on("connection", (socket: AuthenticatedSocket) => {
  console.log("Usuario conectado:", socket.id, "UID:", socket.user?.uid);

  socket.on("join-room", (data: { roomId: string }) => {
    if (!socket.user) {
      return;
    }

    const { roomId } = data;
    const { uid, name, email } = socket.user;
    const username = name || email || "Anonymous";
    
    // Track user
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId)!.set(socket.id, { uid, username, roomId });
    
    socket.join(roomId);
    console.log(`Usuario ${username} (${uid}) se unió a la sala ${roomId}`);

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
      .catch((err) => console.error("Error al guardar mensaje en Firestore:", err));

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

  const handleLeaveRoom = (socketId: string) => {
    let roomIdToNotify: string | null = null;
    let userLeaving: string | null = null;

    for (const [roomId, users] of rooms.entries()) {
      if (users.has(socketId)) {
        userLeaving = users.get(socketId)!.username;
        users.delete(socketId);
        roomIdToNotify = roomId;
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }

    if (roomIdToNotify && userLeaving) {
      console.log(`Usuario ${userLeaving} salió de la sala ${roomIdToNotify}`);
      // Broadcast full updated list
      io.to(roomIdToNotify).emit("room-participants-update", getParticipantsInRoom(roomIdToNotify));
    }
  };

  socket.on("leave-room", () => {
    socket.leaveAll(); // Ensure they leave all socket rooms
    handleLeaveRoom(socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    handleLeaveRoom(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de tiempo real corriendo en puerto ${PORT}`);
});
