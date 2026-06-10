import { Plus } from "lucide-react";
import emptyState from "@/assets/empty/empty-state.svg";

interface EmptyRoomsStateProps {
  onCreateRoom: () => void;
  animName: string;
  animDur: string;
}

export function EmptyRoomsState({ onCreateRoom, animName, animDur }: EmptyRoomsStateProps) {
  return (
    <section className="text-center py-12" aria-labelledby="empty-rooms-heading">
      <img
        src={emptyState}
        alt=""
        className="w-[432px] mx-auto mb-8 opacity-75"
        style={{ animation: `${animName} ${animDur} ease-in-out infinite` }}
        aria-hidden="true"
      />
      <h2 id="empty-rooms-heading" className="text-2xl font-bold text-gray-900 mb-2">
        Mucho silencio por estos pasillos virtuales...
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Todavía no has creado ninguna sala de estudio.
        Crea tu primera sala y empieza a colaborar con tus compañeros.
      </p>
      <button
        onClick={onCreateRoom}
        className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
      >
        <Plus className="h-5 w-5" />
        Crear primera sala
      </button>
    </section>
  );
}
