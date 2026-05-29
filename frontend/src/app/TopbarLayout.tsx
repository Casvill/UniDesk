import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";

export function TopbarLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden hover:bg-gray-100 transition"
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <div className="h-full flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-200">
                      <img src={logo} alt="UniDesk" className="h-8 w-auto" />
                    </div>
                    <div className="px-4 py-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          navigate("/");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <img
                src={logo}
                alt="UniDesk"
                className="h-9 sm:h-10 w-auto"
              />
            </div>
            <nav aria-label="Main navigation" className="hidden md:block md:ml-auto">
              <button
                onClick={() => navigate("/")}
                className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
