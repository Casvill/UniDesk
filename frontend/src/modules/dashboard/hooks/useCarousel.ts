import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";

export function useCarousel(itemCount: number) {
  const [page, setPage] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [containerHovered, setContainerHovered] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
    }
    return 3;
  });

  const totalPages = Math.ceil(itemCount / cardsPerPage) || 1;
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
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

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
  }, [updateDimensions, itemCount]);

  const goNext = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  return {
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
  };
}
