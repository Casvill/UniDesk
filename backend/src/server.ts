import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import userRoutes from "./routes/user.routes";

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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/users", userRoutes);

db.collection("_health").doc("ping").set({ ok: true })
  .then(() => console.log("Firestore bien :)"))
  .catch((err) => console.error("Firestore mal, error:", err));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});