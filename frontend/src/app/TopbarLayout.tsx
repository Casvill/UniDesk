import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, User, Settings as SettingsIcon, LogOut, Menu, ChevronDown } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
];

export function TopbarLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, profile, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 rounded-full" aria-label="User account menu">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.photoURL} alt={profile?.displayName || "User profile"} />
            <AvatarFallback>{profile?.username?.slice(0, 2).toUpperCase() || "UN"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
          {profile ? (
            <>
              Logged in as<br />
              <span className="font-medium text-foreground text-sm">@{profile.username}</span>
            </>
          ) : (
            "Loading profile..."
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <SettingsIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-6">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open mobile menu"
                  >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <nav className="flex flex-col gap-6 mt-8" aria-label="Mobile navigation">
                    {isAuthenticated && profile && (
                      <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                          <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase() || "UN"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">@{profile.username}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-full" title={profile.email}>{profile.email}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      {navItems.map((item) => (
                        <Button
                          key={item.path}
                          variant={item.isActive(pathname) ? "secondary" : "ghost"}
                          onClick={() => {
                            navigate(item.path);
                            setIsMobileMenuOpen(false);
                          }}
                          className="justify-start gap-2"
                        >
                          <item.Icon className="h-4 w-4" aria-hidden="true" />
                          {item.label}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate("/profile");
                          setIsMobileMenuOpen(false);
                        }}
                        className="justify-start gap-2"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate("/settings");
                          setIsMobileMenuOpen(false);
                        }}
                        className="justify-start gap-2"
                      >
                        <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                        Settings
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="text-red-600 justify-start gap-2 mt-auto"
                      aria-label="Log out"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Logout
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
              
              <img src={logo} alt="UniDesk" className="h-9 w-auto" />
              
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const isActive = item.isActive(pathname);
                  const Icon = item.Icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      onClick={() => navigate(item.path)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>

            {/* Right: User Menu & Logout */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && (
                <>
                  <UserMenu />
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
