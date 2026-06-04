import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  createRoom,
  getRoom,
  getRoomsByOwner,
  updateRoom,
  deleteRoom,
} from "../services/room.service";
import { handleFirebaseError } from "../utils/firebase-error.handler";
import { db } from "../config/firebase";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: API para la gestión de salas de estudio
 */

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Crear una nueva sala de estudio
 *     description: Crea una sala en Firestore vinculándola al usuario autenticado.
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cálculo 1 - Repaso"
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Sala creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       401:
 *         description: No autenticado
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const { name } = req.body;
    if (!name) {
      res.status(400).json({ message: "El nombre de la sala es requerido" });
      return;
    }

    const room = await createRoom({
      name,
      ownerUid: req.user.uid,
    });

    res.status(201).json(room);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Listar salas del usuario autenticado
 *     description: Retorna todas las salas donde el usuario es propietario.
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: Lista de salas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const rooms = await getRoomsByOwner(req.user.uid);
    res.json(rooms);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Obtener detalle de una sala
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la sala
 *     responses:
 *       200:
 *         description: Detalle de la sala
 *       404:
 *         description: Sala no encontrada
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const room = await getRoom(req.params.id);
    if (!room) {
      res.status(404).json({ message: "Sala no encontrada" });
      return;
    }
    res.json(room);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Actualizar una sala
 *     description: Permite editar el nombre de la sala. Solo el propietario puede hacerlo.
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoomDTO'
 *     responses:
 *       200:
 *         description: Sala actualizada
 *       403:
 *         description: No tienes permiso para editar esta sala
 */
router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const room = await getRoom(req.params.id);
    if (!room) {
      res.status(404).json({ message: "Sala no encontrada" });
      return;
    }

    if (room.ownerUid !== req.user.uid) {
      res.status(403).json({ message: "No tienes permiso para editar esta sala" });
      return;
    }

    const updatedRoom = await updateRoom(req.params.id, req.body);
    res.json(updatedRoom);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Eliminar una sala
 *     description: Solo el propietario puede eliminar la sala.
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Sala eliminada
 *       403:
 *         description: No tienes permiso para eliminar esta sala
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const room = await getRoom(req.params.id);
    if (!room) {
      res.status(404).json({ message: "Sala no encontrada" });
      return;
    }

    if (room.ownerUid !== req.user.uid) {
      res.status(403).json({ message: "No tienes permiso para eliminar esta sala" });
      return;
    }

    await deleteRoom(req.params.id);
    res.json({ message: "Sala eliminada exitosamente" });
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

export default router;
