import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAutoTour } from "@/hooks/useAutoTour";
import { useRooms } from "../hooks/useRooms";
import { useFloatingAnimation } from "../hooks/useFloatingAnimation";
import { RoomCarousel } from "./RoomCarousel";
import { EmptyRoomsState } from "./EmptyRoomsState";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { JoinRoomForm } from "./JoinRoomForm";
import { JoinRoomDialog } from "./JoinRoomDialog";
import type { Room } from "@/services/api";

export function Dashboard() {
  const { profile, user } = useAuth();
  const { activeRooms, isLoadingRooms, roomsError, refetchRooms } =
    useRooms(user);
  const { animNames, animDurs } = useFloatingAnimation();

  useEffect(() => {
    document.title = "Principal | UniDesk";
  }, []);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // El TopbarLayout autoenfoca el logo con su anuncio al llegar al dashboard;
  // el recorrido espera a que ese anuncio termine antes de continuar.
  const tourStep = useAutoTour({
    enabled: !isLoadingRooms,
    initialDelayMs: 12000,
  });

  const handleRoomUpdated = (_updatedRoom: Room) => {
    void refetchRooms();
  };

  const handleRoomDeleted = (_deletedRoomId: string) => {
    void refetchRooms();
  };

  const username = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
    : "estudiante";

  const dashboardStateDescription = roomsError
    ? "Hay un error al cargar tus salas."
    : activeRooms.length === 0
      ? "No tienes salas creadas."
      : activeRooms.length === 1
        ? "Tienes una sala creada."
        : `Tienes ${activeRooms.length} salas creadas.`;

  return (
    <section aria-labelledby="dashboard-title" aria-busy={isLoadingRooms}>
      <header className="mb-8">
        <div
          ref={tourStep(0)}
          role="group"
          aria-label={`Sección Dashboard de UniDesk. ${dashboardStateDescription}`}
          className="rounded-lg outline-none"
        >
          <h1
            id="dashboard-title"
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
          >
            ¡Qué bueno verte por aquí, {username}!
          </h1>

          <p className="text-gray-600 mb-8">
            Organiza tus salas, únete a tus compañeros y continúa estudiando en
            equipo.
          </p>
        </div>

        <div
          ref={tourStep(1)}
          role="group"
          aria-label="Acciones del dashboard: crear una nueva sala de estudio o unirse a una sala existente con su código."
          className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center outline-none"
        >
          {activeRooms.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="h-12 w-full sm:w-auto bg-primary text-white px-5 rounded-lg text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              aria-label="Crear una nueva sala de estudio"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Crear nueva sala
            </button>
          )}

          {activeRooms.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowJoinDialog(true)}
                className="h-12 w-full sm:w-auto bg-primary text-white px-5 rounded-lg text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer md:hidden"
                aria-label="Unirse a una sala usando su código"
              >
                Unirse a una sala
              </button>

              <div className="hidden md:block">
                <JoinRoomForm user={user} />
              </div>
            </>
          )}
        </div>
      </header>

      {roomsError ? (
        <section
          className="flex flex-col items-center justify-center py-20 text-center"
          role="alert"
        >
          <div
            role="group"
            aria-label="Estado de error. No pudimos cargar tus salas."
            className="rounded-lg"
          >
            <h2 className="text-red-600 font-semibold">
              No pudimos cargar tus salas
            </h2>

            <p className="text-gray-500 mt-2">
              {roomsError}. Verifica tu conexión o intenta nuevamente.
            </p>
          </div>

          <button
            type="button"
            onClick={refetchRooms}
            disabled={isLoadingRooms}
            aria-busy={isLoadingRooms}
            aria-label={
              isLoadingRooms
                ? "Reintentando cargar tus salas"
                : "Reintentar cargar tus salas"
            }
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
          aria-label="Cargando tus salas de estudio"
        >
          <Loader2
            className="h-10 w-10 animate-spin text-primary"
            aria-hidden="true"
          />

          <p className="text-gray-500 mt-4">Cargando tus salas...</p>
        </section>
      ) : !isLoadingRooms && activeRooms.length === 0 ? (
        <div
          ref={tourStep(2)}
          role="group"
          aria-label="Todavía no has creado ninguna sala de estudio. Usa el botón Crear mi primera sala para comenzar, o únete a una sala existente con su código."
          className="outline-none"
        >
          <EmptyRoomsState
            onCreateRoom={() => setShowCreateDialog(true)}
            onJoinRoom={() => setShowJoinDialog(true)}
            animName={animNames[0]}
            animDur={animDurs[0]}
          />
        </div>
      ) : (
        <div
          ref={tourStep(2)}
          role="group"
          aria-label={`Listado de tus salas de estudio. ${dashboardStateDescription} Dentro de cada sala puedes copiar su ID, entrar, editar su nombre o eliminarla.`}
          className="outline-none"
        >
          <RoomCarousel
            rooms={activeRooms}
            user={user}
            onRoomUpdated={handleRoomUpdated}
            onRoomDeleted={handleRoomDeleted}
          />
        </div>
      )}

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
      />

      <JoinRoomDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        user={user}
      />
    </section>
  );
}