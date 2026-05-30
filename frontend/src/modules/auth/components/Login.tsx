import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome, Loader2 } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await login(email, password);

      if (rememberMe) {
        localStorage.setItem("rememberUser", email);
      } else {
        localStorage.removeItem("rememberUser");
      }

      toast.success("¡Bienvenido de nuevo!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result?.isNewUser) {
        navigate("/google-profile");
      } else {
        navigate("/dashboard");
      }

      toast.success("Login con Google exitoso");
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error("Error al autenticar con Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8"
      aria-label="Pantalla de inicio de sesión"
    >
      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <header className="text-center mb-8">
            <img
              src={logo}
              alt="UniDesk, plataforma de salas de estudio colaborativo"
              className="h-20 w-auto inline-flex mb-3 mt-2"
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Bienvenido a UniDesk
            </h1>

            <p className="text-gray-600">
              Inicia sesión para acceder a tus salas de estudio en tiempo real
            </p>
          </header>

          {/* CARD */}
          <section
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100"
            aria-label="Formulario de inicio de sesión"
          >
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-semibold text-gray-700"
                >
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@universidad.edu.co"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={loading || googleLoading}
                    autoComplete="email"
                    aria-label="Campo de correo electrónico"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-semibold text-gray-700"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={loading || googleLoading}
                    autoComplete="current-password"
                    aria-label="Campo de contraseña"
                  />
                </div>
              </div>

              {/* OPTIONS */}
              <div className="flex items-center justify-between text-sm">

                {/* RECUÉRDAME */}
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300"
                    aria-label="Recordar sesión en este dispositivo"
                  />
                  Recordarme
                </label>

                {/* RECUPERAR CONTRASEÑA */}
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-indigo-600 hover:underline"
                  aria-label="Ir a recuperación de contraseña"
                >
                  ¿Olvidaste tu contraseña?
                </button>

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                aria-busy={loading}
                aria-label="Iniciar sesión"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                aria-busy={googleLoading}
                aria-label="Iniciar sesión con Google"
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <Chrome className="h-5 w-5" aria-hidden="true" />
                    Continuar con Google
                  </>
                )}
              </button>

              {/* REGISTER */}
              <p className="text-center text-sm">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-indigo-600 font-semibold hover:underline"
                  aria-label="Ir a registro"
                >
                  Crear cuenta
                </button>
              </p>

            </form>
          </section>
        </div>
      </main>
    </div>
  );
}