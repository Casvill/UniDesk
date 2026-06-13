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
import { showToast } from "@/shared/components/ui/toast";

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

  const roomName = room?.name ?? "seleccionada";

  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!room || isDeleting) return;

    if (!user) {
      showToast.error(
        "No pudimos validar tu sesión. Inicia sesión nuevamente e inténtalo otra vez."
      );
      return;
    }

    const loadingKey = showToast.loading(
      `Eliminando la sala ${roomName}. Por favor espera.`
    );

    try {
      setIsDeleting(true);

      const token = await user.getIdToken();

      await api.deleteRoom(room.id, token);

      onRoomDeleted?.(room.id);

      showToast.close(loadingKey);
      showToast.success(`La sala ${roomName} fue eliminada correctamente.`);

      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    } catch (err) {
      console.error("Error al eliminar la sala:", err);

      showToast.close(loadingKey);
      showToast.error(
        err instanceof Error
          ? err.message
          : "No pudimos eliminar la sala. Inténtalo nuevamente."
      );

      setIsDeleting(false);
    }
  };

  const describedBy = "delete-room-description";

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
            aria-label={`Confirmar eliminación de la sala ${roomName}`}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Confirmar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}