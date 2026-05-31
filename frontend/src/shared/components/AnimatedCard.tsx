import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCardTransition } from "@/context/CardTransitionContext";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedCard({ children, className = "" }: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { registerCollapse } = useCardTransition();

  const [displayedChildren, setDisplayedChildren] = useState(children);
  const latestChildren = useRef(children);

  useEffect(() => {
    latestChildren.current = children;
  }, [children]);

  useEffect(() => {
    registerCollapse(async (path: string) => {
      const card = cardRef.current;
      if (!card) {
        navigate(path);
        return;
      }

      // El wrapper padre es el div que contiene logo + card en AuthLayout.
      // Necesitamos animarlo para que el logo se mueva junto con el card.
      const wrapper = card.parentElement as HTMLElement | null;

      // ── FASE 1: capturar altura actual del wrapper y fijarla ──────────────
      const oldWrapperHeight = wrapper ? wrapper.scrollHeight : 0;
      if (wrapper) {
        wrapper.style.height = `${oldWrapperHeight}px`;
        // overflow hidden es clave: evita que el logo "vuele" fuera del wrapper
        // mientras el card colapsa hacia arriba
        wrapper.style.overflow = "hidden";
      }

      // Fijar altura del card para que scaleY tenga un punto de referencia estable
      const oldCardHeight = card.scrollHeight;
      card.style.height = `${oldCardHeight}px`;

      // ── FASE 2: colapsar el card (scaleY 1 → 0) ──────────────────────────
      card.style.transition =
        "transform 200ms cubic-bezier(0.4, 0, 1, 1), opacity 180ms ease";
      card.style.transformOrigin = "top center";
      card.style.transform = "scaleY(0)";
      card.style.opacity = "0";

      await new Promise<void>((resolve) => setTimeout(resolve, 210));

      // ── FASE 3: navegar y montar nuevo contenido ──────────────────────────
      navigate(path);
      await new Promise<void>((resolve) => setTimeout(resolve, 30));
      setDisplayedChildren(latestChildren.current);

      // ── FASE 4: medir la nueva altura del card ya con el nuevo contenido ──
      // Forzamos height: auto momentáneamente para poder leer scrollHeight real
      card.style.height = "auto";
      const newCardHeight = card.scrollHeight;
      // Volvemos a fijar para poder hacer la transición desde 0
      card.style.height = `${newCardHeight}px`;

      // Calcular la nueva altura del wrapper:
      // wrapper = logo (mb-8) + card. 
      // La diferencia entre el nuevo y viejo card nos da la diferencia del wrapper.
      const heightDelta = newCardHeight - oldCardHeight;
      const newWrapperHeight = oldWrapperHeight + heightDelta;

      // ── FASE 5: expandir card y wrapper en paralelo ───────────────────────
      card.style.transition =
        "transform 220ms cubic-bezier(0, 0, 0.2, 1), opacity 200ms ease, height 220ms ease";
      card.style.transform = "scaleY(1)";
      card.style.opacity = "1";

      if (wrapper) {
        wrapper.style.transition = "height 220ms cubic-bezier(0, 0, 0.2, 1)";
        wrapper.style.height = `${newWrapperHeight}px`;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 230));

      // ── FASE 6: limpiar todos los estilos inline ──────────────────────────
      card.style.height = "";

      if (wrapper) {
        wrapper.style.height = "";
        wrapper.style.overflow = "";
        wrapper.style.transition = "";
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        willChange: "transform, opacity, height",
        transformOrigin: "top center",
      }}
    >
      {displayedChildren}
    </div>
  );
}