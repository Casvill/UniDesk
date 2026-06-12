import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Room } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";

interface DeleteRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  user?: { getIdToken: () => Promise<string> } | null;
  onRoomDeleted?: (deletedRoomId: string) => void;
}

export function DeleteRoomDialog({
  open,
  onOpenChange,
  room,
  user = null,
  onRoomDeleted,
}: DeleteRoomDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const roomName = room?.name ?? "seleccionada";

  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
      setStatusMessage("");
      setDeleteError("");
    }
  }, [open]);

  const handleDelete = async () => {
    if (!room || isDeleting) return;

    if (!user) {
      setDeleteError(
        "No pudimos validar tu sesión. Inicia sesión nuevamente e inténtalo otra vez."
      );
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");
      setStatusMessage(`Eliminando la sala ${roomName}. Por favor espera.`);

      const token = await user.getIdToken();

      await api.deleteRoom(room.id, token);

      onRoomDeleted?.(room.id);

      setStatusMessage(`La sala ${roomName} fue eliminada correctamente.`);

      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    } catch (err) {
      console.error("Error al eliminar la sala:", err);

      const message =
        err instanceof Error
          ? err.message
          : "No pudimos eliminar la sala. Inténtalo nuevamente.";

      setDeleteError(message);
      setStatusMessage("");
    } finally {
      setIsDeleting(false);
    }
  };

  const describedBy = [
    "delete-room-description",
    statusMessage ? "delete-room-status" : null,
    deleteError ? "delete-room-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="alertdialog"
        aria-labelledby="delete-room-title"
        aria-describedby={describedBy}
        className="max-w-[512px] rounded-xl bg-white px-6 py-6 shadow-xl"
      >
        <DialogHeader className="text-left">
          <DialogTitle
            id="delete-room-title"
            className="text-xl font-bold text-slate-900"
          >
            ¿Eliminar sala?
          </DialogTitle>

          <DialogDescription
            id="delete-room-description"
            className="mt-2 text-sm leading-6 text-slate-500"
          >
            Esta acción es irreversible. Se eliminará la sala{" "}
            <span className="font-semibold text-slate-700">{roomName}</span> de
            tu dashboard.
          </DialogDescription>
        </DialogHeader>

        {statusMessage && (
          <p
            id="delete-room-status"
            className="sr-only"
            role="status"
            aria-live="assertive"
          >
            {statusMessage}
          </p>
        )}

        {deleteError && (
          <p
            id="delete-room-error"
            className="mt-2 text-sm text-red-600"
            role="alert"
            aria-live="assertive"
          >
            {deleteError}
          </p>
        )}

        <DialogFooter className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <button
              type="button"
              disabled={isDeleting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              aria-label="Cancelar eliminación de sala"
            >
              Cancelar
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-busy={isDeleting}
            aria-label={
              isDeleting
                ? `Eliminando la sala ${roomName}, por favor espera`
                : `Confirmar eliminación de la sala ${roomName}`
            }
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? "Eliminando..." : "Confirmar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}