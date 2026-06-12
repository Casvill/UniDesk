import { createRoom } from "../services/room.service";
import admin from "../config/firebase";

/**
 * Script para inicializar la colección 'rooms' en Firestore.
 * Para que una colección aparezca en el Firebase Console, debe tener al menos un documento.
 */
async function initializeRooms() {
  console.log("🚀 Iniciando inicialización de Firestore...");

  try {
    const placeholderRoom = await createRoom({
      name: "Sala de Bienvenida - UniDesk",
      ownerUid: "system-admin",
    });

    console.log("✅ Colección 'rooms' creada exitosamente.");
    console.log("Documento inicial:", placeholderRoom);
    
  } catch (error) {
    console.error("❌ Error al inicializar Firestore:", error);
  } finally {
    // Cerramos la conexión para que el script termine
    await admin.app().delete();
  }
}

initializeRooms();
