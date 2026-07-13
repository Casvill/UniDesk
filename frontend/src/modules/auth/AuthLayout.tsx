import { Outlet } from "react-router-dom";
import { AnimatedCard } from "@/shared/components/AnimatedCard";
import logo from "@/assets/logo/unified-logo-light.svg";
import AuthDecorations from "./decorations/AuthDecorations";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-8 overflow-hidden">
      <AuthDecorations />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-5">
          <img
            src={logo}
            alt="UniDesk"
            className="h-20 w-auto inline-flex"
          />
        </div>
        <AnimatedCard className="w-full bg-card text-card-foreground rounded-2xl shadow-lg p-7 border border-border">
          <Outlet />
        </AnimatedCard>
      </div>
    </div>
  );
}
