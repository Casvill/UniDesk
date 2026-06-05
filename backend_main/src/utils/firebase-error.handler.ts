import { FirebaseError } from "firebase-admin";

interface HandledError {
  code: string;
  message: string;
  statusCode: number;
}

const firebaseErrorMap: Record<string, Omit<HandledError, "code">> = {
  // Auth
  "auth/email-already-exists": {
    message: "El correo electrónico ya está registrado.",
    statusCode: 409,
  },
  "auth/invalid-email": {
    message: "El correo electrónico no tiene un formato válido.",
    statusCode: 400,
  },
  "auth/weak-password": {
    message: "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.",
    statusCode: 400,
  },
  "auth/user-not-found": {
    message: "No existe una cuenta con ese correo electrónico.",
    statusCode: 404,
  },
  "auth/wrong-password": {
    message: "La contraseña es incorrecta.",
    statusCode: 401,
  },
  "auth/invalid-credential": {
    message: "Las credenciales son inválidas o han expirado.",
    statusCode: 401,
  },
  "auth/too-many-requests": {
    message: "Demasiados intentos fallidos. Intenta de nuevo más tarde.",
    statusCode: 429,
  },
  "auth/id-token-expired": {
    message: "La sesión ha expirado. Inicia sesión de nuevo.",
    statusCode: 401,
  },
  "auth/id-token-revoked": {
    message: "La sesión fue revocada. Inicia sesión de nuevo.",
    statusCode: 401,
  },
  // Firestore
  "not-found": {
    message: "El recurso solicitado no existe.",
    statusCode: 404,
  },
  "already-exists": {
    message: "El recurso ya existe.",
    statusCode: 409,
  },
  "permission-denied": {
    message: "No tienes permisos para realizar esta acción.",
    statusCode: 403,
  },
  "resource-exhausted": {
    message: "Se ha alcanzado el límite de operaciones. Intenta más tarde.",
    statusCode: 429,
  },
  unavailable: {
    message: "El servicio no está disponible en este momento. Intenta más tarde.",
    statusCode: 503,
  },
};

/**
 * Maneja y normaliza errores provenientes de Firebase (Auth y Firestore),
 * convirtiéndolos en una estructura consistente para respuestas HTTP.
 *
 * Comportamiento:
 * - Si el error es reconocido (según `firebaseErrorMap`), devuelve su mensaje y statusCode definido.
 * - Si el error es de Firebase pero no está mapeado, devuelve un error genérico (500).
 * - Si es un error estándar de JavaScript (`Error`), usa su mensaje.
 * - Si no se puede identificar el error, devuelve un mensaje genérico.
 *
 * @param error - Error capturado (puede ser de Firebase, Error estándar u otro tipo)
 * @returns Objeto con:
 *  - `code`: código del error
 *  - `message`: mensaje legible para el usuario
 *  - `statusCode`: código HTTP
 */
export function handleFirebaseError(error: unknown): HandledError {
  if (isFirebaseError(error)) {
    const mapped = firebaseErrorMap[error.code];

    if (mapped) {
      return { code: error.code, ...mapped };
    }

    return {
      code: error.code,
      message: "Ocurrió un error inesperado. Intenta de nuevo.",
      statusCode: 500,
    };
  }

  if (error instanceof Error) {
    return {
      code: "unknown",
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    code: "unknown",
    message: "Ocurrió un error desconocido.",
    statusCode: 500,
  };
}

/**
 * Determina si un valor corresponde a un error de Firebase.
 *
 * Se utiliza como type guard para permitir acceso seguro a `error.code`
 * dentro de `handleFirebaseError`.
 *
 * @param error - Valor a evaluar
 * @returns `true` si el error tiene la estructura de un FirebaseError
 */
function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as FirebaseError).code === "string"
  );
}