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

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de tiempo real corriendo en puerto ${PORT}`);
});
