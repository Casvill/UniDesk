import { useNavigate } from "react-router-dom";
import { User, Pencil, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { showToast } from "@/shared/components/ui/toast";
import { useAutoTour } from "@/hooks/useAutoTour";
import { storage } from "@/shared/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { validateImage, resizeAndCompress, revokeObjectUrl } from "@/shared/utils/image";
import { AvatarCropDialog } from "@/shared/components/AvatarCropDialog";

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

function getCompleteProfileErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  switch (code) {
    case "backend/username-already-exists":
      return "Este nombre de usuario ya está en uso";

    case "backend/profile-create-failed":
      return "No pudimos completar tu perfil porque el servidor no está disponible. Inténtalo nuevamente.";

    default:
      break;
  }

  if (
    message.includes("username") ||
    message.includes("usuario") ||
    message.includes("already exists") ||
    message.includes("ya existe") ||
    message.includes("ocupado")
  ) {
    return "Este nombre de usuario ya está en uso";
  }

  if (message.includes("institucional")) {
    return getErrorMessage(error);
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("err_connection_refused")
  ) {
    return "No pudimos completar tu perfil porque el servidor no está disponible. Inténtalo nuevamente.";
  }

  return "Error al completar el registro";
}

export function GooglePage() {
  const navigate = useNavigate();
  const { user, status, completeProfile } = useAuth();
  const tourStep = useAutoTour({ enabled: status === "needs-profile" });

  useEffect(() => {
    document.title = "Completar perfil - UniDesk";
  }, []);

  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  const [usernameTouched, setUsernameTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cleanUsername = username.trim();

  const isUsernameFormatValid =
    cleanUsername.length >= 3 && cleanUsername.length <= 15 && /^[a-zA-Z0-9_-]+$/.test(cleanUsername);

  const isUsernameValid =
    isUsernameFormatValid && usernameAvailable === true && !checkingUsername;

  const isSubmitting = loading || success;

  const isButtonDisabled = isSubmitting || !isUsernameValid;

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate("/", { replace: true });
    } else if (status === "authenticated") {
      navigate("/dashboard", { replace: true });
    } else if (user?.photoURL) {
      setAvatarPreview(user.photoURL);
    }
  }, [status, user, navigate]);

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

  const getUsernameMessage = useCallback(() => {
    if (!usernameTouched && !cleanUsername) return "";

    if (!cleanUsername) {
      return "El nombre de usuario es obligatorio";
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 15) {
      return "El nombre debe tener entre 3 y 15 caracteres";
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return "Solo caracteres alfanuméricos, '_' y '-'";
    }

    if (checkingUsername) {
      return "Validando disponibilidad...";
    }

    if (usernameAvailable === true) {
      return "Nombre de usuario disponible";
    }

    if (usernameAvailable === false) {
      return "Este nombre de usuario ya está en uso";
    }

    return "";
  }, [usernameTouched, cleanUsername, checkingUsername, usernameAvailable]);

  const usernameMessage = getUsernameMessage();

  const isUsernameError =
    usernameTouched &&
    Boolean(usernameMessage) &&
    usernameMessage !== "Nombre de usuario disponible" &&
    usernameMessage !== "Validando disponibilidad...";

  const showUsernameAsError =
    usernameAvailable === false || isUsernameError;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setUsernameTouched(true);

    if (!isUsernameValid) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      let photoURL = user?.photoURL || "";

      if (selectedAvatarFile) {
        const avatarRef = ref(storage, `avatars/${user!.uid}/profile.jpg`);
        await uploadBytes(avatarRef, selectedAvatarFile);
        photoURL = await getDownloadURL(avatarRef);
      }

      await completeProfile({
        username: cleanUsername,
        displayName: user?.displayName || "Usuario de Google",
        photoURL,
      });

      setSuccess(true);

      showToast.success("Perfil completado exitosamente");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } catch (err: unknown) {
      console.error("Complete Google profile error:", err);

      const message = getCompleteProfileErrorMessage(err);

      if (message === "Este nombre de usuario ya está en uso") {
        setUsernameAvailable(false);
        setUsernameTouched(true);
      } else {
        showToast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImage(file);
      revokeObjectUrl(avatarPreview ?? "");
      setCropImageUrl(URL.createObjectURL(file));
      setCropDialogOpen(true);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Error al procesar la imagen.");
    }
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    try {
      const processed = await resizeAndCompress(croppedBlob);
      const processedFile = new File([processed], "avatar.jpg", { type: "image/jpeg" });
      setSelectedAvatarFile(processedFile);
      setAvatarPreview(URL.createObjectURL(processed));

      revokeObjectUrl(cropImageUrl ?? "");
      setCropImageUrl(null);
      setCropDialogOpen(false);

      showToast.success("Imagen de perfil seleccionada correctamente");
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Error al procesar la imagen.");
    }
  };

  const handleCropCancel = () => {
    revokeObjectUrl(cropImageUrl ?? "");
    setCropImageUrl(null);
    setCropDialogOpen(false);
  };

  if (status !== "needs-profile" || !user) return null;

  return (
    <>
      <div ref={tourStep(0)} className="text-center mb-6 outline-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Completa tu perfil
        </h1>
        <p className="text-muted-foreground">
          Solo falta tu nombre de usuario...
        </p>
      </div>

      {/* AVATAR */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">

          <div
            role="img"
            className="w-24 h-24 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center"
            aria-label="Vista previa del avatar"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-gray-400" aria-hidden="true" />
            )}
          </div>

          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="peer sr-only"
            aria-label="Seleccionar imagen de avatar"
            disabled={isSubmitting}
          />

          <label
            htmlFor="avatarInput"
            className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary-500"
            aria-label="Cambiar imagen de perfil"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </label>

        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-describedby="google-profile-status"
        noValidate
      >
        <div
          ref={tourStep(1)}
          tabIndex={-1}
          className="sr-only outline-none"
        >
          Estás completando tu registro en UniDesk a través de Google. El formulario contiene los siguientes campos y botones en orden de tabulación: Primero, un botón para cargar o cambiar tu imagen de perfil. Segundo, un campo con tu Nombre Completo que ya está prellenado por Google y no es editable. Tercero, un campo obligatorio para ingresar tu nombre de usuario deseado. Y por último, el botón Continuar para guardar tus datos y finalizar el registro.
        </div>

        {/* FULL NAME */}
        <div>
          <label className="text-sm font-semibold text-gray-700" htmlFor="googleFullName">
            Nombre completo
          </label>

          <input
            id="googleFullName"
            value={user.displayName || ""}
            disabled
            className="w-full pl-4 py-3 border rounded-lg bg-gray-100"
            aria-describedby="googleFullName-help"
          />
          <p id="googleFullName-help" className="sr-only">
            Este campo fue prellenado por Google y no es editable.
          </p>
        </div>

        {/* USERNAME */}
        <div>
          <label className="text-sm font-semibold text-gray-700" htmlFor="googleUsername">
            Nombre de usuario
          </label>

          <input
            id="googleUsername"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameAvailable(null);
            }}
            onBlur={() => setUsernameTouched(true)}
            placeholder="Ej: estudiante_123"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            aria-invalid={isUsernameError ? true : undefined}
            aria-describedby={isUsernameError ? "username-error" : undefined}
            autoComplete="username"
            aria-required="true"
            disabled={isSubmitting}
          />

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
              ) : checkingUsername ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" aria-hidden="true" />
              ) : null}

              {usernameMessage}
            </p>
          )}

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
          <label className="text-sm font-semibold text-gray-700" htmlFor="googleEmail">
            Correo institucional o personal
          </label>

          <input
            id="googleEmail"
            value={user.email || ""}
            disabled
            className="w-full pl-4 py-3 border rounded-lg bg-gray-100"
            aria-describedby="googleEmail-help"
          />
          <p id="googleEmail-help" className="sr-only">
            Este campo fue prellenado por Google y no es editable.
          </p>
        </div>

        {/* STATUS ANNOUNCER */}
        <div
          id="google-profile-status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {loading && "Completando tu perfil. Por favor espera."}
          {success && "Perfil completado exitosamente. Redirigiendo al dashboard."}
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={isButtonDisabled}
          aria-busy={loading}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition cursor-pointer
            ${
              success
                ? "bg-green-600 text-white"
                : "bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {success && <CheckCircle className="h-5 w-5" aria-hidden="true" />}

          {loading
            ? "Creando cuenta..."
            : success
            ? "¡Listo!"
            : "Continuar"}
        </button>

      </form>

      {cropImageUrl && (
        <AvatarCropDialog
          open={cropDialogOpen}
          imageUrl={cropImageUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}