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

// Map socket.id to user info (for tracking)
interface UserInfo {
  uid: string;
  username: string;
  roomId: string;
}
const connectedUsers = new Map<string, UserInfo>();

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("join-room", (data: { roomId: string; uid: string; username: string }) => {
    const { roomId, uid, username } = data;
    socket.join(roomId);
    connectedUsers.set(socket.id, { uid, username, roomId });

    console.log(`Usuario ${username} (${uid}) se unió a la sala ${roomId}`);

    // Notify others in the room
    io.to(roomId).emit("presence-change", {
      type: "user-joined",
      user: { uid, username },
      roomId
    });
  });

  socket.on("leave-room", () => {
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      const { roomId, uid, username } = userInfo;
      socket.leave(roomId);
      connectedUsers.delete(socket.id);

      console.log(`Usuario ${username} (${uid}) salió de la sala ${roomId}`);

      // Notify others in the room
      io.to(roomId).emit("presence-change", {
        type: "user-left",
        user: { uid, username },
        roomId
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    
    // Auto-leave if connected
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      const { roomId, uid, username } = userInfo;
      connectedUsers.delete(socket.id);
      
      io.to(roomId).emit("presence-change", {
        type: "user-left",
        user: { uid, username },
        roomId
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de tiempo real corriendo en puerto ${PORT}`);
});
