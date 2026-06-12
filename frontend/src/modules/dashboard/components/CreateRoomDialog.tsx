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

export function CreateRoomDialog({
  open,
  onOpenChange,
  user,
}: CreateRoomDialogProps) {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [hasTouchedRoomName, setHasTouchedRoomName] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createRoomError, setCreateRoomError] = useState("");

  const roomNameError = validateRoomName(roomName);
  const isFormInvalid = Boolean(roomNameError);
  const showRoomNameError = hasTouchedRoomName && roomNameError;

  const resetForm = () => {
    setRoomName("");
    setHasTouchedRoomName(false);
    setCreateRoomError("");
    setIsCreating(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleCreate = async () => {
    setHasTouchedRoomName(true);
    setCreateRoomError("");

    if (isFormInvalid || isCreating) return;

    if (!user) {
      setCreateRoomError(
        "No pudimos validar tu sesión. Inicia sesión nuevamente e inténtalo otra vez."
      );
      return;
    }

    try {
      setIsCreating(true);

      const token = await user.getIdToken();
      const newRoom = await api.createRoom(roomName.trim(), token);

      if (!newRoom.id) {
        throw new Error("El servidor no devolvió el ID de la sala creada.");
      }

      handleOpenChange(false);
      navigate(`/rooms/${newRoom.id}`);
    } catch (err) {
      console.error("Error al crear la sala:", err);

      const message =
        err instanceof Error
          ? err.message
          : "No pudimos crear la sala. Inténtalo nuevamente.";

      setCreateRoomError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const inputDescriptionIds = [
    "room-name-help",
    showRoomNameError ? "room-name-error" : null,
    createRoomError ? "create-room-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby="create-room-description">
        <DialogHeader>
          <DialogTitle>Crear sala de estudio</DialogTitle>

          <DialogDescription id="create-room-description">
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
            onChange={(e) => {
              setRoomName(e.target.value);
              setCreateRoomError("");
            }}
            onBlur={() => setHasTouchedRoomName(true)}
            placeholder="Ej: Grupo de estudio de cálculo"
            maxLength={ROOM_NAME_MAX_LENGTH}
            disabled={isCreating}
            aria-invalid={Boolean(showRoomNameError || createRoomError)}
            aria-describedby={inputDescriptionIds}
            className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
              showRoomNameError || createRoomError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
          />

          <p id="room-name-help" className="mt-1 text-xs text-gray-500">
            El nombre debe tener entre 3 y 35 caracteres. Puedes usar letras,
            números, espacios, tildes, guiones o puntos.
          </p>

          <div className="mt-1 flex items-center justify-between">
            {showRoomNameError ? (
              <p
                id="room-name-error"
                className="text-sm text-red-600"
                role="alert"
              >
                {roomNameError}
              </p>
            ) : (
              <span />
            )}

            <span
              className="text-xs text-gray-500"
              aria-label={`${roomName.trim().length} de ${ROOM_NAME_MAX_LENGTH} caracteres usados`}
            >
              {roomName.trim().length}/{ROOM_NAME_MAX_LENGTH}
            </span>
          </div>

          {createRoomError && (
            <p
              id="create-room-error"
              className="mt-3 text-sm text-red-600"
              role="alert"
              aria-live="assertive"
            >
              {createRoomError}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              disabled={isCreating}
              className="bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Cancelar creación de sala"
            >
              Cancelar
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleCreate}
            disabled={isFormInvalid || isCreating}
            aria-busy={isCreating}
            aria-label={
              isCreating
                ? "Creando sala, por favor espera"
                : "Crear sala de estudio"
            }
            className="bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {isCreating ? "Creando..." : "Crear sala"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}