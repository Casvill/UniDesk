import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase";
import { createUserProfile, getUserProfile, updateUserProfile, deleteUserProfile } from "./services/user.service";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Backend funcionando 🚀"
  });
});

db.collection("_health").doc("ping").set({ ok: true })
  .then(() => console.log("Prueba: Firestroe bien :)"))
  .catch((err) => console.error("Prueba: Firestore mal, error:", err));

app.post("/test/user", async (req, res) => {
  const user = await createUserProfile({
    uid: "test-uid-123",
    username: "juantest",
    email: "juan@test.com",
    displayName: "Juan Test",
    photoURL: "",
    provider: "password",
  });
  res.json(user);
});

app.get("/test/user/:uid", async (req, res) => {
  const user = await getUserProfile(req.params.uid);
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});