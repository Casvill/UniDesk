import { useEffect, useState } from "react";
import {
  Save,
  AlertTriangle,
  Shield,
  Bell,
  Video as VideoIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Pencil,
  Lock,
} from "lucide-react";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/shared/services/firebase";
import { showToast } from "@/shared/components/ui/toast";
import { api } from "@/services/api";

type ProfileForm = {
  displayName: string;
  username: string;
  email: string;
  photoURL: string;
  university: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

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

function getSettingsErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  switch (code) {
    case "backend/username-already-exists":
      return "Este nombre de usuario ya está en uso. Intenta con otro.";

    case "backend/email-already-exists":
      return "Este correo ya está registrado en otra cuenta. Intenta con otro.";

    case "backend/network-error":
      return "No pudimos conectar con el servidor. Verifica que el backend esté corriendo e inténtalo nuevamente.";

    case "backend/profile-update-failed":
    case "backend/request-failed":
      return "No pudimos guardar los cambios. Revisa la información e inténtalo nuevamente.";

    case "storage/unauthorized":
      return "No tienes permiso para subir imágenes. Revisa la configuración de Firebase Storage.";

    case "storage/canceled":
      return "La carga de la imagen fue cancelada.";

    case "storage/unknown":
      return "No pudimos subir la imagen. Inténtalo nuevamente.";

    case "auth/network-request-failed":
      return "No pudimos conectarnos con Firebase. Revisa tu conexión a internet.";

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
    return "Este nombre de usuario ya está en uso. Intenta con otro.";
  }

  if (message.includes("email") || message.includes("correo")) {
    return "Este correo ya está registrado en otra cuenta. Intenta con otro.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("err_connection_refused")
  ) {
    return "No pudimos conectar con el servidor. Verifica que el backend esté corriendo e inténtalo nuevamente.";
  }

  return "No pudimos guardar los cambios. Revisa la información e inténtalo nuevamente.";
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "UD";
}

async function uploadAvatarToStorage(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `avatar-${Date.now()}.${extension}`;
  const avatarRef = ref(storage, `avatars/${userId}/${fileName}`);

  await uploadBytes(avatarRef, file);

  return getDownloadURL(avatarRef);
}

