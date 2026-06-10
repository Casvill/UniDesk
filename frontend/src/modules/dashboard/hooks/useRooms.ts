import { useState, useEffect } from "react";
import { api, Room } from "@/services/api";

export function useRooms(user: { getIdToken: () => Promise<string> } | null) {
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const token = await user.getIdToken();
        const rooms = await api.listRooms(token);
        setActiveRooms(rooms);
      } catch (err) {
        console.error("Error al cargar salas:", err);
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [user]);

  return { activeRooms, isLoadingRooms };
}
