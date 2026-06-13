import { useEffect } from "react";

const ANIM_NAMES = ["uf0", "uf1", "uf2", "uf3", "uf4"];
const ANIM_DURS = ["6.3s", "7.5s", "8s", "6.7s", "7.1s"];

export function useFloatingAnimation() {
  useEffect(() => {
    const styleId = "ud-float";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId; 
    s.textContent = `
      @keyframes uf0 { 0%,100% { transform:translateY(12px) rotate(-1.5deg) } 50% { transform:translateY(-12px) rotate(1.5deg) } }
      @keyframes uf1 { 0%,100% { transform:translateY(10px) rotate(1deg) } 50% { transform:translateY(-10px) rotate(-1deg) } }
      @keyframes uf2 { 0%,100% { transform:translateY(14px) rotate(-0.5deg) } 50% { transform:translateY(-14px) rotate(0.5deg) } }
      @keyframes uf3 { 0%,100% { transform:translateY(8px) rotate(1.5deg) } 50% { transform:translateY(-8px) rotate(-1.5deg) } }
      @keyframes uf4 { 0%,100% { transform:translateY(10.5px) rotate(-1deg) } 50% { transform:translateY(-10.5px) rotate(1deg) } }
    `;
    document.head.appendChild(s); 
    return () => document.getElementById(styleId)?.remove();
  }, []);

  return { animNames: ANIM_NAMES, animDurs: ANIM_DURS };
}
