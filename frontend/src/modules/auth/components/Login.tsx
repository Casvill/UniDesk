import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome, Loader2, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Correo inválido";

    if (!password) return "La contraseña es obligatoria";
    if (password.length < 8) return "Mínimo 8 caracteres";

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      await login(email, password);

      setSuccess(true);
      toast.success("Bienvenido");

      setTimeout(() => navigate("/dashboard"), 800);
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const result = await loginWithGoogle();

      toast.success("Login con Google exitoso");

      if (result?.isNewUser) {
        navigate("/google-profile", { state: result.user });
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Error con Google Login");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">

      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="UniDesk, plataforma de salas de estudio colaborativo"
              className="h-20 w-auto inline-flex mb-3 mt-2"
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Bienvenido a UniDesk
            </h1>

            <p className="text-gray-600">
              Inicia sesión para entrar a tus salas de estudio en tiempo real
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Correo institucional o personal
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" aria-hidden="true" />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@universidad.edu.co"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={loading || googleLoading}
                    aria-invalid={!!error}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Contraseña
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" aria-hidden="true" />

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={loading || googleLoading}
                    aria-invalid={!!error}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Usa tu contraseña para acceder a tus salas de estudio
                </p>
              </div>

              {/* ERROR */}
              <div aria-live="polite">
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* SUCCESS */}
              {success && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Inicio de sesión exitoso
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {success && <CheckCircle className="h-5 w-5" />}

                {loading
                  ? "Iniciando sesión..."
                  : success
                  ? "Bienvenido"
                  : "Iniciar sesión"}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Chrome className="h-5 w-5" />
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
                >
                  Crear cuenta
                </button>
              </p>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}