import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";

const glows = [
  { size: 200, x: "15%", y: "20%" },
  { size: 300, x: "70%", y: "15%" },
  { size: 180, x: "80%", y: "75%" },
  { size: 250, x: "10%", y: "70%" },
  { size: 150, x: "50%", y: "50%" },
  { size: 220, x: "30%", y: "45%" },
];

export default function BgGlows() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {glows.map((glow, i) => (
        <GlowCircle key={i} {...glow} />
      ))}
    </div>
  );
}

function GlowCircle({ size, x, y }: { size: number; x: string; y: string }) {
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      if (!mountedRef.current) return;
      const showDelay = 3000 + Math.random() * 8000;
      const visibleDuration = 4000 + Math.random() * 6000;

      timeoutId = setTimeout(() => {
        if (!mountedRef.current) return;
        setVisible(true);
        timeoutId = setTimeout(() => {
          if (!mountedRef.current) return;
          setVisible(false);
          scheduleNext();
        }, visibleDuration);
      }, showDelay);
    };

    scheduleNext();

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: `calc(${x} - ${size / 2}px)`,
            top: `calc(${y} - ${size / 2}px)`,
            background: "radial-gradient(circle, rgba(121,89,235,0.12) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
}
