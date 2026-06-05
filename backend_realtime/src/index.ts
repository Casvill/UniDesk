import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase";
import { Timestamp } from "firebase-admin/firestore";

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

const PORT = process.env.REALTIME_PORT || 3001;

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

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("join-room", (data: { roomId: string; uid: string; username: string }) => {
    const { roomId, uid, username } = data;
    
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
      return;
    }

    // Basic validation
    if (!content || content.trim().length === 0) {
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

  socket.on("edit-message", (data: { messageId: string; newContent: string }) => {
    const { messageId, newContent } = data;

    if (!messageId || !newContent || newContent.trim().length === 0) {
      return;
    }

    // Optional: verify sender info from socket session
    // For now, we update it in Firestore and broadcast the update
    db.collection("messages").doc(messageId).update({
      content: newContent.trim(),
      updatedAt: Timestamp.now()
    })
    .then(() => {
      console.log(`Mensaje ${messageId} actualizado`);
      // Broadcast update to the room
      // We need to know which room the message belongs to. 
      // For simplicity, we can just broadcast to all rooms or fetch the room first.
      // Better: find the user's current room.
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
    })
    .catch((err) => console.error("Error al actualizar mensaje:", err));
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
