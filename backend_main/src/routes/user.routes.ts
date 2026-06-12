import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../services/user.service";
import { checkUsernameAvailability } from "../services/username.service";
import { checkEmailAvailability } from "../services/email.service";
import { handleFirebaseError } from "../utils/firebase-error.handler";

const router = Router();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear perfil de usuario tras autenticación
 *     description: >
 *       Crea el perfil en Firestore usando los datos del token Firebase
 *       (uid, email, provider). El body solo incluye campos de perfil.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDTO'
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Token requerido o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: El username ya está en uso o el usuario ya tiene un perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const existing = await getUserProfile(req.user.uid);
    if (existing) {
      res.status(409).json({ message: "El usuario ya tiene un perfil" });
      return;
    }

    const { username, displayName, photoURL } = req.body;
    if (!username || !displayName) {
      res.status(400).json({ message: "username y displayName son requeridos" });
      return;
    }

    const provider = req.user.firebase?.sign_in_provider === "google.com"
      ? "google.com" as const
      : "password" as const;

    const email = req.user.email ?? "";
    const allowedDomains = [".edu", ".edu.co", ".gov", ".gov.co", ".com.co", ".co"];
    const isInstitutional = allowedDomains.some(domain => email.endsWith(domain));

    if (!isInstitutional) {
      res.status(400).json({ message: "El correo debe ser institucional (.edu, .edu.co, .gov, .gov.co, .com.co, .co)" });
      return;
    }

    const profile = await createUserProfile({
      uid: req.user.uid,
      username,
      email,
      displayName,
      photoURL: photoURL ?? "",
      provider,
    });

    res.status(201).json(profile);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /users/username/{username}/available:
 *   get:
 *     summary: Verificar disponibilidad de username
 *     description: Endpoint público. Retorna si un username está disponible.
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         description: Nombre de usuario a verificar
 *         schema:
 *           type: string
 *           example: "juan_dev"
 *     responses:
 *       200:
 *         description: Resultado de disponibilidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Username inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/username/:username/available", async (req: Request, res: Response) => {
  try {
    const available = await checkUsernameAvailability(String(req.params.username));
    res.json({ available });
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /users/email/{email}/available:
 *   get:
 *     summary: Verificar disponibilidad de correo
 *     description: Endpoint público. Retorna si un correo está disponible (no registrado por otro usuario).
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: Correo electrónico a verificar
 *         schema:
 *           type: string
 *           example: "juan@email.com"
 *       - in: query
 *         name: excludeUid
 *         required: false
 *         description: UID del usuario actual para excluirlo de la verificación
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de disponibilidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   example: true
 */
router.get("/email/:email/available", async (req: Request, res: Response) => {
  try {
    const email = String(req.params.email);
    const excludeUid = String(req.query.excludeUid || "");
    const available = await checkEmailAvailability(email, excludeUid || undefined);
    res.json({ available });
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /users/{uid}:
 *   get:
 *     summary: Obtener perfil de usuario
 *     description: Retorna el perfil público de un usuario por su UID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: UID de Firebase del usuario
 *         schema:
 *           type: string
 *           example: "abc123"
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Token requerido o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:uid", verifyToken, async (req: Request, res: Response) => {
  try {
    const profile = await getUserProfile(String(req.params.uid));
    if (!profile) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    res.json(profile);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /users/{uid}:
 *   put:
 *     summary: Actualizar perfil de usuario
 *     description: >
 *       Actualiza el perfil del usuario autenticado.
 *       Solo el dueño de la cuenta puede actualizar su perfil.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: UID de Firebase del usuario
 *         schema:
 *           type: string
 *           example: "abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDTO'
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Token requerido o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: No tienes permiso para modificar este perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: El username ya está en uso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put("/:uid", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    if (req.user.uid !== String(req.params.uid)) {
      res.status(403).json({ message: "No tienes permiso para modificar este perfil" });
      return;
    }

    const profile = await updateUserProfile(String(req.params.uid), req.body);
    res.json(profile);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /users/{uid}:
 *   delete:
 *     summary: Eliminar cuenta de usuario
 *     description: >
 *       Elimina el perfil en Firestore, la cuenta en Firebase Auth y 
 *       todas las salas de estudio propiedad del usuario (eliminación en cascada).
 *       Solo el dueño de la cuenta puede eliminarla.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: UID de Firebase del usuario
 *         schema:
 *           type: string
 *           example: "abc123"
 *     responses:
 *       200:
 *         description: Cuenta eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cuenta eliminada exitosamente"
 *       401:
 *         description: Token requerido o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: No tienes permiso para eliminar esta cuenta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete("/:uid", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    if (req.user.uid !== String(req.params.uid)) {
      res.status(403).json({ message: "No tienes permiso para eliminar esta cuenta" });
      return;
    }

    await deleteUserProfile(String(req.params.uid));
    res.json({ message: "Cuenta eliminada exitosamente" });
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * Router de Express con las rutas del recurso de usuarios.
 *
 * - POST   /users                          → Crear perfil (auth)
 * - GET    /users/username/{username}/available → Verificar disponibilidad (público)
 * - GET    /users/email/{email}/available  → Verificar disponibilidad de email (público)
 * - GET    /users/{uid}                     → Obtener perfil (auth)
 * - PUT    /users/{uid}                     → Actualizar perfil (auth, dueño)
 * - DELETE /users/{uid}                     → Eliminar cuenta (auth, dueño)
 */
export default router;
