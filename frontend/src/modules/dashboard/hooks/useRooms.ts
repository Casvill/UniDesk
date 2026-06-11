import { useState, useEffect, useCallback } from "react";
import { api, Room } from "@/services/api";

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

      setActiveRooms(rooms);
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