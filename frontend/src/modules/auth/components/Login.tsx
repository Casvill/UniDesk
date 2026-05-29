import { useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome, Loader2, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useState } from "react";

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!email.trim()) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Correo inválido";

    if (!password) return "La contraseña es obligatoria";
    if (password.length < 8) return "Mínimo 8 caracteres";

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess(false);
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      await new Promise((res) => setTimeout(res, 1200));

      const userExists = true;

      if (!userExists) {
        setError("Usuario no registrado");
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 900);

    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      await new Promise((res) => setTimeout(res, 1200));

      const googleUser = {
        uid: "123",
        fullName: "Juan Perez",
        email: "juan.perez@correoinstitucional.edu.co",
        photoURL: "https://i.pravatar.cc/200",
      };

      const userExists = false;

      if (userExists) {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        navigate("/google-profile", { state: googleUser });
      }

    } catch {
      setError("Error con Google Login");
    } finally {
      setLoading(false);
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
              alt="UniDesk login"
              className="h-20 w-auto inline-flex mb-3 mt-2"
            />

            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido a UniDesk
            </h1>

            <p className="text-gray-600">
              Inicia sesión en tu cuenta
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
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@universidad.edu.co"
                    className="w-full pl-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full pl-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    aria-invalid={!!error}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Usa tu contraseña registrada
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

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
                disabled={loading || success}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2
                  ${success
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {success && <CheckCircle className="h-5 w-5" />}

                {loading
                  ? "Iniciando sesión..."
                  : success
                  ? "Bienvenido"
                  : "Iniciar Sesión"}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <Chrome className="h-5 w-5" />
                Continuar con Google
              </button>

              {/* REGISTER */}
              <p className="text-center text-sm">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-indigo-600 font-semibold"
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