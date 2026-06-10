import { useEffect } from "react";

const ANIM_NAMES = ["uf0", "uf1", "uf2", "uf3", "uf4"];
const ANIM_DURS = ["5.5s", "6.5s", "7s", "5.8s", "6.2s"];

export function useFloatingAnimation() {
  useEffect(() => {
    const styleId = "ud-float";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      @keyframes uf0 { 0%,100% { transform:translateY(0) rotate(-1.5deg) } 50% { transform:translateY(-16px) rotate(1.5deg) } }
      @keyframes uf1 { 0%,100% { transform:translateY(0) rotate(1deg) } 50% { transform:translateY(-14px) rotate(-1deg) } }
      @keyframes uf2 { 0%,100% { transform:translateY(0) rotate(-0.5deg) } 50% { transform:translateY(-18px) rotate(0.5deg) } }
      @keyframes uf3 { 0%,100% { transform:translateY(0) rotate(1.5deg) } 50% { transform:translateY(-12px) rotate(-1.5deg) } }
      @keyframes uf4 { 0%,100% { transform:translateY(0) rotate(-1deg) } 50% { transform:translateY(-15px) rotate(1deg) } }
    `;
    document.head.appendChild(s);
    return () => document.getElementById(styleId)?.remove();
  }, []);

  return { animNames: ANIM_NAMES, animDurs: ANIM_DURS };
}
