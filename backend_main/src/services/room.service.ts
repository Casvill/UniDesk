import { db } from "../config/firebase";
import { Room, CreateRoomDTO, UpdateRoomDTO } from "../types/room.types";
import { Timestamp } from "firebase-admin/firestore";

const ROOMS_COLLECTION = "rooms";

/**
 * (C) Crea una nueva sala de estudio en Firestore.
 * 
 * @param data - Datos iniciales de la sala (name, ownerUid)
 * @returns La sala creada con su ID y timestamps
 */
export async function createRoom(data: CreateRoomDTO): Promise<Room> {
  const roomRef = db.collection(ROOMS_COLLECTION).doc();
  const now = Timestamp.now();

  const newRoom: Room = {
    id: roomRef.id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await roomRef.set(newRoom);
  return newRoom;
}

/**
 * (R) Obtiene una sala de estudio por su ID.
 * 
 * @param id - ID de la sala
 * @returns La sala o null si no existe
 */
export async function getRoom(id: string): Promise<Room | null> {
  const doc = await db.collection(ROOMS_COLLECTION).doc(id).get();

  if (!doc.exists) return null;

  return doc.data() as Room;
}

/**
 * (R) Obtiene todas las salas pertenecientes a un propietario.
 * 
 * @param ownerUid - UID del propietario
 * @returns Lista de salas
 */
export async function getRoomsByOwner(ownerUid: string): Promise<Room[]> {
  const snapshot = await db.collection(ROOMS_COLLECTION)
    .where("ownerUid", "==", ownerUid)
    .get();

  return snapshot.docs.map(doc => doc.data() as Room);
}

/**
 * (R) Lista salas de forma paginada.
 * 
 * @param limit - Cantidad máxima de salas a retornar
 * @param startAfter - ID de la sala desde la cual empezar (para paginación)
 * @returns Lista de salas
 */
export async function listRooms(limit: number = 10, startAfter?: string): Promise<Room[]> {
  let query = db.collection(ROOMS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (startAfter) {
    const lastDoc = await db.collection(ROOMS_COLLECTION).doc(startAfter).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data() as Room);
}

/**
 * (U) Actualiza el nombre de una sala de estudio.
 * 
 * @param id - ID de la sala
 * @param data - Datos a actualizar (nombre)
 * @returns La sala actualizada
 */
export async function updateRoom(id: string, data: UpdateRoomDTO): Promise<Room> {
  const docRef = db.collection(ROOMS_COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`La sala con ID ${id} no existe`);
  }

  const currentData = doc.data() as Room;
  const updated = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  await docRef.update(updated);
  return { ...currentData, ...updated };
}

/**
 * (D) Elimina una sala de estudio.
 * 
 * @param id - ID de la sala
 */
export async function deleteRoom(id: string): Promise<void> {
  const docRef = db.collection(ROOMS_COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`La sala con ID ${id} no existe`);
  }

  await docRef.delete();
}

/**
 * (D) Elimina en masa todas las salas de un propietario.
 * 
 * @param ownerUid - UID del propietario
 */
export async function deleteRoomsByOwner(ownerUid: string): Promise<void> {
  const snapshot = await db.collection(ROOMS_COLLECTION)
    .where("ownerUid", "==", ownerUid)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
