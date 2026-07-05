import { useState } from "react";
import {
  Copy,
  Check,
  Calendar,
  ArrowRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Room } from "@/services/api";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { DeleteRoomDialog } from "./DeleteRoomDialog";

const COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500",
  "from-teal-500 to-cyan-500",
];

function formatDate(ts: unknown) {
  if (!ts) return "";

  let seconds: number;

  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    seconds = (ts as { seconds: number }).seconds;
  } else if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
    seconds = (ts as { _seconds: number })._seconds;
  } else if (typeof ts === "string") {
    seconds = new Date(ts).getTime() / 1000;
  } else {
    return "";
  }

  const date = new Date(seconds * 1000);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface RoomCardProps {
  room: Room;
  cardWidth: number;
  index: number;
  animName: string;
  animDur: string;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: (id: string | null) => void;
  canManage?: boolean;
  user?: { getIdToken: () => Promise<string> } | null;
  onRoomUpdated?: (updatedRoom: Room) => void;
  onRoomDeleted?: (deletedRoomId: string) => void;
  isVisible?: boolean;
}

export function RoomCard({
  room,
  cardWidth,
  index,
  animName,
  animDur,
  isHovered,
  isDimmed,
  onHover,
  canManage = true,
  user = null,
  onRoomUpdated,
  onRoomDeleted,
  isVisible = true,
}: RoomCardProps) {
  const navigate = useNavigate();
  const formattedDate = formatDate(room.createdAt);

  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <article
        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group flex-shrink-0 flex flex-col h-auto"
        style={{
          width: cardWidth > 0 ? cardWidth : "auto",
          flex: cardWidth > 0 ? "0 0 auto" : "1 1 0%",
          animation: `${animName} ${animDur} ease-in-out infinite`,
          animationPlayState: isHovered ? "paused" : "running",
          scale: isHovered ? "1.07" : isDimmed ? "0.94" : "1",
          translate: isHovered ? "0 -8px" : "0 0",
          rotate: isHovered ? "0deg" : undefined,
          opacity: isDimmed ? "0.45" : 1,
          transition: isHovered
            ? "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "all 0.3s ease-out",
        }}
        aria-labelledby={`room-title-${room.id}`}
        aria-describedby={`room-description-${room.id}`}
        aria-hidden={!isVisible}
        onMouseEnter={() => onHover(room.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div
          className={`h-2 bg-gradient-to-r ${COLORS[index % COLORS.length]}`}
          aria-hidden="true"
        />

        <div className="px-6 pt-4 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id={`room-title-${room.id}`}
                  className="text-[20px] font-semibold text-gray-900 group-hover:text-primary-700 transition truncate"
                >
                  {room.name}
                </h3>

                {canManage && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditDialogOpen(true);
                    }}
                    tabIndex={isVisible ? undefined : -1}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                    aria-label={`Editar nombre de la sala ${room.name}`}
                    title="Editar nombre"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {formattedDate && (
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-[15px]">{formattedDate}</span>
                </div>
              )}
            </div>

            {canManage && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                tabIndex={isVisible ? undefined : -1}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                aria-label={`Eliminar sala ${room.name}`}
                title="Eliminar sala"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <p id={`room-description-${room.id}`} className="sr-only">
          Sala de estudio llamada {room.name}. ID de sala {room.id}.
          {formattedDate ? ` Creada el ${formattedDate}.` : ""}
          Puedes copiar el ID o entrar a la sala.
          {canManage
            ? " También puedes editar el nombre de la sala o eliminarla porque tienes permisos de administración."
            : " No tienes permisos de administración sobre esta sala."}
        </p>

        <div className="px-5 pt-3 pb-5 flex flex-col justify-between gap-4 flex-1">
          <div>
            <div className="h-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-widest text-gray-600 uppercase mb-0.5">
                  ID de sala
                </p>

                <p className="font-mono text-sm font-medium text-gray-600 truncate">
                  {room.id}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                tabIndex={isVisible ? undefined : -1}
                className={`flex items-center gap-1 text-xs rounded-md px-2 py-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "text-gray-500 bg-white border border-gray-200 hover:text-gray-800 hover:border-gray-300"
                }`}
                aria-label={
                  copied
                    ? `ID de la sala ${room.name} copiado al portapapeles`
                    : `Copiar ID de la sala ${room.name}: ${room.id}`
                }
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? "Copiado" : "Copiar ID"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/rooms/${room.id}`)}
            tabIndex={isVisible ? undefined : -1}
            className="w-full mt-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            aria-label={`Entrar a la sala de estudio ${room.name}`}
          >
            Entrar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </article>

      <CreateRoomDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        mode="edit"
        room={room}
        onRoomUpdated={onRoomUpdated}
      />

      <DeleteRoomDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        room={room}
        user={user}
        onRoomDeleted={onRoomDeleted}
      />
    </>
  );
}