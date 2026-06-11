import { useEffect, useRef, useState } from "react";
import { Copy, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Room } from "@/services/api";

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
}: RoomCardProps) {
  const navigate = useNavigate();
  const formattedDate = formatDate(room.createdAt);

  const [copyMessage, setCopyMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState<"success" | "error" | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id);

      setCopyStatus("success");
      setCopyMessage("ID copiado en el portapapeles.");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyMessage("");
        setCopyStatus(null);
      }, 2500);
    } catch (error) {
      console.error("Error al copiar el ID de la sala:", error);

      setCopyStatus("error");
      setCopyMessage("No se pudo copiar el ID. Inténtalo nuevamente.");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyMessage("");
        setCopyStatus(null);
      }, 3000);
    }
  };

  return (
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
      onMouseEnter={() => onHover(room.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={`h-2 bg-gradient-to-r ${COLORS[index % COLORS.length]}`}
        aria-hidden="true"
      />

      <div className="px-6 pt-4 pb-4 border-b border-gray-100">
        <h3
          id={`room-title-${room.id}`}
          className="text-[20px] font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition"
        >
          {room.name}
        </h3>

        {formattedDate && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[15px]">{formattedDate}</span>
          </div>
        )}
      </div>

      <p id={`room-description-${room.id}`} className="sr-only">
        Sala de estudio llamada {room.name}. ID de sala {room.id}.
        {formattedDate ? ` Creada el ${formattedDate}.` : ""}
        Puedes copiar el ID o entrar a la sala.
      </p>

      <div className="px-5 pt-3 pb-5 flex flex-col justify-between gap-4 flex-1">
        <div>
          <div className="h-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <div>
              <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-0.5">
                ID de sala
              </p>

              <p className="font-mono text-sm font-medium text-gray-600">
                {room.id}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyRoomId}
              className="flex items-center gap-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-1 hover:text-gray-800 hover:border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              aria-label={`Copiar ID de la sala ${room.name}: ${room.id}`}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copiar
            </button>
          </div>

          {copyMessage && (
            <p
              className={`mt-2 text-xs font-medium ${
                copyStatus === "success" ? "text-green-600" : "text-red-600"
              }`}
              role={copyStatus === "success" ? "status" : "alert"}
              aria-live={copyStatus === "success" ? "polite" : "assertive"}
            >
              {copyMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/rooms/${room.id}`)}
          className="w-full mt-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          aria-label={`Entrar a la sala de estudio ${room.name}`}
        >
          Entrar
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}