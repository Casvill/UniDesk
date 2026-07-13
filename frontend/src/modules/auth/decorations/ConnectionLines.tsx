import { motion } from "motion/react";

const lines = [
  // Characters (existing)
  { d: "M 28,22 C 35,14 33,36 42,26 C 46,21 49,38 50,46", key: "tl", opacity: 0.25 },
  { d: "M 28,78 C 36,86 32,66 40,74 C 47,80 48,62 50,54", key: "bl", opacity: 0.25 },
  { d: "M 72,22 C 64,16 68,34 58,26 C 54,20 52,40 50,46", key: "tr", opacity: 0.25 },
  { d: "M 72,78 C 65,72 62,60 56,68 C 52,74 51,60 50,54", key: "br", opacity: 0.25 },

  // Additional — from off-screen edges (25% less opacity, 25% slower)
  { d: "M 0,50 C 12,40 22,58 34,48 C 42,42 46,54 50,50", key: "side-l", opacity: 0.19, duration: 17 },
  { d: "M 100,50 C 88,60 78,42 66,52 C 58,58 54,46 50,50", key: "side-r", opacity: 0.19, duration: 17 },
  { d: "M 50,100 C 40,86 58,76 46,66 C 42,60 48,56 50,52", key: "bottom", opacity: 0.19, duration: 17 },
];

export default function ConnectionLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="lineGrad" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7959eb" stopOpacity="0" />
          <stop offset="14%" stopColor="#7959eb" stopOpacity="0" />
          <stop offset="100%" stopColor="#7959eb" stopOpacity="1" />
        </radialGradient>
      </defs>
      {lines.map(({ d, key, opacity, duration = 13.5 }) => (
        <motion.path
          key={key}
          d={d}
          fill="none"
          stroke="url(#lineGrad)"
          strokeOpacity={opacity}
          strokeWidth={0.35}
          strokeLinecap="round"
          strokeDasharray="2 4"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -100 }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </svg>
  );
}
