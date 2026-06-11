import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  createRoom,
  getRoom,
  getRoomsByOwner,
  listRooms,
  updateRoom,
  deleteRoom,
  deleteRoomsByOwner,
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
 *     summary: Listar salas de estudio
 *     description: Retorna una lista de salas. Por defecto retorna las del usuario autenticado, pero permite listar todas con paginación.
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Si es true, retorna todas las salas. Si es false (por defecto), solo las del usuario.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad máxima de salas a retornar.
 *       - in: query
 *         name: startAfter
 *         schema:
 *           type: string
 *         description: ID de la sala desde la cual empezar (para paginación).
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

    const all = req.query.all === "true";
    const limit = parseInt(req.query.limit as string) || 10;
    const startAfter = req.query.startAfter as string;

    if (all) {
      const rooms = await listRooms(limit, startAfter);
      res.json(rooms);
    } else {
      const rooms = await getRoomsByOwner(req.user.uid);
      res.json(rooms);
    }
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
 * /rooms:
 *   delete:
 *     summary: Eliminar todas las salas del usuario autenticado
 *     description: Elimina en masa todas las salas de las que el usuario es propietario y retorna los datos de las salas eliminadas.
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: Todas las salas eliminadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todas tus salas han sido eliminadas exitosamente"
 *                 deletedRooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 *       401:
 *         description: No autenticado
 */
router.delete("/", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const deletedRooms = await deleteRoomsByOwner(req.user.uid);
    res.json({ 
      message: "Todas tus salas han sido eliminadas exitosamente",
      deletedRooms 
    });
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
