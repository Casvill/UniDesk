import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Chrome, Pencil, Loader2 } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type FormState = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

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

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "";
}

function getRegisterErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  switch (code) {
    case "auth/email-already-in-use":
      return "Ya existe una cuenta registrada con este correo. Intenta iniciar sesión o usa otro correo.";

    case "auth/invalid-email":
      return "El correo electrónico ingresado no tiene un formato válido.";

    case "auth/weak-password":
      return "La contraseña es muy débil. Usa mínimo 8 caracteres.";

    case "auth/operation-not-allowed":
      return "El registro con correo y contraseña no está habilitado.";

    case "auth/network-request-failed":
      return "No pudimos conectarnos con Firebase. Revisa tu conexión a internet e inténtalo nuevamente.";

    case "auth/too-many-requests":
      return "Hiciste demasiados intentos. Espera unos minutos antes de volver a intentar.";

    case "backend/profile-create-failed":
      return "No pudimos completar el registro porque el servidor de perfiles no está disponible. Verifica que el backend esté corriendo e inténtalo nuevamente.";

    case "backend/username-already-exists":
      return "El nombre de usuario ya está en uso. Intenta con otro.";

    default:
      break;
  }

  if (
    message.includes("email-already-in-use") ||
    message.includes("email address is already in use") ||
    message.includes("already in use")
  ) {
    return "Ya existe una cuenta registrada con este correo. Intenta iniciar sesión o usa otro correo.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("err_connection_refused")
  ) {
    return "No pudimos completar el registro porque el servidor de perfiles no está disponible. Verifica que el backend esté corriendo e inténtalo nuevamente.";
  }

  if (
    message.includes("username") ||
    message.includes("usuario") ||
    message.includes("ocupado") ||
    message.includes("already exists")
  ) {
    return "El nombre de usuario ya está en uso. Intenta con otro.";
  }

  return "No pudimos crear la cuenta. Revisa los datos e inténtalo nuevamente.";
}

function getGoogleRegisterErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  switch (code) {
    case "auth/popup-closed-by-user":
      return "Cerraste la ventana de Google antes de terminar el registro.";

    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes e inténtalo nuevamente.";

    case "auth/network-request-failed":
      return "No pudimos conectarnos con Google. Revisa tu conexión a internet.";

    case "auth/account-exists-with-different-credential":
      return "Ya existe una cuenta con este correo usando otro método de inicio de sesión.";

    default:
      break;
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("err_connection_refused")
  ) {
    return "Iniciaste sesión con Google, pero no pudimos completar tu perfil porque el servidor no está disponible.";
  }

  return "No pudimos registrar la cuenta con Google. Inténtalo nuevamente.";
}

