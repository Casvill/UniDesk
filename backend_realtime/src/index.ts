import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

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

    // Broadcast message to the room (including sender for confirmation if needed, 
    // or use socket.to(roomId) to exclude sender)
    io.to(roomId).emit("new-message", {
      content: content.trim(),
      senderUid: uid,
      senderUsername: username,
      createdAt: new Date().toISOString()
    });
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
