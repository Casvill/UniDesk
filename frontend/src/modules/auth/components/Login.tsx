import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome, Loader2 } from "lucide-react";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/shared/services/firebase";
import { toast } from "sonner";

type FeedbackType = "error" | "success" | "info";

type FeedbackState = {
  type: FeedbackType;
  message: string;
} | null;

function getFeedbackClasses(type: FeedbackType): string {
  if (type === "success") {
    return "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700";
  }

  if (type === "info") {
    return "rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700";
  }

  return "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";
}

async function getManualLoginErrorMessage(
  error: unknown,
  email: string
): Promise<string> {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found": {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);

          const hasGoogleProvider = methods.includes("google.com");
          const hasPasswordProvider = methods.includes("password");

          if (hasGoogleProvider && !hasPasswordProvider) {
            return "Esta cuenta fue creada con Google. Para iniciar sesión, usa el botón Continuar con Google.";
          }

          if (hasPasswordProvider) {
            return "Credenciales incorrectas. Verifica tu correo o contraseña e inténtalo nuevamente.";
          }

          return "No pudimos iniciar sesión con correo y contraseña. Si creaste tu cuenta con Google, usa el botón Continuar con Google; si fue registro manual, verifica tus credenciales.";
        } catch (providerError) {
          console.warn("No se pudieron consultar los métodos de inicio:", providerError);

          return "No pudimos iniciar sesión con correo y contraseña. Si creaste tu cuenta con Google, usa el botón Continuar con Google; si fue registro manual, verifica tus credenciales.";
        }
      }

      case "auth/invalid-email":
        return "El correo electrónico ingresado no tiene un formato válido.";

      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada. Contacta al soporte de la plataforma.";

      case "auth/too-many-requests":
        return "Hiciste demasiados intentos. Espera unos minutos antes de volver a intentar.";

      case "auth/network-request-failed":
        return "No pudimos conectarnos. Revisa tu conexión a internet e inténtalo nuevamente.";

      default:
        return "No pudimos iniciar sesión. Inténtalo nuevamente.";
    }
  }

  return "Ocurrió un error inesperado. Inténtalo nuevamente.";
}

function getGoogleLoginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
        return "Cerraste la ventana de Google antes de terminar el inicio de sesión.";

      case "auth/popup-blocked":
        return "El navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes e inténtalo nuevamente.";

      case "auth/network-request-failed":
        return "No pudimos conectarnos con Google. Revisa tu conexión a internet.";

      case "auth/account-exists-with-different-credential":
        return "Ya existe una cuenta con este correo usando otro método de inicio de sesión.";

      default:
        return "Error al autenticar con Google.";
    }
  }

  return "Error al autenticar con Google.";
}

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const isSubmitting = loading || googleLoading;
  const hasError = feedback?.type === "error";

  const clearFeedback = () => {
    if (feedback) {
      setFeedback(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFeedback(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      const message = "Ingresa tu correo y contraseña para continuar.";

      setFeedback({
        type: "error",
        message,
      });

      toast.error(message);
      return;
    }

    setLoading(true);

    setFeedback({
      type: "info",
      message: "Validando tus credenciales. Por favor espera.",
    });

    try {
      await login(cleanEmail, password);

      if (rememberMe) {
        localStorage.setItem("rememberUser", cleanEmail);
      } else {
        localStorage.removeItem("rememberUser");
      }

      const successMessage = "Sesión iniciada con correo y contraseña. Redirigiendo al dashboard.";

      setFeedback({
        type: "success",
        message: successMessage,
      });

      toast.success("¡Bienvenido de nuevo!");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error: unknown) {
      console.error("Login error:", error);

      const message = await getManualLoginErrorMessage(error, cleanEmail);

      setFeedback({
        type: "error",
        message,
      });

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFeedback(null);
    setGoogleLoading(true);

    setFeedback({
      type: "info",
      message: "Abriendo autenticación con Google. Por favor espera.",
    });

    try {
      const result = await loginWithGoogle();

      const successMessage = "Sesión iniciada con Google. Redirigiendo.";

      setFeedback({
        type: "success",
        message: successMessage,
      });

      toast.success("Login con Google exitoso");

      setTimeout(() => {
        if (result?.isNewUser) {
          navigate("/google-profile", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (error: unknown) {
      console.error("Google login error:", error);

      const message = getGoogleLoginErrorMessage(error);

      setFeedback({
        type: "error",
        message,
      });

      toast.error(message);
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

              {feedback && (
                <div
                  id="login-feedback"
                  role={feedback.type === "error" ? "alert" : "status"}
                  aria-live={feedback.type === "error" ? "assertive" : "polite"}
                  aria-atomic="true"
                  className={getFeedbackClasses(feedback.type)}
                >
                  {feedback.message}
                </div>
              )}

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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFeedback();
                    }}
                    placeholder="ejemplo@universidad.edu.co"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isSubmitting}
                    autoComplete="email"
                    aria-label="Campo de correo electrónico"
                    aria-invalid={hasError}
                    aria-describedby={feedback ? "login-feedback" : undefined}
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFeedback();
                    }}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    aria-label="Campo de contraseña"
                    aria-invalid={hasError}
                    aria-describedby={feedback ? "login-feedback" : undefined}
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
                    disabled={isSubmitting}
                  />
                  Recordarme
                </label>

                {/* RECUPERAR CONTRASEÑA */}
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-indigo-600 hover:underline"
                  aria-label="Ir a recuperación de contraseña"
                  disabled={isSubmitting}
                >
                  ¿Olvidaste tu contraseña?
                </button>

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={loading}
                aria-disabled={isSubmitting}
                aria-label={loading ? "Iniciando sesión, por favor espera" : "Iniciar sesión"}
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
                disabled={isSubmitting}
                aria-busy={googleLoading}
                aria-disabled={isSubmitting}
                aria-label={googleLoading ? "Autenticando con Google, por favor espera" : "Iniciar sesión con Google"}
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
                  disabled={isSubmitting}
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