import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome, Loader2, Eye, EyeOff } from "lucide-react";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/context/AuthContext";
import { useCardTransition } from "@/context/CardTransitionContext";
import { auth } from "@/shared/services/firebase";
import { showToast } from "@/shared/components/ui/toast";

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
  const { navigateWithTransition } = useCardTransition();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSubmitting = loading || googleLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      showToast.error("Ingresa tu correo y contraseña para continuar.");
      return;
    }

    setLoading(true);

    try {
      await login(cleanEmail, password);

      if (rememberMe) {
        localStorage.setItem("rememberUser", cleanEmail);
      } else {
        localStorage.removeItem("rememberUser");
      }

      showToast.success("¡Bienvenido de nuevo!");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error: unknown) {
      console.error("Login error:", error);

      const message = await getManualLoginErrorMessage(error, cleanEmail);

      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      showToast.success("Sesión iniciada con Google");

      setTimeout(() => {
        if (result?.isNewUser) {
          navigateWithTransition("/google-profile");
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (error: unknown) {
      console.error("Google login error:", error);

      const message = getGoogleLoginErrorMessage(error);

      showToast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          Bienvenido de nuevo
        </h1>
        <p className="text-muted-foreground">
          Inicia sesión para acceder a tus salas de estudio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

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
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            disabled={isSubmitting}
            autoComplete="email"
            aria-label="Campo de correo electrónico"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-gray-700"
          >
            Contraseña
          </label>

          <button
            type="button"
            onClick={() => navigateWithTransition("/forgot-password")}
            className="text-sm font-semibold text-primary-600 hover:underline"
            aria-label="Ir a recuperación de contraseña"
            disabled={isSubmitting}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <div className="relative">
          <Lock
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            disabled={isSubmitting}
            autoComplete="current-password"
            aria-label="Campo de contraseña"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* OPTIONS */}
      <div className="flex items-center justify-between text-sm">

        {/* RECUÉRDAME */}
        <label className="pt-1 pb-1 flex items-center gap-2 text-gray-600 cursor-pointer font-normal">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-primary-500"
            aria-label="Recordar sesión en este dispositivo"
            disabled={isSubmitting}
          />
          Mantener mi sesión iniciada
        </label>
      </div>
      <div className="space-y-2">
        
        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={loading}
          aria-disabled={isSubmitting}
          aria-label={loading ? "Iniciando sesión, por favor espera" : "Iniciar sesión"}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          className="w-full border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal"
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
      </div>


      {/* REGISTER */}
      <p className="text-center text-sm">
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={() => navigateWithTransition("/register")}
          className="text-primary-600 font-semibold hover:underline text-sm"
          aria-label="Ir a registro"
          disabled={isSubmitting}
        >
          Crear cuenta
        </button>
      </p>

    </form>
    </>
  );
}