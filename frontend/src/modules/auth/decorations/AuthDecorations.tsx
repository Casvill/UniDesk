import Character from "./Character";
import ConnectionLines from "./ConnectionLines";
import BgGlows from "./BgGlows";

import character1 from "@/assets/auth/Character1.svg";
import character2 from "@/assets/auth/Character2.svg";
import character3 from "@/assets/auth/Character3.svg";
import character4 from "@/assets/auth/Character4.svg";
// import ChatBubble from "./ChatBubble";
// import chatbub1 from "@/assets/auth/chatbub1.svg";
// import chatbub2 from "@/assets/auth/chatbub2.svg";

export default function AuthDecorations() {
  return (
    <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Left side */}
      <Character
        src={character1}
        side="left"
        className="absolute top-[8%] left-[6%] w-[22.5rem] h-auto"
      />
      <Character
        src={character3}
        side="left"
        className="absolute bottom-[8%] left-[9%] w-72 h-auto"
      />

      {/* Right side */}
      <Character
        src={character2}
        side="right"
        className="absolute top-[8%] right-[9%] w-72 h-auto"
      />
      <Character
        src={character4}
        side="right"
        className="absolute bottom-[8%] right-[6%] w-[22.5rem] h-auto"
      />

      {/* Background glows */}
      <BgGlows />

      {/* Connection lines */}
      <ConnectionLines />
    </div>
  );
}
