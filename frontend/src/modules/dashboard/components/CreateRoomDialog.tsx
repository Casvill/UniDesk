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

const ROOM_NAME_MIN_LENGTH = 3;
const ROOM_NAME_MAX_LENGTH = 35;

const validateRoomName = (name: string): string => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "El nombre de la sala es obligatorio.";
  }

  if (trimmedName.length < ROOM_NAME_MIN_LENGTH) {
    return `El nombre debe tener al menos ${ROOM_NAME_MIN_LENGTH} caracteres.`;
  }

  if (trimmedName.length > ROOM_NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${ROOM_NAME_MAX_LENGTH} caracteres.`;
  }

  const allowedCharacters = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .-]+$/;

  if (!allowedCharacters.test(trimmedName)) {
    return "El nombre solo puede contener letras, números, espacios, guiones o puntos.";
  }

  return "";
};

export function CreateRoomDialog({ open, onOpenChange, user }: CreateRoomDialogProps) {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [hasTouchedRoomName, setHasTouchedRoomName] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const roomNameError = validateRoomName(roomName);
  const isFormInvalid = Boolean(roomNameError);

  const handleCreate = async () => {
    setHasTouchedRoomName(true);

    if (!user || isFormInvalid || isCreating) return;

    try {
      setIsCreating(true);

      const token = await user.getIdToken();
      const newRoom = await api.createRoom(roomName.trim(), token);

      onOpenChange(false);
      setRoomName("");
      setHasTouchedRoomName(false);

      navigate(`/rooms/${newRoom.id}`);
    } catch (err) {
      console.error("Error al crear la sala:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const showRoomNameError = hasTouchedRoomName && roomNameError;

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
          <label
            htmlFor="new-room-name"
            className="block mb-2 text-sm font-semibold text-gray-700"
          >
            Nombre de la sala
          </label>

          <input
            type="text"
            id="new-room-name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onBlur={() => setHasTouchedRoomName(true)}
            placeholder="Ej: Grupo de estudio de cálculo"
            maxLength={ROOM_NAME_MAX_LENGTH}
            aria-invalid={Boolean(showRoomNameError)}
            aria-describedby={showRoomNameError ? "room-name-error" : undefined}
            className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent transition ${
              showRoomNameError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
          />

          <div className="mt-1 flex items-center justify-between">
            {showRoomNameError ? (
              <p id="room-name-error" className="text-sm text-red-600">
                {roomNameError}
              </p>
            ) : (
              <span />
            )}

            <span className="text-xs text-gray-500">
              {roomName.trim().length}/{ROOM_NAME_MAX_LENGTH}
            </span>
          </div>
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
            disabled={isFormInvalid || isCreating}
            className="bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creando..." : "Crear sala"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}