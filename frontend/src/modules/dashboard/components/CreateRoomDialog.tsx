import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { api } from "@/services/api";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { getIdToken: () => Promise<string> } | null;
}

export function CreateRoomDialog({ open, onOpenChange, user }: CreateRoomDialogProps) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");

  const handleCreate = async () => {
    if (!user || !roomName.trim()) return;
    try {
      const token = await user.getIdToken();
      const newRoom = await api.createRoom(roomName.trim(), token);
      onOpenChange(false);
      setRoomName("");
      navigate(`/rooms/${newRoom.id}`);
    } catch (err) {
      console.error("Error al crear la sala:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear sala de estudio</DialogTitle>
          <DialogDescription>
            Dale un nombre a tu sala para empezar a estudiar en equipo.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label htmlFor="new-room-name" className="block mb-2 text-sm font-semibold text-gray-700">
            Nombre de la sala
          </label>
          <input
            type="text"
            id="new-room-name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Ej: Grupo de estudio de cálculo"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              className="bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
            >
              Cancelar
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleCreate}
            className="bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear sala
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
