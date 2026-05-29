import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Chrome, Pencil, Loader2 } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio";
    }

    if (!form.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio";
    } else if (form.username.length < 3) {
      newErrors.username = "El usuario debe tener al menos 3 caracteres";
    }

    if (!form.email.trim()) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Ingresa un correo válido";
    }

    if (!form.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (form.password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, form.username);
      toast.success("Cuenta creada exitosamente");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };  

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success("¡Bienvenido!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error("Error al autenticar con Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setAvatarPreview(imageUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="UniDesk, plataforma de estudio colaborativo"
              className="h-20 w-auto inline-flex mb-3 mt-2"
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Crea tu cuenta
            </h1>

            <p className="text-gray-600">
              Únete a tu sala de estudio colaborativo en tiempo real
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* AVATAR */}
              <div className="flex flex-col items-center mb-6">

                <div className="relative">

                  <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>

                  <label
                    htmlFor="avatar"
                    className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Subir imagen de perfil"
                  >
                    <Pencil className="h-4 w-4" />
                  </label>

                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Foto de perfil (opcional)
                </p>
              </div>

              {/* NOMBRE COMPLETO */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Nombre completo
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    minLength={3}
                    placeholder="Ej: Juan Pérez"
                    aria-invalid={!!errors.fullName}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading || googleLoading}
                  />
                </div>

                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* USERNAME */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Nombre de usuario
                </label>

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                  title="Solo letras, números y guiones bajos"
                  placeholder="Ej: estudiante_123"
                  aria-invalid={!!errors.username}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading || googleLoading}
                />

                {errors.username && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Correo institucional o personal
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="ejemplo@universidad.edu.co"
                    aria-invalid={!!errors.email}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading || googleLoading}
                  />
                </div>

                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email}
                  </p>
                )}
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
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    aria-invalid={!!errors.password}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading || googleLoading}
                  />
                </div>

                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Confirmar contraseña
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Repite tu contraseña"
                    aria-invalid={!!errors.confirmPassword}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading || googleLoading}
                  />
                </div>

                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta"}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Chrome className="h-5 w-5" />
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
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Iniciar sesión
                </button>
              </p>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}