import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export function JoinRoomForm() {
  const [roomCode, setRoomCode] = useState("");
  const [roomCodeError, setRoomCodeError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedRoomCode = roomCode.trim();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedRoomCode) {
      setRoomCodeError("Ingresa el código de la sala para poder unirte.");
      inputRef.current?.focus();
      return;
    }

    setRoomCodeError("");
    console.log("Código de sala ingresado:", trimmedRoomCode);
  };

  const inputDescriptionIds = [
    "join-room-description",
    roomCodeError ? "join-room-error" : null,
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
          aria-invalid={Boolean(roomCodeError)}
          aria-describedby={inputDescriptionIds}
          className="min-w-0 flex-1 px-4 text-sm text-gray-700 placeholder:text-gray-400 opacity-100 focus:outline-none transition-all duration-500 ease-out motion-reduce:transition-none sm:w-0 sm:px-0 sm:opacity-0 sm:group-hover:w-full sm:group-hover:px-4 sm:group-hover:opacity-100 sm:group-focus-within:w-full sm:group-focus-within:px-4 sm:group-focus-within:opacity-100"
        />

        <button
          type="submit"
          className="flex h-full w-full flex-shrink-0 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-white transition-all duration-500 ease-out hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer motion-reduce:transition-none sm:w-[194px] sm:group-hover:w-[120px] sm:group-focus-within:w-[120px]"
          aria-label={
            trimmedRoomCode
              ? `Unirse a la sala con código ${trimmedRoomCode}`
              : "Abrir campo para ingresar código de sala"
          }
        >
          Unirse
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

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