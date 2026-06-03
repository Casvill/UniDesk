import { Timestamp } from "firebase-admin/firestore";

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       description: Representa una sala de estudio en el sistema.
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único de la sala (ID del documento en Firestore).
 *           example: "room_123456"
 *         name:
 *           type: string
 *           description: Nombre de la sala de estudio.
 *           example: "Cálculo Diferencial - Grupo A"
 *         ownerUid:
 *           type: string
 *           description: UID del usuario que creó y es propietario de la sala.
 *           example: "abc123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la sala.
 *           example: "2026-06-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización de la sala.
 *           example: "2026-06-01T12:30:00Z"
 *       required:
 *         - id
 *         - name
 *         - ownerUid
 *         - createdAt
 *         - updatedAt
 */
export interface Room {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRoomDTO:
 *       type: object
 *       description: Datos necesarios para crear una nueva sala de estudio.
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre de la sala.
 *           example: "Introducción a la Programación"
 *         ownerUid:
 *           type: string
 *           description: UID del propietario de la sala.
 *           example: "abc123"
 *       required:
 *         - name
 *         - ownerUid
 */
export type CreateRoomDTO = Pick<Room, "name" | "ownerUid">;

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateRoomDTO:
 *       type: object
 *       description: Datos permitidos para actualizar una sala de estudio.
 *       properties:
 *         name:
 *           type: string
 *           description: Nuevo nombre de la sala.
 *           example: "Programación Avanzada"
 */
export type UpdateRoomDTO = Partial<Pick<Room, "name">>;
