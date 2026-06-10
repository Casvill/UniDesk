import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRooms } from "../hooks/useRooms";
import { useFloatingAnimation } from "../hooks/useFloatingAnimation";
import { RoomCarousel } from "./RoomCarousel";
import { EmptyRoomsState } from "./EmptyRoomsState";
import { CreateRoomDialog } from "./CreateRoomDialog";

export function Dashboard() {
  const { profile, user } = useAuth();
  const { activeRooms, isLoadingRooms, roomsError, refetchRooms } = useRooms(user);
  const { animNames, animDurs } = useFloatingAnimation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const username = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
    : "estudiante";

  const roomsCountMessage =
    activeRooms.length === 1
      ? "Tienes 1 sala de estudio creada."
      : `Tienes ${activeRooms.length} salas de estudio creadas.`;

  return (
    <section
      aria-labelledby="dashboard-title"
      aria-describedby="dashboard-description"
      aria-busy={isLoadingRooms}
    >
      <div className="mb-8">
        <h2
          id="dashboard-title"
          className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
        >
          ¡Qué bueno verte por aquí, {username}!
        </h2>

        <p id="dashboard-description" className="text-gray-600 mb-6">
          Organiza tus salas, únete a tus compañeros y continúa estudiando en equipo.
        </p>

        {activeRooms.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            aria-label="Crear una nueva sala de estudio"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Crear nueva sala
          </button>
        )}
      </div>

      {roomsError ? (
        <section
          className="flex flex-col items-center justify-center py-20 text-center"
          role="alert"
          aria-live="assertive"
          aria-labelledby="rooms-error-title"
          aria-describedby="rooms-error-description"
        >
          <h3 id="rooms-error-title" className="text-red-600 font-semibold">
            No pudimos cargar tus salas
          </h3>

          <p id="rooms-error-description" className="text-gray-500 mt-2">
            {roomsError}. Verifica tu conexión o intenta nuevamente.
          </p>

          <button
            type="button"
            onClick={refetchRooms}
            disabled={isLoadingRooms}
            aria-busy={isLoadingRooms}
            aria-disabled={isLoadingRooms}
            aria-label={
              isLoadingRooms
                ? "Reintentando cargar tus salas, por favor espera"
                : "Reintentar cargar tus salas"
            }
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoadingRooms ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Reintentando...
              </>
            ) : (
              "Reintentar"
            )}
          </button>
        </section>
      ) : isLoadingRooms && activeRooms.length === 0 ? (
        <section
          className="flex flex-col items-center justify-center py-20"
          role="status"
          aria-live="polite"
          aria-label="Cargando salas de estudio"
        >
          <Loader2
            className="h-10 w-10 animate-spin text-primary"
            aria-hidden="true"
          />

          <p className="text-gray-500 mt-4">
            Cargando tus salas...
          </p>
        </section>
      ) : !isLoadingRooms && activeRooms.length === 0 ? (
        <section
          aria-label="No tienes salas de estudio creadas"
          aria-live="polite"
        >
          <EmptyRoomsState
            onCreateRoom={() => setShowCreateDialog(true)}
            animName={animNames[0]}
            animDur={animDurs[0]}
          />
        </section>
      ) : (
        <section
          aria-labelledby="rooms-list-title"
          aria-describedby="rooms-list-description"
          aria-live="polite"
        >
          <h3 id="rooms-list-title" className="sr-only">
            Salas de estudio creadas
          </h3>

          <p id="rooms-list-description" className="sr-only">
            {roomsCountMessage}. Puedes navegar por tus salas y entrar a una de ellas.
          </p>

          <RoomCarousel rooms={activeRooms} />
        </section>
      )}

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
      />
    </section>
  );
}