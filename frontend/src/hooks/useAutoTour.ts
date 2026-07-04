import { useCallback, useEffect, useRef } from "react";

interface AutoTourOptions {
  /** Retraso antes del primer paso, en milisegundos. */
  initialDelayMs?: number;
  /** Milisegundos estimados de lectura por carácter (velocidad del lector de pantalla). */
  msPerChar?: number;
  /** Duración mínima de cada paso, en milisegundos. */
  minStepMs?: number;
  /** Duración máxima de cada paso, en milisegundos. */
  maxStepMs?: number;
  /** Permite posponer el inicio (p. ej. mientras la vista carga datos). */
  enabled?: boolean;
}

/**
 * Recorrido automático de accesibilidad: al montar la vista, mueve el foco
 * secuencialmente por los contenedores registrados para que el lector de
 * pantalla (VoiceOver, NVDA, JAWS) los anuncie uno a uno, como una visita
 * guiada. La duración de cada paso se estima según la longitud del texto que
 * el lector anunciará.
 *
 * Cualquier interacción del usuario (tecla, clic, toque o scroll) cancela el
 * recorrido de inmediato para devolverle el control (Nielsen H3: control y
 * libertad del usuario). El recorrido corre una sola vez por montaje.
 *
 * Uso:
 *   const tourStep = useAutoTour();
 *   <header ref={tourStep(0)}>...</header>
 *   <section ref={tourStep(1)} aria-label="...">...</section>
 */
export function useAutoTour(options: AutoTourOptions = {}) {
  const {
    initialDelayMs = 800,
    msPerChar = 55,
    minStepMs = 2500,
    maxStepMs = 20000,
    enabled = true,
  } = options;

  const stepsRef = useRef(new Map<number, HTMLElement>());
  const startedRef = useRef(false);

  const tourStep = useCallback(
    (index: number) =>
      (el: HTMLElement | null) => {
        if (el) {
          // El contenedor debe poder recibir foco programático para que el
          // lector de pantalla lo anuncie.
          if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
          stepsRef.current.set(index, el);
        } else {
          stepsRef.current.delete(index);
        }
      },
    []
  );

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let timer: number | undefined;

    const events: (keyof WindowEventMap)[] = [
      "keydown",
      "pointerdown",
      "wheel",
      "touchstart",
    ];

    const cancel = () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, cancel, true));
    };

    events.forEach((event) => window.addEventListener(event, cancel, true));

    const runStep = (index: number) => {
      if (cancelled) return;

      const ordered = Array.from(stepsRef.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([, element]) => element);

      if (index >= ordered.length) {
        cancel();
        return;
      }

      const element = ordered[index];

      // Saltar contenedores ocultos con display:none (p. ej. la variante
      // móvil/escritorio que no aplica al viewport actual). Los elementos
      // sr-only sí tienen caja de renderizado, así que no se saltan.
      if (element.getClientRects().length === 0) {
        runStep(index + 1);
        return;
      }

      element.focus();

      const text =
        element.getAttribute("aria-label") || element.textContent || "";
      const dwellMs = Math.min(
        maxStepMs,
        Math.max(minStepMs, text.trim().length * msPerChar)
      );

      timer = window.setTimeout(() => runStep(index + 1), dwellMs);
    };

    timer = window.setTimeout(() => runStep(0), initialDelayMs);

    return cancel;
  }, [enabled, initialDelayMs, msPerChar, minStepMs, maxStepMs]);

  return tourStep;
}