export function Settings() {
  const { user, profile, updateProfileData } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    username: "",
    email: "",
    photoURL: "",
    university: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    roomInvites: true,
    sessionReminders: false,
  });

  const cleanDisplayName = form.displayName.trim();
  const cleanUsername = form.username.trim();
  const cleanEmail = form.email.trim();
  const cleanUniversity = form.university.trim();

  const currentUsername = profile?.username || "";
  const isUsernameUnchanged = cleanUsername === currentUsername;

  const isUsernameFormatValid =
    cleanUsername.length >= 3 && /^[a-zA-Z0-9_]+$/.test(cleanUsername);

  const isUsernameValid =
    isUsernameFormatValid &&
    !checkingUsername &&
    (isUsernameUnchanged || usernameAvailable === true);

  const currentEmail = profile?.email || "";
  const isEmailUnchanged = cleanEmail === currentEmail;

  const isGoogleUser = profile?.provider === "google.com";

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) &&
    (isGoogleUser || (!checkingEmail && (isEmailUnchanged || emailAvailable === true)));

  const isFormValid =
    cleanDisplayName.length > 0 &&
    isUsernameValid &&
    isEmailValid &&
    !loading;

  useEffect(() => {
    const currentPhotoURL = profile?.photoURL || user?.photoURL || "";

    setForm({
      displayName: profile?.displayName || user?.displayName || "",
      username: profile?.username || "",
      email: profile?.email || user?.email || "",
      photoURL: currentPhotoURL,
      university: profile?.university || "",
    });

    setAvatarPreview(currentPhotoURL);
    setUsernameAvailable(null);
  }, [profile, user]);

  useEffect(() => {
    if (!cleanUsername) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (isUsernameUnchanged) {
      setUsernameAvailable(true);
      setCheckingUsername(false);
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);

    const timer = setTimeout(async () => {
      try {
        const { api } = await import("@/services/api");
        const available = await api.checkUsername(cleanUsername);
        setUsernameAvailable(available);
      } catch (error) {
        console.warn("No se pudo validar el username:", error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cleanUsername, isUsernameUnchanged]);

  useEffect(() => {
    if (isGoogleUser) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    if (!cleanEmail) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    if (isEmailUnchanged) {
      setEmailAvailable(true);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);

    const timer = setTimeout(async () => {
      try {
        const available = await api.checkEmail(cleanEmail, user?.uid);
        setEmailAvailable(available);
      } catch (error) {
        console.warn("No se pudo validar el email:", error);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cleanEmail, isEmailUnchanged, isGoogleUser, user?.uid]);

  const getUsernameMessage = () => {
    if (!usernameTouched && !cleanUsername) return "";

    if (!cleanUsername) return "El nombre de usuario es obligatorio.";
    if (cleanUsername.length < 3) return "Mínimo 3 caracteres.";
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return "Solo puedes usar letras, números y guiones bajos.";
    }

    if (checkingUsername) return "Validando disponibilidad...";
    if (isUsernameUnchanged) return "Este es tu nombre de usuario actual.";
    if (usernameAvailable === true) return "Nombre de usuario disponible.";
    if (usernameAvailable === false) return "Este nombre de usuario ya está en uso.";

    return "";
  };

  const usernameMessage = getUsernameMessage();

  const isUsernameError =
    usernameTouched &&
    Boolean(usernameMessage) &&
    usernameMessage !== "Nombre de usuario disponible." &&
    usernameMessage !== "Validando disponibilidad..." &&
    usernameMessage !== "Este es tu nombre de usuario actual.";

  const showUsernameMessageAsError = usernameAvailable === false || isUsernameError;

  const getEmailMessage = () => {
    if (isGoogleUser) return "El correo de Google no se puede cambiar.";
    if (!emailTouched && !cleanEmail) return "";
    if (!cleanEmail) return "El correo es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return "Correo inválido.";
    if (checkingEmail) return "Validando correo...";
    if (isEmailUnchanged) return "Este es tu correo actual.";
    if (emailAvailable === true) return "Correo disponible.";
    if (emailAvailable === false) return "Este correo ya está registrado.";
    return "";
  };

  const emailMessage = getEmailMessage();

  const isEmailError =
    emailTouched &&
    Boolean(emailMessage) &&
    emailMessage !== "Correo disponible." &&
    emailMessage !== "Validando correo..." &&
    emailMessage !== "Este es tu correo actual.";

  const showEmailAsError = emailAvailable === false || isEmailError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name as keyof ProfileForm;

    setForm((prevForm) => ({
      ...prevForm,
      [fieldName]: e.target.value,
    }));

    setErrors((prevErrors) => {
      if (!prevErrors[fieldName]) return prevErrors;

      const updatedErrors = { ...prevErrors };
      delete updatedErrors[fieldName];
      return updatedErrors;
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Selecciona un archivo de imagen válido.");
      return;
    }

    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      showToast.error("La imagen es muy pesada. Usa una imagen de máximo 2 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedAvatarFile(file);
    setAvatarPreview(previewUrl);

    showToast.success("Imagen de perfil seleccionada correctamente. Recuerda guardar los cambios.");
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!cleanDisplayName) {
      newErrors.displayName = "El nombre es obligatorio.";
    }

    if (!cleanUsername) {
      newErrors.username = "El nombre de usuario es obligatorio.";
    } else if (cleanUsername.length < 3) {
      newErrors.username = "Mínimo 3 caracteres.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      newErrors.username = "Solo puedes usar letras, números y guiones bajos.";
    } else if (!isUsernameValid) {
      newErrors.username = "Debes usar un nombre de usuario válido y disponible.";
    }

    if (!cleanEmail) {
      newErrors.email = "El correo es obligatorio.";
    } else if (isGoogleUser) {
      newErrors.email = "El correo de Google no se puede cambiar.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = "Ingresa un correo válido.";
    } else if (checkingEmail) {
      newErrors.email = "Validando correo...";
    } else if (!isEmailUnchanged && emailAvailable === false) {
      newErrors.email = "Este correo ya está registrado.";
    }

    return newErrors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setUsernameTouched(true);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast.error("Revisa los campos marcados antes de guardar los cambios.");
      return;
    }

    if (!user) {
      showToast.error("No encontramos una sesión activa. Inicia sesión nuevamente.");
      return;
    }

    setLoading(true);

    const loadingKey = showToast.loading("Guardando los cambios de tu perfil. Por favor espera.");

    try {
      let finalPhotoURL = form.photoURL;

      if (selectedAvatarFile) {
        finalPhotoURL = await uploadAvatarToStorage(user.uid, selectedAvatarFile);
      }

      await updateFirebaseProfile(user, {
        displayName: cleanDisplayName,
        photoURL: finalPhotoURL || undefined,
      });

      await updateProfileData({
        username: cleanUsername,
        displayName: cleanDisplayName,
        email: cleanEmail,
        photoURL: finalPhotoURL,
        university: cleanUniversity,
      });

      setForm((prevForm) => ({
        ...prevForm,
        photoURL: finalPhotoURL,
      }));

      setAvatarPreview(finalPhotoURL);
      setSelectedAvatarFile(null);

      showToast.close(loadingKey);
      showToast.success("Tu perfil fue actualizado correctamente.");
    } catch (error: unknown) {
      console.error("Settings save error:", error);

      const message = getSettingsErrorMessage(error);

      if (message.includes("nombre de usuario")) {
        setUsernameAvailable(false);
        setUsernameTouched(true);
      }

      if (message.includes("correo")) {
        setEmailAvailable(false);
        setEmailTouched(true);
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: message,
        }));
      }

      showToast.close(loadingKey);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const avatarContent = avatarPreview ? (
    <img
      src={avatarPreview}
      alt="Vista previa del avatar"
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-white text-5xl font-bold">
      {getInitials(cleanDisplayName, cleanEmail)}
    </span>
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Configuración
        </h2>

        <p className="text-gray-600">
          Actualiza tus datos personales y mantén tu perfil listo para estudiar en equipo.
        </p>
      </div>

      <div className="max-w-[900px]">
        <form
          onSubmit={handleSave}
          className="space-y-6"
          aria-describedby="settings-status"
          noValidate
        >
          <section
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8"
            aria-labelledby="account-settings-heading"
          >
            <div className="mb-6">
              <h3 id="account-settings-heading" className="text-xl font-bold text-gray-900">
                Información de la cuenta
              </h3>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div
                  className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
                  aria-label="Vista previa del avatar"
                >
                  {avatarContent}
                </div>

                <label
                  htmlFor="settings-avatar"
                  className="absolute bottom-1 right-1 bg-indigo-600 text-white p-3 rounded-full cursor-pointer hover:bg-indigo-700 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition shadow-lg"
                  aria-label="Cambiar imagen de perfil"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </label>

                <input
                  id="settings-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Seleccionar imagen de perfil"
                  disabled={loading}
                />
              </div>

              <p className="text-sm text-gray-600 mt-3">
                Cambia tu imagen de perfil
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="display-name" className="block mb-2 text-sm font-semibold text-gray-700">
                  Nombre para mostrar
                </label>

                <input
                  type="text"
                  id="display-name"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Ej: Valentina Gómez"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  aria-invalid={Boolean(errors.displayName)}
                  aria-describedby={errors.displayName ? "display-name-error" : undefined}
                  autoComplete="name"
                  disabled={loading}
                />

                {errors.displayName && (
                  <p
                    id="display-name-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-xs mt-1"
                  >
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="settings-username" className="block mb-2 text-sm font-semibold text-gray-700">
                  Nombre de usuario
                </label>

                <input
                  type="text"
                  id="settings-username"
                  name="username"
                  value={form.username}
                  onChange={(e) => {
                    handleChange(e);
                    setUsernameAvailable(null);
                  }}
                  onBlur={() => setUsernameTouched(true)}
                  placeholder="Ej: estudiante_123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  aria-invalid={isUsernameError ? true : undefined}
                  aria-describedby={isUsernameError ? "settings-username-error" : undefined}
                  autoComplete="username"
                  disabled={loading}
                />

                {usernameMessage && (
                  <p
                    id={isUsernameError ? "settings-username-error" : undefined}
                    className={`mt-1 text-sm flex items-center gap-1 ${
                      showUsernameMessageAsError
                        ? "text-red-500"
                        : usernameAvailable === true
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {showUsernameMessageAsError ? (
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}

                    {usernameMessage}
                  </p>
                )}

                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {usernameTouched && usernameMessage}
                </div>
              </div>

              <div>
                <label htmlFor="settings-email" className="block mb-2 text-sm font-semibold text-gray-700">
                  Correo electrónico
                </label>

                <div className="relative">
                  <input
                    type="email"
                    id="settings-email"
                    name="email"
                    value={form.email}
                    onChange={(e) => {
                      handleChange(e);
                      setEmailAvailable(null);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="ejemplo@universidad.edu.co"
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      isGoogleUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : showEmailAsError ? "border-red-400" : ""
                    }`}
                    aria-invalid={isEmailError ? true : undefined}
                    aria-describedby={isEmailError ? "settings-email-error" : undefined}
                    autoComplete="email"
                    disabled={loading || isGoogleUser}
                    title={isGoogleUser ? "No puedes cambiar el correo de una cuenta de Google" : undefined}
                  />

                  {isGoogleUser && (
                    <Lock
                      className="absolute right-4 top-3.5 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {emailMessage ? (
                  <p
                    id={isEmailError ? "settings-email-error" : undefined}
                    className={`mt-1 text-sm flex items-center gap-1 ${
                      showEmailAsError
                        ? "text-red-500"
                        : emailAvailable === true || isEmailUnchanged
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {showEmailAsError ? (
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : emailAvailable === true || isEmailUnchanged ? (
                      <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}

                    {emailMessage}
                  </p>
                ) : (
                  <div className="grid grid-rows-[0fr] transition-all duration-300">
                    <div className="overflow-hidden" />
                  </div>
                )}

                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {emailTouched && emailMessage}
                </div>
              </div>

              <div>
                <label htmlFor="settings-university" className="block mb-2 text-sm font-semibold text-gray-700">
                  Universidad
                </label>

                <input
                  type="text"
                  id="settings-university"
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="Ej: Universidad Distrital"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  autoComplete="organization"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {/* <section
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8"
            aria-labelledby="notification-settings-heading"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-purple-600" aria-hidden="true" />
              </div>

              <h3 id="notification-settings-heading" className="text-xl font-bold text-gray-900">
                Preferencias de notificación
              </h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  id="email-notifications"
                  name="emailNotifications"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({ ...notifications, email: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />

                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block">
                    Notificaciones por correo
                  </span>

                  <span className="text-sm text-gray-600">
                    Recibe novedades importantes sobre tu actividad en UniDesk.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  id="room-invites"
                  name="roomInvites"
                  checked={notifications.roomInvites}
                  onChange={(e) =>
                    setNotifications({ ...notifications, roomInvites: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />

                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block">
                    Invitaciones a salas
                  </span>

                  <span className="text-sm text-gray-600">
                    Avísame cuando un compañero me invite a una sala de estudio.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  id="session-reminders"
                  name="sessionReminders"
                  checked={notifications.sessionReminders}
                  onChange={(e) =>
                    setNotifications({ ...notifications, sessionReminders: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />

                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block">
                    Recordatorios de sesiones
                  </span>

                  <span className="text-sm text-gray-600">
                    Recibe recordatorios antes de tus sesiones de estudio.
                  </span>
                </div>
              </label>
            </div>
          </section> */}

          {/* <section
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8"
            aria-labelledby="privacy-settings-heading"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>

              <h3 id="privacy-settings-heading" className="text-xl font-bold text-gray-900">
                Privacidad y permisos
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                <VideoIcon className="h-5 w-5 text-gray-500 mt-0.5" aria-hidden="true" />

                <div>
                  <p className="font-semibold text-gray-900">
                    Cámara, micrófono y pantalla
                  </p>

                  <p className="text-sm text-gray-600">
                    Estos permisos se solicitarán únicamente cuando entres a una sala y decidas activar audio, video o compartir pantalla.
                  </p>
                </div>
              </div>
            </div>
          </section> */}

          <section
            className="bg-white rounded-2xl shadow-md border border-red-100 p-6 sm:p-8"
            aria-labelledby="danger-zone-heading"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>

              <h3 id="danger-zone-heading" className="text-xl font-bold text-gray-900">
                Zona de cuidado
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Si decides eliminar tu cuenta, se perderá tu perfil y la información asociada a tu actividad.
            </p>

            <button
              type="button"
              className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition"
              disabled={loading}
            >
              Eliminar cuenta
            </button>
          </section>

          <div
            id="settings-status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {loading && "Guardando los cambios de tu perfil. Por favor espera."}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid}
              aria-busy={loading}
              aria-disabled={!isFormValid}
              aria-label={
                loading
                  ? "Guardando cambios, por favor espera"
                  : "Guardar cambios del perfil"
              }
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" aria-hidden="true" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}