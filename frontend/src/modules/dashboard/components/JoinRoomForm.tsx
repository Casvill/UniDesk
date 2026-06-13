import { useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";

interface JoinRoomFormProps {
  user?: { getIdToken: () => Promise<string> } | null;
}

const ROOM_CODE_MIN_LENGTH = 4;

function normalizeRoomCode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function validateRoomCode(value: string) {
  if (!value) {
    return "Ingresa el código de la sala para poder unirte.";
  }

  if (value.length < ROOM_CODE_MIN_LENGTH) {
    return `El código debe tener al menos ${ROOM_CODE_MIN_LENGTH} caracteres.`;
  }

  return "";
}

function getJoinRoomErrorMessage(error: unknown) {
  const apiError = error as Error & {
    code?: string;
    status?: number;
  };

  if (
    apiError.code === "backend/room-not-found" ||
    apiError.status === 404
  ) {
    return "No encontramos una sala con ese código. Verifica el ID e inténtalo nuevamente.";
  }

  if (
    apiError.code === "backend/unauthorized" ||
    apiError.status === 401
  ) {
    return "Tu sesión expiró. Inicia sesión nuevamente para unirte a una sala.";
  }

  if (
    apiError.code === "backend/forbidden" ||
    apiError.status === 403
  ) {
    return "No tienes permisos para ingresar a esta sala.";
  }

  if (apiError.code === "backend/network-error") {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";
  }

  return "No pudimos verificar la sala. Revisa el código e inténtalo nuevamente.";
}

export function JoinRoomForm({ user = null }: JoinRoomFormProps) {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [roomCodeError, setRoomCodeError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedRoomCode = normalizeRoomCode(roomCode);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

      navigate(`/rooms/${room.id}`);
    } catch (error) {
      console.error("Error al unirse a la sala:", error);

      setRoomCodeError(getJoinRoomErrorMessage(error));
      inputRef.current?.focus();
    } finally {
      setIsJoining(false);
    }
  };

  const inputDescriptionIds = [
    "join-room-description",
    roomCodeError ? "join-room-error" : null,
    isJoining ? "join-room-status" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      onSubmit={handleSubmit}
      className="group w-full sm:w-[194px] sm:hover:w-[430px] sm:focus-within:w-[430px] transition-all duration-500 ease-out motion-reduce:transition-none"
      aria-labelledby="join-room-title"
      aria-describedby={inputDescriptionIds}
    >
      <h2 id="join-room-title" className="sr-only">
        Unirse a una sala de estudio
      </h2>

      <p id="join-room-description" className="sr-only">
        Ingresa el código o ID de una sala para unirte como invitado.
      </p>

      <div className="flex h-12 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg transition focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
        <label htmlFor="join-room-code" className="sr-only">
          Código o ID de la sala
        </label>

        <input
          ref={inputRef}
          id="join-room-code"
          type="text"
          value={roomCode}
          onChange={(event) => {
            setRoomCode(event.target.value);
            setRoomCodeError("");
          }}
          placeholder="Ingresa aquí tu código"
          disabled={isJoining}
          aria-invalid={Boolean(roomCodeError)}
          aria-describedby={inputDescriptionIds}
          className="min-w-0 flex-1 px-4 text-sm text-gray-700 placeholder:text-gray-400 opacity-100 focus:outline-none transition-all duration-500 ease-out disabled:bg-gray-50 disabled:cursor-not-allowed motion-reduce:transition-none sm:w-0 sm:px-0 sm:opacity-0 sm:group-hover:w-full sm:group-hover:px-4 sm:group-hover:opacity-100 sm:group-focus-within:w-full sm:group-focus-within:px-4 sm:group-focus-within:opacity-100"
        />

        <button
          type="submit"
          disabled={isJoining}
          aria-busy={isJoining}
          className="flex h-full w-full flex-shrink-0 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-white transition-all duration-500 ease-out hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer disabled:cursor-wait disabled:opacity-90 motion-reduce:transition-none sm:w-[194px] sm:group-hover:w-[120px] sm:group-focus-within:w-[120px] whitespace-nowrap"
          aria-label={
            isJoining
              ? "Verificando la sala, por favor espera"
              : trimmedRoomCode
                ? `Unirse a la sala con código ${trimmedRoomCode}`
                : "Abrir campo para ingresar código de sala"
          }
        >
          {isJoining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Validando...
            </>
          ) : (
            <>
              <span className="whitespace-nowrap">Unirse</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {isJoining && (
        <p
          id="join-room-status"
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          Verificando si la sala existe.
        </p>
      )}

      {roomCodeError && (
        <p
          id="join-room-error"
          className="mt-2 text-sm text-red-600"
          role="alert"
          aria-live="assertive"
        >
          {roomCodeError}
        </p>
      )}
    </form>
  );
}