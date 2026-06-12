import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function JoinRoomForm() {
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("Código de sala ingresado:", roomCode.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full sm:w-[430px]"
      aria-labelledby="join-room-title"
      aria-describedby="join-room-description"
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
          id="join-room-code"
          type="text"
          value={roomCode}
          onChange={(event) => setRoomCode(event.target.value)}
          placeholder="Ingresa aquí tu código"
          className="min-w-0 flex-1 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          aria-label="Ingresa aquí el código o ID de la sala"
        />

        <button
          type="submit"
          disabled={!roomCode.trim()}
          className="flex min-w-[120px] items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          aria-label={
            roomCode.trim()
              ? `Unirse a la sala con código ${roomCode.trim()}`
              : "Ingresa un código de sala para poder unirte"
          }
        >
          Unirse
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}