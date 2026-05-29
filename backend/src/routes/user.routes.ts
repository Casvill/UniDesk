import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../services/user.service";
import { checkUsernameAvailability } from "../services/username.service";
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - displayName
 *             properties:
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *               photoURL:
 *                 type: string
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token requerido o inválido
 *       409:
 *         description: El username ya está en uso o el usuario ya tiene un perfil
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

    const profile = await createUserProfile({
      uid: req.user.uid,
      username,
      email: req.user.email ?? "",
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
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
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
 *       400:
 *         description: Username inválido
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
 * /users/{uid}:
 *   get:
 *     summary: Obtener perfil de usuario
 *     description: Retorna el perfil público de un usuario por su UID.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Token requerido o inválido
 *       404:
 *         description: Usuario no encontrado
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
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
 *       403:
 *         description: No tienes permiso para modificar este perfil
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El username ya está en uso
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
 *       Elimina el perfil en Firestore y la cuenta en Firebase Auth.
 *       Solo el dueño de la cuenta puede eliminarla.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta eliminada exitosamente
 *       401:
 *         description: Token requerido o inválido
 *       403:
 *         description: No tienes permiso para eliminar esta cuenta
 *       404:
 *         description: Usuario no encontrado
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

export default router;
