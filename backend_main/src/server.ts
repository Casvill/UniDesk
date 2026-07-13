import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import userRoutes from "./routes/user.routes";
import roomRoutes from "./routes/room.routes";
import messageRoutes from "./routes/message.routes";
import turnRoutes from "./routes/turn.routes";

dotenv.config();

/**
 * Instancia principal de la aplicación Express del backend de UniDesk.
 *
 * Expone los recursos REST (`/users`, `/rooms`, `/messages`, `/turn`) y la
 * documentación interactiva de la API en `/api-docs` (Swagger UI).
 */
const app = express();

app.use(cors());
app.use(express.json());

/**
 * Puerto de escucha del servidor. Lee `PORT` del entorno y por defecto usa 3000.
 */
const PORT = process.env.PORT || 3000;

/**
 * Ruta raíz de salud (healthcheck).
 *
 * @swagger
 * /:
 *   get:
 *     summary: Healthcheck del backend
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: El servidor está activo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Backend de UniDesk funcionando B)"
 */
app.get("/", (req, res) => {
  res.json({
    message: "Backend de UniDesk funcionando B)"
  });
});

// Documentación interactiva de la API (OpenAPI / Swagger UI)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de los recursos de la API
app.use("/users", userRoutes);
app.use("/rooms", roomRoutes);
app.use("/messages", messageRoutes);
app.use("/turn", turnRoutes);

// Verificación de conexión con Firestore al arranque
db.collection("_health").doc("ping").set({ ok: true })
  .then(() => console.log("Firestore bien :)"))
  .catch((err) => console.error("Firestore mal, error:", err));

/**
 * Inicia el servidor HTTP en el puerto configurado.
 */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});