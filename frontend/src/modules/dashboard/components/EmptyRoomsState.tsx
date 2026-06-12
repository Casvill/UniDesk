import { Plus } from "lucide-react";
import emptyState from "@/assets/empty/empty-state.svg";

interface EmptyRoomsStateProps {
  onCreateRoom: () => void;
  animName: string;
  animDur: string;
}

export function EmptyRoomsState({
  onCreateRoom,
  animName,
  animDur,
}: EmptyRoomsStateProps) {
  return (
    <section className="text-center py-12">
      <img
        src={emptyState}
        alt="Ilustración de un espacio virtual vacío, representando que aún no hay salas de estudio creadas."
        draggable="false"
        className="w-[432px] mx-auto mb-8 opacity-75"
        style={{ animation: `${animName} ${animDur} ease-in-out infinite` }}
      />

      <div
        tabIndex={0}
        role="group"
        aria-label="Estado vacío del dashboard. No tienes salas creadas."
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 rounded-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Mucho silencio por estos pasillos virtuales...
        </h2>

        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Todavía no has creado ninguna sala de estudio. Crea tu primera sala y
          empieza a colaborar con tus compañeros.
        </p>
      </div>

      <button
        type="button"
        onClick={onCreateRoom}
        className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto cursor-pointer"
        aria-label="Crear mi primera sala de estudio"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        Crear primera sala
      </button>
    </section>
  );
}