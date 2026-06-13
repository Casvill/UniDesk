import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: { getIdToken: () => Promise<string> } | null;
}

const ROOM_CODE_MIN_LENGTH = 4;

function normalizeRoomCode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function validateRoomCode(value: string) {
  if (!value) return "Ingresa el código de la sala para poder unirte.";
  if (value.length < ROOM_CODE_MIN_LENGTH)
    return `El código debe tener al menos ${ROOM_CODE_MIN_LENGTH} caracteres.`;
  return "";
}

function getJoinRoomErrorMessage(error: unknown) {
  const apiError = error as Error & { code?: string; status?: number };
  if (apiError.code === "backend/room-not-found" || apiError.status === 404)
    return "No encontramos una sala con ese código. Verifica el ID e inténtalo nuevamente.";
  if (apiError.code === "backend/unauthorized" || apiError.status === 401)
    return "Tu sesión expiró. Inicia sesión nuevamente para unirte a una sala.";
  if (apiError.code === "backend/forbidden" || apiError.status === 403)
    return "No tienes permisos para ingresar a esta sala.";
  if (apiError.code === "backend/network-error")
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";
  return "No pudimos verificar la sala. Revisa el código e inténtalo nuevamente.";
}

export function JoinRoomDialog({
  open,
  onOpenChange,
  user = null,
}: JoinRoomDialogProps) {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [roomCodeError, setRoomCodeError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = "join-room-dialog-code";

  const handleSubmit = async () => {
    const normalizedCode = normalizeRoomCode(roomCode);
    const validationError = validateRoomCode(normalizedCode);

    setRoomCode(normalizedCode);
    setRoomCodeError("");

    if (validationError) {
      setRoomCodeError(validationError);
      inputRef.current?.focus();
      return;
    }

    if (!user) {
      setRoomCodeError(
        "No pudimos validar tu sesión. Inicia sesión nuevamente e inténtalo otra vez."
      );
      inputRef.current?.focus();
      return;
    }

    try {
      setIsJoining(true);

      const token = await user.getIdToken();
      const room = await api.getRoomById(normalizedCode, token);

      onOpenChange(false);
      navigate(`/rooms/${room.id}`);
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      setRoomCodeError(getJoinRoomErrorMessage(error));
      inputRef.current?.focus();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Unirse a una sala</DialogTitle>
          <DialogDescription>
            Ingresa el código o ID de la sala para unirte como invitado.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-semibold text-gray-700"
          >
            Código o ID de la sala
          </label>

          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value);
              setRoomCodeError("");
            }}
            placeholder="Ej: aBcDeF123"
            disabled={isJoining}
            aria-invalid={Boolean(roomCodeError)}
            aria-describedby={roomCodeError ? "join-dialog-error" : undefined}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
              roomCodeError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
          />

          {roomCodeError && (
            <p
              id="join-dialog-error"
              className="mt-2 text-sm text-red-600"
              role="alert"
              aria-live="assertive"
            >
              {roomCodeError}
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <DialogClose asChild>
            <button
              type="button"
              disabled={isJoining}
              className="flex-1 bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancelar
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isJoining || !roomCode.trim()}
            aria-busy={isJoining}
            aria-label={
              isJoining
                ? "Verificando la sala, por favor espera"
                : "Unirse a la sala"
            }
            className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Validando...
              </>
            ) : (
              "Unirse"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
