/**
 * @swagger
 * components:
 *   schemas:
 *     ApiError:
 *       type: object
 *       description: Error estándar de la API.
 *       properties:
 *         message:
 *           type: string
 *           description: Descripción del error.
 *           example: "Usuario no encontrado"
 *       required:
 *         - message
 *
 *     UserProfile:
 *       type: object
 *       description: Representa el perfil de un usuario en el sistema.
 *       properties:
 *         uid:
 *           type: string
 *           description: Identificador único del usuario (UID de Firebase).
 *           example: "abc123"
 *         username:
 *           type: string
 *           description: Nombre de usuario único.
 *           example: "juan_dev"
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *           example: "juan@email.com"
 *         displayName:
 *           type: string
 *           description: Nombre visible del usuario.
 *           example: "Juan Cortés"
 *         photoURL:
 *           type: string
 *           format: uri
 *           description: URL de la foto de perfil.
 *           example: "https://example.com/photo.jpg"
 *         provider:
 *           type: string
 *           description: Proveedor de autenticación.
 *           enum: ["password", "google.com"]
 *           example: "google.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario.
 *           example: "2026-05-28T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización.
 *           example: "2026-05-28T12:30:00Z"
 *       required:
 *         - uid
 *         - username
 *         - email
 *         - provider
 *         - createdAt
 *         - updatedAt
 */
export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: "password" | "google.com";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserDTO:
 *       type: object
 *       description: Datos necesarios para crear un usuario.
 *       properties:
 *         uid:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         displayName:
 *           type: string
 *         photoURL:
 *           type: string
 *           format: uri
 *         provider:
 *           type: string
 *           enum: ["password", "google.com"]
 *       required:
 *         - uid
 *         - username
 *         - email
 *         - provider
 */
export type CreateUserDTO = Omit<UserProfile, "createdAt" | "updatedAt">;

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserDTO:
 *       type: object
 *       description: Datos permitidos para actualizar un usuario (parcial).
 *       properties:
 *         username:
 *           type: string
 *         displayName:
 *           type: string
 *         photoURL:
 *           type: string
 *           format: uri
 */
export type UpdateUserDTO = Partial<Pick<UserProfile, "username" | "displayName" | "photoURL" | "email">>;