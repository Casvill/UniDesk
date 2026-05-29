import { useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Pencil, Loader2, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

type GoogleState = {
  uid: string;
  fullName: string;
  email: string;
  photoURL: string;
};

export function GooglePage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: GoogleState | null };

  const [username, setUsername] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const user = state;

  useEffect(() => {
    if (!user) {
      navigate("/register");
    } else {
      setAvatarPreview(user.photoURL);
    }
  }, [user, navigate]);

  const validate = () => {
    if (!username.trim()) return "El nombre de usuario es obligatorio";
    if (username.length < 3) return "Mínimo 3 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Solo letras, números y guiones bajos";

    return "";
  };

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
      // Simulación backend
      await new Promise((res) => setTimeout(res, 1500));

      console.log({
        uid: user?.uid,
        fullName: user?.fullName,
        email: user?.email,
        photoURL: avatarPreview,
        username,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      setError("Error al completar el registro");
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">

      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Completa tu perfil
          </h1>
          <p className="text-gray-500 text-sm">
            Solo necesitamos algunos datos adicionales
          </p>
        </div>

        {/* AVATAR */}
        <div className="flex flex-col items-center mb-6">

          <div className="relative">

            <div className="w-24 h-24 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>

            {/* BOTÓN LÁPIZ */}
            <label
              htmlFor="avatarInput"
              className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700"
              aria-label="Cambiar avatar"
            >
              <Pencil className="h-4 w-4" />
            </label>

            {/* INPUT FILE */}
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

          </div>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          {/* NOMBRE */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Nombre completo
            </label>

            <div className="relative mt-1">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

              <input
                value={user.fullName}
                disabled
                className="w-full pl-10 py-3 border rounded-lg bg-gray-100"
              />
            </div>
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
            />

            {error && (
              <p className="text-red-500 text-sm mt-1">
                {error}
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Correo institucional o personal
            </label>

            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

              <input
                value={user.email}
                disabled
                className="w-full pl-10 py-3 border rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* BOTÓN */}
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition
              ${success
                ? "bg-green-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {success && <CheckCircle className="h-5 w-5" />}
            {loading
              ? "Creando cuenta..."
              : success
              ? "¡Listo!"
              : "Continuar"}
          </button>

        </div>
      </div>
    </div>
  );
}