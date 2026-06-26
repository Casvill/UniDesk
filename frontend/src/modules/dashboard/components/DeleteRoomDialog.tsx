import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Room } from "@/services/api";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
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

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Eliminar sala?"
      description={
        <>
          Esta acción es irreversible. Se eliminará la sala{" "}
          <span className="font-semibold text-slate-700">{roomName}</span>{" "}
          y no se podrá volver a ingresar.
        </>
      }
      confirmLabel={isDeleting ? "Eliminando..." : "Confirmar"}
      variant="destructive"
      isLoading={isDeleting}
      onConfirm={handleDelete}
    />
  );
}
