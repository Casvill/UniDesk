import { db } from "../config/firebase";
import { Message, CreateMessageDTO } from "../types/message.types";
import { Timestamp } from "firebase-admin/firestore";

const MESSAGES_COLLECTION = "messages";

/**
 * (C) Crea un nuevo mensaje en Firestore.
 * 
 * @swagger
 * /messages:
 *   post:
 *     summary: Enviar un nuevo mensaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageDTO'
 *     responses:
 *       200:
 *         description: Mensaje creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 * 
 * @param data - Datos iniciales del mensaje
 * @returns El mensaje creado con su ID y createdAt
 */
export async function sendMessage(data: CreateMessageDTO): Promise<Message> {
  const messageRef = db.collection(MESSAGES_COLLECTION).doc();
  const now = Timestamp.now();

  const newMessage: Message = {
    id: messageRef.id,
    ...data,
    createdAt: now,
  };

  await messageRef.set(newMessage);
  return newMessage;
}

/**
 * (R) Obtiene los mensajes de una sala ordenados por fecha de creación (de más antiguo a más nuevo).
 * 
 * @swagger
 * /messages/{roomId}:
 *   get:
 *     summary: Obtener mensajes de una sala
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 * 
 * @param roomId - ID de la sala
 * @param limit - Cantidad máxima de mensajes
 * @returns Lista de mensajes
 */
export async function getMessagesByRoom(roomId: string, limit: number = 50): Promise<Message[]> {
  const snapshot = await db.collection(MESSAGES_COLLECTION)
    .where("roomId", "==", roomId)
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => doc.data() as Message);
}
