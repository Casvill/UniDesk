import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, User, Settings as SettingsIcon, LogOut, Menu } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
  label: string;
  path: string;
  isActive: (pathname: string) => boolean;
  Icon: typeof Home;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    isActive: (pathname) => pathname === "/dashboard",
    Icon: Home,
  },
  {
    label: "Browse Rooms",
    path: "/rooms",
    isActive: (pathname) => pathname.startsWith("/rooms"),
    Icon: Search,
  },
  {
    label: "Profile",
    path: "/profile",
    isActive: (pathname) => pathname.startsWith("/profile"),
    Icon: User,
  },
  {
    label: "Settings",
    path: "/settings",
    isActive: (pathname) => pathname.startsWith("/settings"),
    Icon: SettingsIcon,
  },
];

export function TopbarLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

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
                    {user && (
                      <div className="px-5 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase">Authenticated as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || user.email}</p>
                      </div>
                    )}
                    <nav aria-label="Mobile navigation" className="flex-1 px-4 py-4">
                      <ul className="space-y-2">
                        {navItems.map((item) => {
                          const isActive = item.isActive(pathname);
                          const Icon = item.Icon;

                          return (
                            <li key={item.path}>
                              <button
                                onClick={() => {
                                  navigate(item.path);
                                  setIsMobileMenuOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-sm font-semibold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition flex items-center gap-2 ${
                                  isActive
                                    ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                                aria-current={isActive ? "page" : undefined}
                              >
                                <Icon className="h-4 w-4" />
                                {item.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </nav>
                    <div className="px-4 py-4 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
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
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
              <ul className="flex flex-wrap gap-2 md:gap-1">
                {navItems.map((item) => {
                  const isActive = item.isActive(pathname);
                  const Icon = item.Icon;

                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => navigate(item.path)}
                        className={`px-3 py-2 text-sm font-semibold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition flex items-center gap-1 ${
                          isActive
                            ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="h-6 w-px bg-gray-200 mx-2" />
              <div className="flex items-center gap-4">
                {user && (
                  <div className="hidden lg:block text-right">
                    <p className="text-xs text-gray-500 font-medium leading-none mb-1">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                      {user.displayName || user.email}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
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
