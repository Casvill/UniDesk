import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
  isLoading?: boolean;
  loadingLabel?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Aceptar",
  onConfirm,
  variant = "default",
  isLoading = false,
  loadingLabel = "Procesando...",
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[512px] rounded-xl bg-white px-6 py-6 shadow-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <button
              type="button"
              disabled={isLoading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className={`rounded-xl px-5 py-3 font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
              isDestructive
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                : "bg-primary text-white hover:opacity-90 focus:ring-primary-500"
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
