import { Outlet } from "react-router-dom";
import { AnimatedCard } from "@/shared/components/AnimatedCard";
import logo from "@/assets/logo/unified-logo-light.svg";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="UniDesk"
            className="h-20 w-auto inline-flex mb-3"
          />
        </div>
        <AnimatedCard className="w-full bg-card text-card-foreground rounded-2xl shadow-lg p-8 border border-border">
          <Outlet />
        </AnimatedCard>
      </div>
    </div>
  );
}
