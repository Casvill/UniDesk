import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";

interface ChatBubbleProps {
  src: string;
  className?: string;
}

export default function ChatBubble({ src, className = "" }: ChatBubbleProps) {
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      if (!mountedRef.current) return;
      const showDelay = 2000 + Math.random() * 5000;
      const visibleDuration = 2000 + Math.random() * 3000;

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
        <motion.img
          src={src}
          alt=""
          aria-hidden="true"
          className={className}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </AnimatePresence>
  );
}
