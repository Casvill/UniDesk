import { useState } from "react";
import { Plus } from "lucide-react";
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

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          ¡Qué bueno verte por aquí, {username}!
        </h2>

        <p className="text-gray-600 mb-6">
          Organiza tus salas, únete a tus compañeros y continúa estudiando en equipo.
        </p>

        {activeRooms.length > 0 && (
          <button
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
        >
          <p className="text-red-600 font-semibold">
            {roomsError}
          </p>

          <p className="text-gray-500 mt-2">
            Verifica tu conexión o intenta nuevamente.
          </p>

          <button
            type="button"
            onClick={refetchRooms}
            disabled={isLoadingRooms}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingRooms ? "Reintentando..." : "Reintentar"}
          </button>
        </section>
      ) : isLoadingRooms && activeRooms.length === 0 ? (
        <section
          className="flex flex-col items-center justify-center py-20"
          role="status"
          aria-live="polite"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="text-gray-500 mt-4">Cargando tus salas...</p>
        </section>
      ) : !isLoadingRooms && activeRooms.length === 0 ? (
        <EmptyRoomsState
          onCreateRoom={() => setShowCreateDialog(true)}
          animName={animNames[0]}
          animDur={animDurs[0]}
        />
      ) : (
        <RoomCarousel rooms={activeRooms} />
      )}

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
      />
    </div>
  );
}