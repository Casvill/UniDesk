import { createContext, useContext, useRef } from "react";

interface CardTransitionContextValue {
  navigateWithTransition: (path: string) => Promise<void>;
  registerCollapse: (fn: (path: string) => Promise<void>) => void;
}

const CardTransitionContext = createContext<CardTransitionContextValue>({
  navigateWithTransition: async () => {},
  registerCollapse: () => {},
});

export function CardTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const collapseRef = useRef<((path: string) => Promise<void>) | null>(null);

  function registerCollapse(fn: (path: string) => Promise<void>) {
    collapseRef.current = fn;
  }

  async function navigateWithTransition(path: string) {
    if (collapseRef.current) {
      await collapseRef.current(path);
    }
  }

  return (
    <CardTransitionContext.Provider
      value={{ navigateWithTransition, registerCollapse }}
    >
      {children}
    </CardTransitionContext.Provider>
  );
}

export function useCardTransition() {
  return useContext(CardTransitionContext);
}
