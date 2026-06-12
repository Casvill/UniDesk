import { Timestamp } from "firebase-admin/firestore";

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       description: Representa un mensaje enviado en una sala.
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del mensaje.
 *         roomId:
 *           type: string
 *           description: Identificador de la sala donde se envió el mensaje.
 *         senderUid:
 *           type: string
 *           description: UID del usuario que envió el mensaje.
 *         senderUsername:
 *           type: string
 *           description: Nombre de usuario del remitente.
 *         content:
 *           type: string
 *           description: Contenido del mensaje.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del mensaje.
 *       required:
 *         - id
 *         - roomId
 *         - senderUid
 *         - senderUsername
 *         - content
 *         - createdAt
 */
export interface Message {
  id: string;
  roomId: string;
  senderUid: string;
  senderUsername: string;
  content: string;
  createdAt: Timestamp;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMessageDTO:
 *       type: object
 *       description: Datos necesarios para enviar un nuevo mensaje.
 *       properties:
 *         roomId:
 *           type: string
 *         senderUid:
 *           type: string
 *         senderUsername:
 *           type: string
 *         content:
 *           type: string
 *       required:
 *         - roomId
 *         - senderUid
 *         - senderUsername
 *         - content
 */
export type CreateMessageDTO = Omit<Message, "id" | "createdAt">;
