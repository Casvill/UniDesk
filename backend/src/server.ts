import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase";
import { createUserProfile, getUserProfile, updateUserProfile, deleteUserProfile } from "./services/user.service";
import { checkUsernameAvailability } from "./services/username.service";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Backend de UniDesk funcionando B)"
  });
});

app.get("/test/username/:username", async (req, res) => {
  const available = await checkUsernameAvailability(req.params.username);
  res.json({ username: req.params.username, available });
});

db.collection("_health").doc("ping").set({ ok: true })
  .then(() => console.log("Prueba: Firestroe bien :)"))
  .catch((err) => console.error("Prueba: Firestore mal, error:", err));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});