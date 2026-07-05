import { useEffect, useState } from "react";
import { Plus, Pencil, Info } from "lucide-react";
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
import type { Room } from "@/services/api";
import { showToast } from "@/shared/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: { getIdToken: () => Promise<string> } | null;
  mode?: "create" | "edit";
  room?: Room | null;
  onRoomUpdated?: (updatedRoom: Room) => void;
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
  mode = "create",
  room = null,
  onRoomUpdated,
}: CreateRoomDialogProps) {
  const navigate = useNavigate();

  const isEditMode = mode === "edit";

  const [roomName, setRoomName] = useState("");
  const [hasTouchedRoomName, setHasTouchedRoomName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roomError, setRoomError] = useState("");

  const initialName = isEditMode ? room?.name?.trim() ?? "" : "";
  const isUnchanged = isEditMode && roomName.trim() === initialName;
  const roomNameError = validateRoomName(roomName);
  const isFormInvalid = Boolean(roomNameError);
  const showRoomNameError = hasTouchedRoomName && roomNameError;

  const dialogDescriptionId = isEditMode
    ? "edit-room-description"
    : "create-room-description";

  const inputId = isEditMode
    ? `edit-room-name-${room?.id ?? "selected"}`
    : "new-room-name";

  const currentRoomNameId = isEditMode
    ? `current-room-name-${room?.id ?? "selected"}`
    : "";

  useEffect(() => {
    if (!open) return;

    setRoomName(isEditMode ? room?.name ?? "" : "");
    setHasTouchedRoomName(false);
    setRoomError("");
    setIsSaving(false);
  }, [open, isEditMode, room?.name]);

  const resetForm = () => {
    setRoomName("");
    setHasTouchedRoomName(false);
    setRoomError("");
    setIsSaving(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    setHasTouchedRoomName(true);
    setRoomError("");

    if (isFormInvalid || isSaving) return;

    const trimmedRoomName = roomName.trim();

    if (isEditMode) {
      if (!room) {
        setRoomError("No pudimos identificar la sala que deseas editar.");
        return;
      }

      if (!user) {
        setRoomError(
          "No pudimos validar tu sesión. Inicia sesión nuevamente e inténtalo otra vez."
        );
        return;
      }

      if (trimmedRoomName === room.name.trim()) {
        setRoomError("Escribe un nombre diferente al nombre actual.");
        return;
      }

      const loadingKey = showToast.loading(
        "Actualizando el nombre de la sala. Por favor espera."
      );

      try {
        setIsSaving(true);

        const token = await user.getIdToken();

        const updatedRoom = await api.updateRoom(
          room.id,
          { name: trimmedRoomName },
          token
        );

        onRoomUpdated?.(updatedRoom);

        showToast.close(loadingKey);
        showToast.success(
          "El nombre de la sala se actualizó correctamente."
        );

        setTimeout(() => {
          handleOpenChange(false);
        }, 700);
      } catch (err) {
        console.error("Error al actualizar la sala:", err);

        showToast.close(loadingKey);
        showToast.error(
          err instanceof Error
            ? err.message
            : "No pudimos actualizar el nombre de la sala. Inténtalo nuevamente."
        );

        setIsSaving(false);
      }

      return;
    }

    if (!user) {
      setRoomError(
        "No pudimos validar tu sesión. Inicia sesión nuevamente e inténtalo otra vez."
      );
      return;
    }

    try {
      setIsSaving(true);

      const token = await user.getIdToken();
      const newRoom = await api.createRoom(trimmedRoomName, token);

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

      setRoomError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputDescriptionIds = [
    "room-name-requirements",
    isEditMode ? currentRoomNameId : null,
    showRoomNameError ? "room-name-error" : null,
    roomError ? "room-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={dialogDescriptionId}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          document.getElementById(inputId)?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar nombre de sala" : "Crear sala de estudio"}
          </DialogTitle>

          <DialogDescription id={dialogDescriptionId}>
            {isEditMode
              ? "Actualiza el nombre de tu sala para mantenerla organizada en el dashboard."
              : "Dale un nombre a tu sala para empezar a estudiar en equipo."}
          </DialogDescription>
        </DialogHeader>

        <div>
          {isEditMode && room?.name && (
            <p
              id={currentRoomNameId}
              className="mb-3 text-sm text-gray-500"
              aria-live="polite"
            >
              Nombre actual:{" "}
              <span className="font-semibold text-gray-700">{room.name}</span>
            </p>
          )}

          <div className="flex items-center gap-1.5 mb-2">
            <label
              htmlFor={inputId}
              className="text-sm font-semibold text-gray-700"
            >
              {isEditMode ? "Nuevo nombre de la sala" : "Nombre de la sala"}
            </label>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                  aria-label="Requisitos del nombre de la sala"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>

              <TooltipContent side="right" className="max-w-70">
                El nombre debe tener entre 3 y 35 caracteres. Puedes usar
                letras, números, espacios, tildes, guiones o puntos.
              </TooltipContent>
            </Tooltip>
          </div>

          <p id="room-name-requirements" className="sr-only">
            El nombre debe tener entre 3 y 35 caracteres. Puedes usar letras,
            números, espacios, tildes, guiones o puntos.
          </p>

          <input
            type="text"
            id={inputId}
            value={roomName}
            onChange={(e) => {
              setRoomName(e.target.value);
              setRoomError("");
            }}
            onBlur={() => setHasTouchedRoomName(true)}
            placeholder="Ej: Grupo de estudio de cálculo"
            maxLength={ROOM_NAME_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={Boolean(showRoomNameError || roomError)}
            aria-describedby={inputDescriptionIds}
            className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
              showRoomNameError || roomError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
          />

          <div className="mt-1 flex items-center justify-between">
            {showRoomNameError ? (
              <p
                id="room-name-error"
                className="text-sm text-red-600"
                role="alert"
                aria-live="assertive"
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

          {roomError && (
            <p
              id="room-error"
              className="mt-3 text-sm text-red-600"
              role="alert"
              aria-live="assertive"
            >
              {roomError}
            </p>
          )}


        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              disabled={isSaving}
              className="bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label={
                isEditMode
                  ? "Cancelar edición del nombre de la sala"
                  : "Cancelar creación de sala"
              }
            >
              Cancelar
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isFormInvalid || isSaving || isUnchanged}
            aria-busy={isSaving}
            aria-label={
              isEditMode
                ? "Guardar nuevo nombre de la sala"
                : "Crear sala de estudio"
            }
            className="bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isEditMode ? (
              <Pencil className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}

            {isEditMode ? "Guardar cambios" : "Crear sala"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}