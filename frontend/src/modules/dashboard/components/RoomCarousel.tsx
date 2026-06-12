import { useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Room } from "@/services/api";
import { useCarousel } from "../hooks/useCarousel";
import { useFloatingAnimation } from "../hooks/useFloatingAnimation";
import { RoomCard } from "./RoomCard";

interface RoomCarouselProps {
  rooms: Room[];
  user?: { getIdToken: () => Promise<string> } | null;
  onRoomUpdated?: (updatedRoom: Room) => void;
  onRoomDeleted?: (deletedRoomId: string) => void;
}

export function RoomCarousel({
  rooms,
  user = null,
  onRoomUpdated,
  onRoomDeleted,
}: RoomCarouselProps) {
  const {
    page,
    setPage,
    totalPages,
    cardsPerPage,
    cardWidth,
    translateX,
    containerRef,
    goNext,
    goPrev,
    hoveredCard,
    setHoveredCard,
    containerHovered,
    setContainerHovered,
  } = useCarousel(rooms.length);

  const { animNames, animDurs } = useFloatingAnimation();

  const containerHeight = cardsPerPage === 1 ? 280 : cardsPerPage === 2 ? 300 : 320;

  const scrollCooldownRef = useRef(false);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollCooldownRef.current || totalPages <= 1) return;

    const delta = e.deltaY || e.deltaX;

    if (Math.abs(delta) < 30) return;

    scrollCooldownRef.current = true;

    if (delta > 0) {
      goNext();
    } else {
      goPrev();
    }

    setTimeout(() => {
      scrollCooldownRef.current = false;
    }, 400);
  }, [goNext, goPrev, totalPages]);

  const goToCardPage = useCallback((cardIndex: number) => {
    const targetPage = Math.floor(cardIndex / cardsPerPage);
    setPage(targetPage);
  }, [cardsPerPage, setPage]);

  return (
    <section
      className="mb-8"
      aria-labelledby="active-rooms-heading"
      aria-describedby="active-rooms-description"
    >
      <div
        tabIndex={0}
        aria-labelledby="active-rooms-heading"
        aria-describedby="active-rooms-description"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 rounded-lg"
      >
        <h2
          id="active-rooms-heading"
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Estas son tus salas de estudio:
        </h2>

        <p id="active-rooms-description" className="sr-only">
          Lista de salas de estudio organizadas en páginas. Puedes navegar entre
          páginas con los botones siguiente y anterior. Dentro de cada sala
          puedes copiar el ID, entrar a ella, editar su nombre o eliminarla si
          tienes permisos de administración.
        </p>
      </div>

      <div className="relative">
        {totalPages > 1 && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(to right, #f6f7f9 0%, transparent 2%, transparent 98%, #f6f7f9 100%)",
            }}
            aria-hidden="true"
          />
        )}

        <div
          ref={containerRef}
          className="relative"
          style={{
            clipPath: "inset(-40px -20px -40px -20px)",
            overflow: "clip",
          }}
          onMouseEnter={() => setContainerHovered(true)}
          onMouseLeave={() => {
            setContainerHovered(false);
            setHoveredCard(null);
          }}
          onWheel={handleWheel}
        >
          <div
            className="relative"
            style={{
              height: containerHeight,
              paddingTop: 32,
              paddingBottom: 32,
            }}
          >
            <div
              className="flex gap-6 h-full transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${translateX}px)`,
                justifyContent:
                  rooms.length < cardsPerPage ? "center" : "flex-start",
              }}
              role="list"
              aria-label="Salas de estudio disponibles"
            >
              {cardWidth > 0 &&
                rooms.map((room, index) => {
                  const aIdx = index % 5;
                  const isHovered = hoveredCard === room.id;
                  const isDimmed =
                    containerHovered && hoveredCard !== null && !isHovered;

                  return (
                    <div
                      role="listitem"
                      key={room.id}
                      onFocus={() => goToCardPage(index)}
                    >
                      <RoomCard
                        room={room}
                        cardWidth={cardWidth}
                        index={index}
                        animName={animNames[aIdx]}
                        animDur={animDurs[aIdx]}
                        isHovered={isHovered}
                        isDimmed={isDimmed}
                        onHover={setHoveredCard}
                        canManage={true}
                        user={user}
                        onRoomUpdated={onRoomUpdated}
                        onRoomDeleted={onRoomDeleted}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <>
            <button
              type="button"
              onClick={goNext}
              disabled={page >= totalPages - 1}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                page >= totalPages - 1
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
              aria-label={
                page >= totalPages - 1
                  ? "No hay más salas"
                  : "Ir a la página siguiente de salas"
              }
            >
              <ChevronRight
                className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={goPrev}
              disabled={page === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                page === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              aria-label={
                page === 0
                  ? "Estás en la primera página"
                  : "Volver a la página anterior de salas"
              }
            >
              <ChevronLeft
                className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700"
                aria-hidden="true"
              />
            </button>
          </>
        )}

        {totalPages > 1 && (
          <nav
            className="flex justify-center gap-2 mt-4"
            aria-label="Paginación de salas de estudio"
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  i === page
                    ? "bg-primary-600 w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Ir a la página ${i + 1} de salas`}
                aria-current={i === page ? "page" : undefined}
              />
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}