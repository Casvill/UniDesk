import { useNavigate } from "react-router-dom";
import { Plus, Users, Book, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const activeRooms = [
    {
      id: "1",
      name: "Grupo de estudio de Cálculo",
      participants: 4,
      subject: "Matemáticas",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "2",
      name: "Preparación para finales de Programación",
      participants: 8,
      subject: "Ciencias de la Computación",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "3",
      name: "Repaso de laboratorio de Biología",
      participants: 3,
      subject: "Biología",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "4",
      name: "Repaso de laboratorio de Biología",
      participants: 3,
      subject: "Biología",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "5",
      name: "Repaso de laboratorio de Biología",
      participants: 3,
      subject: "Biología",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const upcomingSessions = [
    {
      id: "1",
      name: "Sesión de estudio de Química",
      time: "Hoy, 3:00 p. m.",
      participants: 5,
    },
    {
      id: "2",
      name: "Repaso para examen de Historia",
      time: "Mañana, 10:00 a. m.",
      participants: 6,
    },
  ];

  const username = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
    : "estudiante";

  const [page, setPage] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [containerHovered, setContainerHovered] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [roomName, setRoomName] = useState("");

  const [cardsPerPage, setCardsPerPage] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
    }
    return 3;
  });

  const totalPages = Math.ceil(activeRooms.length / cardsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    const sm = window.matchMedia("(max-width: 639px)");
    const md = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const lg = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (sm.matches) setCardsPerPage(1);
      else if (md.matches) setCardsPerPage(2);
      else setCardsPerPage(3);
    };

    update();
    sm.addEventListener("change", update);
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      sm.removeEventListener("change", update);
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const newTotal = Math.ceil(activeRooms.length / cardsPerPage);
    setPage((p) => Math.min(p, Math.max(0, newTotal - 1)));
  }, [cardsPerPage, activeRooms.length]);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      const gapTotal = 24 * (cardsPerPage - 1);
      setCardWidth(Math.floor((w - gapTotal) / cardsPerPage));
      setTranslateX(page * w);
    }
  }, [page, cardsPerPage]);

  useLayoutEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  const goNext = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  const handleCreateRoom = () => {
    setShowCreateDialog(false);
    setRoomName("");
    navigate("/rooms/1");
  };

  useEffect(() => {
    const styleId = "ud-float";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      @keyframes uf0 { 0%,100% { transform:translateY(0) rotate(-1.5deg) } 50% { transform:translateY(-16px) rotate(1.5deg) } }
      @keyframes uf1 { 0%,100% { transform:translateY(0) rotate(1deg) } 50% { transform:translateY(-14px) rotate(-1deg) } }
      @keyframes uf2 { 0%,100% { transform:translateY(0) rotate(-0.5deg) } 50% { transform:translateY(-18px) rotate(0.5deg) } }
      @keyframes uf3 { 0%,100% { transform:translateY(0) rotate(1.5deg) } 50% { transform:translateY(-12px) rotate(-1.5deg) } }
      @keyframes uf4 { 0%,100% { transform:translateY(0) rotate(-1deg) } 50% { transform:translateY(-15px) rotate(1deg) } }
    `;
    document.head.appendChild(s);
    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, []);

  const animNames = ["uf0", "uf1", "uf2", "uf3", "uf4"];
  const animDurs = ["5.5s", "6.5s", "7s", "5.8s", "6.2s"];

  const containerHeight = cardsPerPage === 1 ? 280 : cardsPerPage === 2 ? 300 : 320;

  const edgeGradient =
    cardsPerPage <= 2
      ? "to right, #f6f7f9 0%, transparent 2%, transparent 98%, #f6f7f9 100%"
      : "to right, #f6f7f9 0%, transparent 2%, transparent 98%, #f6f7f9 100%";

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          ¡Qué bueno verte de nuevo, {username}!
        </h2>

        <p className="text-gray-600 mb-6">
          Organiza tus salas, únete a tus compañeros y continúa estudiando en equipo.
        </p>

        <button
          onClick={() => setShowCreateDialog(true)}
          className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          aria-label="Crear una nueva sala de estudio"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Crear nueva sala
        </button>
      </div>

      <section className="mb-8" aria-labelledby="active-rooms-heading">
        <h2
          id="active-rooms-heading"
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Estas son tus salas de estudio:
        </h2>
        <div className="relative">
          {totalPages > 1 && (
            <>
              <button
                onClick={goPrev}
                disabled={page === 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 ${page === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </button>
              <button
                onClick={goNext}
                disabled={page >= totalPages - 1}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 ${page >= totalPages - 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                aria-label="Siguiente"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </button>
            </>
          )}
          <div
            className="relative"
            style={{ clipPath: "inset(-40px -20px -40px -20px)", overflowX: "hidden" }}
            onMouseEnter={() => setContainerHovered(true)}
            onMouseLeave={() => {
              setContainerHovered(false);
              setHoveredCard(null);
            }}
          >
            <div className="relative" style={{ height: containerHeight, paddingTop: 32, paddingBottom: 32 }}>
              {totalPages > 1 && (
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{ background: `linear-gradient(${edgeGradient})` }}
                />
              )}

              <div
                ref={containerRef}
                className="flex gap-6 h-full transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${translateX}px)` }}
              >
                {cardWidth > 0 && activeRooms.map((room, index) => {
                  const aIdx = index % 5;
                  const isHovered = hoveredCard === room.id;
                  const isDimmed =
                    containerHovered && hoveredCard !== null && !isHovered;

                  return (
                    <article
                      key={room.id}
                      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group flex-shrink-0"
                      style={{
                        width: cardWidth > 0 ? cardWidth : "auto",
                        flex: cardWidth > 0 ? "0 0 auto" : "1 1 0%",
                        animation: `${animNames[aIdx]} ${animDurs[aIdx]} ease-in-out infinite`,
                        animationPlayState: isHovered ? "paused" : "running",
                        scale: isHovered ? "1.07" : isDimmed ? "0.94" : "1",
                        translate: isHovered ? "0 -8px" : "0 0",
                        rotate: isHovered ? "0deg" : undefined,
                        opacity: isDimmed ? "0.45" : 1,
                        transition: isHovered
                          ? "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                          : "all 0.3s ease-out",
                      }}
                      aria-label={`Sala de estudio ${room.name}`}
                      onMouseEnter={() => setHoveredCard(room.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className={`h-2 bg-gradient-to-r ${room.color}`} />

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition">
                              {room.name}
                            </h3>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Book className="h-4 w-4" aria-hidden="true" />
                              <span>{room.subject}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Users className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {room.participants} participantes en línea
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/rooms/${room.id}`)}
                          className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-lg font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                          aria-label={`Unirse a la sala ${room.name}`}
                        >
                          Unirse a la sala
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none ${
                    i === page
                      ? "bg-primary-600 w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Ir a página ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear sala de estudio</DialogTitle>
            <DialogDescription>
              Dale un nombre a tu sala para empezar a estudiar en equipo.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label htmlFor="new-room-name" className="block mb-2 text-sm font-semibold text-gray-700">
              Nombre de la sala
            </label>
            <input
              type="text"
              id="new-room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Ej: Grupo de estudio de cálculo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear sala
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
