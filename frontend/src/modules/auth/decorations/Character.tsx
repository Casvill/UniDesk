import { motion } from "motion/react";

interface CharacterProps {
  src: string;
  side: "left" | "right";
  className?: string;
}

export default function Character({ src, side, className = "" }: CharacterProps) {
  const xOffset = side === "left" ? -40 : 40;

  return (
    <div className={className}>
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(121,89,235,0.4) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        />
        <motion.img
          src={src}
          alt=""
          aria-hidden="true"
          className="relative z-10 w-full h-auto"
          initial={{ opacity: 0, x: xOffset }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            opacity: { duration: 0.8, ease: "easeOut" },
            x: { duration: 0.8, ease: "easeOut" },
          }}
        />
      </div>
    </div>
  );
}
