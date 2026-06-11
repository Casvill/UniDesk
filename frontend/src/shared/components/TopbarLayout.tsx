import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, UserPen, LogOut, Menu, ChevronDown } from "lucide-react";
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
    label: "Principal",
    path: "/dashboard",
    isActive: (pathname) => pathname === "/dashboard",
    Icon: Home,
  },
];

export function TopbarLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, profile, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoRef = useRef<HTMLButtonElement>(null);

  const username = profile?.username || "usuario";

  useEffect(() => {
    if (pathname === "/dashboard") {
      const timeout = window.setTimeout(() => {
        logoRef.current?.focus();
      }, 400);

      return () => window.clearTimeout(timeout);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto px-2 py-1.5 rounded-full flex items-center gap-2"
          aria-label={`Abrir menú de cuenta de ${username}`}
        >
          <ChevronDown
            className="h-4 w-4 text-gray-400 hidden lg:block"
            aria-hidden="true"
          />

          <Avatar className="h-10 w-10" aria-hidden="true">
            <AvatarImage src={profile?.photoURL} alt="" />
            <AvatarFallback>
              {profile?.username?.slice(0, 2).toUpperCase() || "UN"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
          {profile ? (
            <>
              Sesión activa como
              <br />
              <span className="font-medium text-foreground text-sm">
                @{profile.username}
              </span>
            </>
          ) : (
            "Cargando perfil..."
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/my-profile")}
          aria-label="Ir a mi perfil"
        >
          <UserPen className="mr-2 h-4 w-4" aria-hidden="true" />
          Mi perfil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 md:flex-none">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Abrir menú principal"
                    aria-expanded={isMobileMenuOpen}
                  >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-64"
                  aria-label="Menú principal móvil"
                >
                  <nav
                    className="flex flex-col gap-6 mt-8"
                    aria-label="Navegación móvil"
                  >
                    {isAuthenticated && profile && (
                      <div
                        className="flex items-center gap-3 px-2"
                        aria-label={`Sesión activa como ${profile.username}`}
                      >
                        <Avatar className="h-10 w-10" aria-hidden="true">
                          <AvatarImage src={profile.photoURL} alt="" />
                          <AvatarFallback>
                            {profile.username?.slice(0, 2).toUpperCase() || "UN"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">
                            @{profile.username}
                          </span>

                          <span
                            className="text-xs text-muted-foreground truncate max-w-full"
                            title={profile.email}
                          >
                            {profile.email}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      {navItems.map((item) => {
                        const isActive = item.isActive(pathname);
                        const Icon = item.Icon;

                        return (
                          <Button
                            key={item.path}
                            variant={isActive ? "secondary" : "ghost"}
                            onClick={() => {
                              navigate(item.path);
                              setIsMobileMenuOpen(false);
                            }}
                            className="justify-start gap-2"
                            aria-current={isActive ? "page" : undefined}
                            aria-label={
                              isActive
                                ? `${item.label}, página actual`
                                : `Ir a ${item.label}`
                            }
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {item.label}
                          </Button>
                        );
                      })}

                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate("/my-profile");
                          setIsMobileMenuOpen(false);
                        }}
                        className="justify-start gap-2"
                        aria-label="Ir a mi perfil"
                      >
                        <UserPen className="h-4 w-4" aria-hidden="true" />
                        Mi perfil
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="text-red-600 justify-start gap-2 mt-auto"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Logout
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="flex-1 flex justify-center md:justify-start md:flex-none">
                <button
                  ref={logoRef}
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer rounded-lg"
                  aria-label="Logo de UniDesk. Actualmente estás en UniDesk, en la página principal del dashboard. Aquí puedes crear, consultar y entrar a tus salas de estudio colaborativas."
                >
                  <img
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                    className="h-12 w-auto"
                  />
                </button>
            </div>
          </div>

          <div
              className="hidden md:flex items-center gap-2"
              aria-label="Opciones de cuenta"
            >
              {isAuthenticated && (
                <>
                  <UserMenu />

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Salir
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        id="contenido-principal"
        className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        aria-label="Contenido principal"
      >
        <Outlet />
      </main>
    </div>
  );
}