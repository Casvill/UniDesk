import { useNavigate } from "react-router-dom";
import { User, Mail, Pencil, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export function GooglePage() {
  const navigate = useNavigate();
  const { user, status, completeProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/', { replace: true });
    } else if (status === 'authenticated') {
      navigate('/dashboard', { replace: true });
    } else if (user?.photoURL) {
      setAvatarPreview(user.photoURL);
    }
  }, [status, user, navigate]);

  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const available = await api.checkUsername(username);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const validate = useCallback(() => {
    if (!username.trim()) return "El nombre de usuario es obligatorio";
    if (username.length < 3) return "Mínimo 3 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Solo letras, números y guiones bajos";
    if (usernameAvailable === false) return "Este nombre de usuario ya está en uso";

    return "";
  }, [username, usernameAvailable]);

  const handleSubmit = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      await completeProfile({
        username,
        displayName: user?.displayName || 'Usuario de Google',
        photoURL: avatarPreview || user?.photoURL || ''
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('username') || message.toLowerCase().includes('ya existe')) {
        setError("Este nombre de usuario ya está en uso");
        setUsernameAvailable(false);
      } else {
        setError("Error al completar el registro");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setAvatarPreview(imageUrl);
  };

  if (status !== 'needs-profile' || !user) return null;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8"
      aria-label="Completar perfil de usuario con Google"
    >
      <main className="w-full max-w-[440px]">

        <section
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8"
          aria-label="Formulario de completado de perfil"
        >

          {/* HEADER */}
          <header className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Completa tu perfil
            </h1>

            <p className="text-gray-500 text-sm">
              Solo necesitamos algunos datos adicionales
            </p>
          </header>

          {/* AVATAR */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">

              <div
                className="w-24 h-24 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center"
                aria-label="Vista previa del avatar"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-400" aria-hidden="true" />
                )}
              </div>

              <label
                htmlFor="avatarInput"
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700"
                aria-label="Cambiar imagen de perfil"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </label>

              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Seleccionar imagen de avatar"
              />

            </div>
          </div>

          {/* FORM */}
          <div className="space-y-4">

            {/* FULL NAME */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Nombre completo
              </label>

              <input
                value={user.displayName || ''}
                disabled
                className="w-full pl-4 py-3 border rounded-lg bg-gray-100"
                aria-label="Nombre completo del usuario (no editable)"
              />
            </div>

            {/* USERNAME */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Nombre de usuario
              </label>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: estudiante_123"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                aria-invalid={!!error}
                aria-describedby={error ? "username-error" : undefined}
                autoComplete="username"
              />

              <div className="flex items-center gap-1 mt-1">
                {usernameAvailable === true && (
                  <span className="text-green-600 text-xs flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Disponible
                  </span>
                )}
                {usernameAvailable === false && (
                  <span className="text-red-500 text-xs flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    No disponible
                  </span>
                )}
              </div>

              {error && (
                <p
                  id="username-error"
                  role="alert"
                  aria-live="assertive"
                  className="text-red-500 text-sm mt-1"
                >
                  {error}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Correo institucional o personal
              </label>

              <input
                value={user.email || ''}
                disabled
                className="w-full pl-4 py-3 border rounded-lg bg-gray-100"
                aria-label="Correo del usuario (no editable)"
              />
            </div>

            {/* STATUS ANNOUNCER */}
            <div aria-live="polite" className="sr-only">
              {loading && "Creando cuenta en proceso"}
              {success && "Cuenta creada exitosamente"}
            </div>

            {/* BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              aria-busy={loading}
              aria-label="Finalizar registro de usuario"
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition
                ${
                  success
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
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

          </div>
        </section>
      </main>
    </div>
  );
}