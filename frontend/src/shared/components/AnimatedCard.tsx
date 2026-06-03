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
        // overflow hidden: evita que el logo "vuele" fuera del wrapper
        // mientras el card colapsa
        wrapper.style.overflow = "hidden";
      }

      const oldCardHeight = card.scrollHeight;
      card.style.height = `${oldCardHeight}px`;

      // ── FASE 2: fade out del contenido actual ─────────────────────────────
      card.style.transition = "opacity 120ms ease";
      card.style.opacity = "0";

      await new Promise<void>((resolve) => setTimeout(resolve, 130));

      // ── FASE 3: navegar y montar nuevo contenido ──────────────────────────
      navigate(path);
      await new Promise<void>((resolve) => setTimeout(resolve, 30));
      setDisplayedChildren(latestChildren.current);

      // ── FASE 4: medir la nueva altura del card ────────────────────────────
      card.style.height = "auto";
      const newCardHeight = card.scrollHeight;
      card.style.height = `${oldCardHeight}px`;

      const heightDelta = newCardHeight - oldCardHeight;
      const newWrapperHeight = oldWrapperHeight + heightDelta;

      // ── FASE 5: transicionar altura + fade in ─────────────────────────────
      card.style.transition = "height 250ms ease, opacity 200ms ease";
      card.style.height = `${newCardHeight}px`;
      card.style.opacity = "1";

      if (wrapper) {
        wrapper.style.transition = "height 250ms ease";
        wrapper.style.height = `${newWrapperHeight}px`;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 260));

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
        willChange: "opacity, height",
      }}
    >
      {displayedChildren}
    </div>
  );
}