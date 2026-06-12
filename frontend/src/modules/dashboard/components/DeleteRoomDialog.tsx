import { useEffect, useState } from "react";
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
}

export function DeleteRoomDialog({
  open,
  onOpenChange,
  room,
}: DeleteRoomDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const roomName = room?.name ?? "seleccionada";

  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
      setStatusMessage("");
    }
  }, [open]);

  const handleDelete = async () => {
    if (!room || isDeleting) return;

    setIsDeleting(true);
    setStatusMessage(`Eliminando la sala ${roomName}. Por favor espera.`);

    console.log("Eliminar sala:", {
      roomId: room.id,
      roomName: room.name,
    });

    setTimeout(() => {
      setIsDeleting(false);
      onOpenChange(false);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="alertdialog"
        aria-labelledby="delete-room-title"
        aria-describedby="delete-room-description delete-room-status"
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

        <p
          id="delete-room-status"
          className="sr-only"
          role="status"
          aria-live="assertive"
        >
          {statusMessage}
        </p>

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