export function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSubmitting = loading || googleLoading;

  useEffect(() => {
    if (feedback && feedbackRef.current) {
      feedbackRef.current.focus();
    }
  }, [feedback]);

  const validate = () => {
    const newErrors: FieldErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio";
    }

    if (!form.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio";
    } else if (form.username.trim().length < 3 || form.username.trim().length > 15) {
      newErrors.username = "El nombre debe tener entre 3 y 15 caracteres";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(form.username.trim())) {
      newErrors.username = "Solo se permiten caracteres alfanuméricos, '_' y '-'";
    }

    if (!form.email.trim()) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Correo inválido";
    }

    if (!form.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (form.password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    return newErrors;
  };

  const clearFieldError = (fieldName: keyof FormState) => {
    setErrors((prevErrors) => {
      if (!prevErrors[fieldName]) return prevErrors;

      const updatedErrors = { ...prevErrors };
      delete updatedErrors[fieldName];
      return updatedErrors;
    });
  };

  const clearFeedback = () => {
    if (feedback) {
      setFeedback(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFeedback(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const message = "Revisa los campos marcados antes de crear tu cuenta.";

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
      message: "Creando tu cuenta. Por favor espera.",
    });

    try {
      await register(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
        form.username.trim()
      );

      const successMessage = "Cuenta creada exitosamente. Redirigiendo al dashboard.";

      setFeedback({
        type: "success",
        message: successMessage,
      });

      toast.success("Cuenta creada exitosamente");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error: unknown) {
      console.error("Register error:", error);

      const message = getRegisterErrorMessage(error);

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
      message: "Abriendo registro con Google. Por favor espera.",
    });

    try {
      const result = await loginWithGoogle();

      const successMessage = result?.isNewUser
        ? "Cuenta creada con Google. Completa tu perfil para continuar."
        : "Sesión iniciada con Google. Redirigiendo al dashboard.";

      setFeedback({
        type: "success",
        message: successMessage,
      });

      toast.success("Cuenta creada con Google");

      setTimeout(() => {
        if (result?.isNewUser) {
          navigate("/google-profile", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (error: unknown) {
      console.error("Google register error:", error);

      const message = getGoogleRegisterErrorMessage(error);

      setFeedback({
        type: "error",
        message,
      });

      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name as keyof FormState;
    const value = e.target.value;

    setForm({
      ...form,
      [fieldName]: value,
    });

    clearFieldError(fieldName);
    clearFeedback();

    if (fieldName === 'username') {
      const trimmedValue = value.trim();
      let error = "";
      if (trimmedValue.length > 0 && (trimmedValue.length < 3 || trimmedValue.length > 15)) {
        error = "El nombre debe tener entre 3 y 15 caracteres";
      } else if (trimmedValue.length > 0 && !/^[a-zA-Z0-9_-]+$/.test(trimmedValue)) {
        error = "Solo se permiten caracteres alfanuméricos, '_' y '-'";
      }
      
      setErrors(prev => ({
        ...prev,
        username: error
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    setFeedback({
      type: "success",
      message: "Imagen de perfil seleccionada correctamente.",
    });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4"
      aria-label="Pantalla de registro"
    >
      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <header className="text-center mb-8">
            <img
              src={logo}
              alt="UniDesk plataforma de estudio colaborativo"
              className="h-20 w-auto mb-3 mx-auto"
            />

            <h1 className="text-2xl font-bold">
              Crea tu cuenta
            </h1>

            <p className="text-gray-600">
              Únete a UniDesk
            </p>
          </header>

          {/* CARD */}
          <section
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100"
            aria-label="Formulario de registro"
          >
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              aria-describedby={feedback ? "form-feedback" : "form-status"}
              noValidate
            >

              {feedback && (
                <div
                  id="form-feedback"
                  ref={feedbackRef}
                  tabIndex={-1}
                  role={feedback.type === "error" ? "alert" : "status"}
                  aria-live={feedback.type === "error" ? "assertive" : "polite"}
                  aria-atomic="true"
                  className={getFeedbackClasses(feedback.type)}
                >
                  {feedback.message}
                </div>
              )}

              {/* AVATAR */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">

                  <div
                    className="w-24 h-24 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden"
                    aria-label={
                      avatarPreview
                        ? "Vista previa del avatar seleccionado"
                        : "Vista previa del avatar"
                    }
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Vista previa del avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" aria-hidden="true" />
                    )}
                  </div>

                  <label
                    htmlFor="avatar"
                    className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white cursor-pointer"
                    aria-label="Subir imagen de perfil"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </label>

                  <input
                    id="avatar"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                    aria-label="Seleccionar imagen de perfil"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* FULL NAME */}
              <div>
                <label className="text-sm font-semibold" htmlFor="fullName">
                  Nombre completo
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 border rounded-lg"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  autoComplete="name"
                  disabled={isSubmitting}
                />

                {errors.fullName && (
                  <p
                    id="fullName-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-xs"
                  >
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* USERNAME */}
              <div>
                <label className="text-sm font-semibold" htmlFor="username">
                  Usuario
                </label>

                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Ej: estudiante_123"
                  className="w-full px-4 py-3 border rounded-lg"
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={errors.username ? "username-error" : undefined}
                  autoComplete="username"
                  disabled={isSubmitting}
                />

                {errors.username && (
                  <p
                    id="username-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-xs"
                  >
                    {errors.username}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm font-semibold" htmlFor="email">
                  Correo institucional o personal
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ejemplo@universidad.edu.co"
                  className="w-full px-4 py-3 border rounded-lg"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  autoComplete="email"
                  disabled={isSubmitting}
                />

                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-xs"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-semibold" htmlFor="password">
                  Contraseña
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 border rounded-lg"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />

                {errors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-xs"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-sm font-semibold" htmlFor="confirmPassword">
                  Confirmar contraseña
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 border rounded-lg"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />

                {errors.confirmPassword && (
                  <p
                    id="confirm-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-xs"
                  >
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* STATUS ANNOUNCER */}
              <div
                id="form-status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {loading && "Creando tu cuenta. Por favor espera."}
                {googleLoading && "Procesando registro con Google. Por favor espera."}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={loading}
                aria-disabled={isSubmitting}
                aria-label={loading ? "Creando cuenta, por favor espera" : "Crear cuenta"}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg flex justify-center gap-2"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                {loading ? "Creando..." : "Crear cuenta"}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                aria-busy={googleLoading}
                aria-disabled={isSubmitting}
                aria-label={
                  googleLoading
                    ? "Procesando registro con Google, por favor espera"
                    : "Continuar con Google"
                }
                className="w-full border py-3 rounded-lg flex justify-center gap-2"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Chrome className="h-5 w-5" aria-hidden="true" />
                    Continuar con Google
                  </>
                )}
              </button>

              {/* LOGIN */}
              <p className="text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-indigo-600 font-semibold"
                  disabled={isSubmitting}
                  aria-label="Ir a iniciar sesión"
                >
                  Iniciar sesión
                </button>
              </p>

            </form>
          </section>
        </div>
      </main>
    </div>
  );
}