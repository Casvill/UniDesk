import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  sendMessage,
  getMessagesByRoom,
  updateMessage,
  searchMessages,
} from "../services/message.service";
import { handleFirebaseError } from "../utils/firebase-error.handler";
import { db } from "../config/firebase";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: API para la gestión de mensajes de chat
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Enviar un nuevo mensaje
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageDTO'
 *     responses:
 *       201:
 *         description: Mensaje creado
 *       401:
 *         description: No autenticado
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const { roomId, content } = req.body;
    if (!roomId || !content) {
      res.status(400).json({ message: "roomId y content son requeridos" });
      return;
    }

    // Optional: verify if user is part of the room (not implemented yet in room service)
    
    const message = await sendMessage({
      roomId,
      content,
      senderUid: req.user.uid,
      senderUsername: req.user.name || "Anonymous", // User token might have name
    });

    res.status(201).json(message);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /messages/{roomId}:
 *   get:
 *     summary: Obtener mensajes de una sala
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID de la sala
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: startAfter
 *         schema:
 *           type: string
 *         description: ID del último mensaje para paginación
 *     responses:
 *       200:
 *         description: Lista de mensajes
 */
router.get("/:roomId", verifyToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const startAfter = req.query.startAfter as string;
    const messages = await getMessagesByRoom(req.params.roomId as string, limit, startAfter);
    res.json(messages);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /messages/{roomId}/search:
 *   get:
 *     summary: Buscar mensajes en una sala
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *       - in: query
 *         name: q
 *         required: true
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Mensajes encontrados
 */
router.get("/:roomId/search", verifyToken, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ message: "El término de búsqueda 'q' es requerido" });
      return;
    }
    const messages = await searchMessages(req.params.roomId as string, query);
    res.json(messages);
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

/**
 * @swagger
 * /messages/{id}:
 *   put:
 *     summary: Editar un mensaje
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del mensaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje actualizado
 *       403:
 *         description: No tienes permiso para editar este mensaje
 */
router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: "El contenido es requerido" });
      return;
    }

    // Verify ownership
    const messageDoc = await db.collection("messages").doc(req.params.id as string).get();
    if (!messageDoc.exists) {
      res.status(404).json({ message: "Mensaje no encontrado" });
      return;
    }

    const messageData = messageDoc.data();
    if (messageData?.senderUid !== req.user.uid) {
      res.status(403).json({ message: "No tienes permiso para editar este mensaje" });
      return;
    }

    await updateMessage(req.params.id as string, content);
    res.json({ message: "Mensaje actualizado exitosamente" });
  } catch (error) {
    const handled = handleFirebaseError(error);
    res.status(handled.statusCode).json({ message: handled.message });
  }
});

export default router;
