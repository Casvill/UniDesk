import { useState, useEffect, useCallback } from "react";
import { api, Room } from "@/services/api";

function getRoomTimestamp(ts: unknown): number {
  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    return (ts as { seconds: number }).seconds;
  }
  if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
    return (ts as { _seconds: number })._seconds;
  }
  if (typeof ts === "string") {
    return new Date(ts).getTime() / 1000;
  }
  return 0;
}

function sortRoomsByNewest(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    const ta = getRoomTimestamp(a.createdAt);
    const tb = getRoomTimestamp(b.createdAt);
    return tb - ta;
  });
}

export function useRooms(user: { getIdToken: () => Promise<string> } | null) {
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const fetchRooms = useCallback(async () => {
    if (!user) {
      setActiveRooms([]);
      setIsLoadingRooms(false);
      setRoomsError("");
      return;
    }

    setIsLoadingRooms(true);
    setRoomsError("");

    try {
      const token = await user.getIdToken();
      const rooms = await api.listRooms(token);

      setActiveRooms(sortRoomsByNewest(rooms));
    } catch (err) {
      console.error("Error al cargar salas:", err);

      const message =
        err instanceof Error
          ? err.message
          : "No pudimos cargar tus salas. Inténtalo nuevamente.";

      setRoomsError(message);
      setActiveRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    activeRooms,
    isLoadingRooms,
    roomsError,
    refetchRooms: fetchRooms,
  };
}