import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Pencil, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardTransition } from "@/context/CardTransitionContext";
import { api } from "@/services/api";
import { showToast } from "@/shared/components/ui/toast";
import { GoogleIcon } from "@/shared/components/ui/google-icon"

type FormState = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

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
  const { navigateWithTransition } = useCardTransition();
  const { register, loginWithGoogle } = useAuth();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSubmitting = loading || googleLoading;

  const cleanUsername = form.username.trim();

  useEffect(() => {
    if (!cleanUsername) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 15 || !/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);

    const timer = setTimeout(async () => {
      try {
        const available = await api.checkUsername(cleanUsername);
        setUsernameAvailable(available);
      } catch (err) {
        console.warn("No se pudo validar el username:", err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cleanUsername]);

  const validate = () => {
    const newErrors: FieldErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setUsernameTouched(true);

    const validationErrors = validate();
    setErrors(validationErrors);

    let usernameError = "";

    // if (!cleanUsername) {
    //   usernameError = "El nombre de usuario es obligatorio";
    // } else if (cleanUsername.length < 3 || cleanUsername.length > 15) {
    //   usernameError = "El nombre debe tener entre 3 y 15 caracteres";
    // } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    //   usernameError = "Solo se permiten caracteres alfanuméricos, '_' y '-'";
    // } else if (checkingUsername) {
    //   usernameError = "Espera a que validemos la disponibilidad del nombre de usuario";
    // } else if (usernameAvailable !== true) {
    //   usernameError = "Este nombre de usuario no está disponible";
    // }

    if (Object.keys(validationErrors).length > 0 || usernameError) {
      if (usernameError) {
        showToast.error(usernameError);
      } else {
        showToast.error("Revisa los campos marcados antes de crear tu cuenta.");
      }
      return;
    }

    setLoading(true);

    try {
      await register(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
        form.username.trim()
      );

      showToast.success("Cuenta creada exitosamente");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error: unknown) {
      console.error("Register error:", error);

      const message = getRegisterErrorMessage(error);

      if (message.includes("nombre de usuario") || message.includes("ya está en uso")) {
        setUsernameAvailable(false);
        setUsernameTouched(true);
      }

      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      showToast.success(result?.isNewUser
        ? "Cuenta creada con Google, ingresa tu nombre de usuario para completar tu perfil"
        : "Sesión iniciada con Google");

      setTimeout(() => {
        if (result?.isNewUser) {
          navigateWithTransition("/google-profile");
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (error: unknown) {
      console.error("Google register error:", error);

      const message = getGoogleRegisterErrorMessage(error);

      showToast.error(message);
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
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    showToast.success("Imagen de perfil seleccionada correctamente.");
  };

  const getUsernameMessage = () => {
    if (!usernameTouched && !cleanUsername) return "";

    if (!cleanUsername) return "El nombre de usuario es obligatorio";
    if (cleanUsername.length < 3 || cleanUsername.length > 15) return "El nombre debe tener entre 3 y 15 caracteres";
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) return "Solo se permiten caracteres alfanuméricos, '_' y '-'";
    if (checkingUsername) return "Validando disponibilidad...";
    if (usernameAvailable === true) return "Nombre de usuario disponible";
    if (usernameAvailable === false) return "Este nombre de usuario ya está en uso";
    return "";
  };

  const usernameMessage = getUsernameMessage();

  const isUsernameError =
    usernameTouched &&
    Boolean(usernameMessage) &&
    usernameMessage !== "Nombre de usuario disponible" &&
    usernameMessage !== "Validando disponibilidad...";

  const showUsernameAsError = usernameAvailable === false || isUsernameError;

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          Crea tu cuenta
        </h1>
        <p className="text-muted-foreground">
          Compartenos los siguientes datos para crearla
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-describedby="form-status"
        noValidate
      >

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
            className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white cursor-pointer"
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
          className={`w-full px-4 py-3 border rounded-lg ${errors.fullName ? "border-red-400" : ""}`}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          autoComplete="name"
          disabled={isSubmitting}
        />

        <div className={`grid transition-all duration-300 ${errors.fullName ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {errors.fullName && (
              <p
                id="fullName-error"
                role="alert"
                aria-live="assertive"
                className="text-red-500 mt-1 text-sm flex items-center gap-1"
              >
                {errors.fullName}
              </p>
            )}
          </div>
        </div>
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
          onChange={(e) => {
            handleChange(e);
            setUsernameAvailable(null);
          }}
          onBlur={() => setUsernameTouched(true)}
          placeholder="Ej: estudiante_123"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${showUsernameAsError ? "border-red-400" : ""}`}
          aria-invalid={isUsernameError ? true : undefined}
          aria-describedby={isUsernameError ? "username-error" : undefined}
          autoComplete="username"
          disabled={isSubmitting}
        />

        <div className={`grid transition-all duration-300 ${usernameMessage ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {usernameMessage && (
              <p
                id={isUsernameError ? "username-error" : undefined}
                className={`mt-1 text-sm flex items-center gap-1 ${
                  showUsernameAsError
                    ? "text-red-500"
                    : usernameAvailable === true
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {showUsernameAsError ? (
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : usernameAvailable === true ? (
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : null}

                {usernameMessage}
              </p>
            )}
          </div>
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {usernameTouched && usernameMessage}
        </div>
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
          className={`w-full px-4 py-3 border rounded-lg ${errors.email ? "border-red-400" : ""}`}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          autoComplete="email"
          disabled={isSubmitting}
        />

        <div className={`grid transition-all duration-300 ${errors.email ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                aria-live="assertive"
                className="text-red-500 mt-1 text-sm flex items-center gap-1"
              >
                {errors.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PASSWORD */}
      <div>
        <label className="text-sm font-semibold" htmlFor="password">
          Contraseña
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
            className={`w-full px-4 pr-12 py-3 border rounded-lg ${errors.password ? "border-red-400" : ""}`}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>

        <div className={`grid transition-all duration-300 ${errors.password ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                aria-live="assertive"
                className="text-red-500 mt-1 text-sm flex items-center gap-1"
              >
                {errors.password}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM PASSWORD */}
      <div>
        <label className="text-sm font-semibold" htmlFor="confirmPassword">
          Confirmar contraseña
        </label>

        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repite tu contraseña"
            className={`w-full px-4 pr-12 py-3 border rounded-lg ${errors.confirmPassword ? "border-red-400" : ""}`}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>

        <div className={`grid transition-all duration-300 ${errors.confirmPassword ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            {errors.confirmPassword && (
              <p
                id="confirm-error"
                role="alert"
                aria-live="assertive"
                className="text-red-500 mt-1 text-sm flex items-center gap-1"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>
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

      <div className="space-y-2">
        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={loading}
          aria-disabled={isSubmitting}
          aria-label={loading ? "Creando cuenta, por favor espera" : "Crear cuenta"}
          className="w-full bg-primary-600 text-white py-3 rounded-lg flex justify-center gap-2 cursor-pointer"
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
          className="w-full border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Procesando...
            </>
          ) : (
            <>
              <GoogleIcon/>
              Continuar con Google
            </>
          )}
        </button>
      </div>


      {/* LOGIN */}
      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
        onClick={() => navigateWithTransition("/")}
        className="text-primary-600 font-semibold cursor-pointer"
          disabled={isSubmitting}
          aria-label="Ir a iniciar sesión"
        >
          Iniciar sesión
        </button>
      </p>

    </form>
    </>
  );
}