import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Chrome, Pencil } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";
import { useState } from "react";

type RegisterProps = {
  onSubmit: (data: any) => Promise<void> | void;
};

export function Register({ onSubmit }: RegisterProps) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // estados nuevos
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

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

    setGlobalError(null);
    setSuccess(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);

      await onSubmit(form);

      setSuccess("Cuenta creada correctamente. Redirigiendo...");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      setGlobalError("No se pudo crear la cuenta. Intenta nuevamente.");
    } finally {
      setLoading(false);
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

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setGlobalError(null);

      // simulación login google
      await new Promise((r) => setTimeout(r, 800));

      navigate("/google-profile", {
        state: {
          uid: "123",
          fullName: "Juan Perez",
          email: "juan.perez@correoinstitucional.edu.co",
          photoURL: "https://i.pravatar.cc/200",
        },
      });

    } catch {
      setGlobalError("Error iniciando sesión con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <div className="text-center mb-8">
            <img src={logo} className="h-20 w-auto inline-flex mb-3 mt-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Crea tu cuenta
            </h1>
            <p className="text-gray-600">
              Únete a tu sala de estudio colaborativo en tiempo real
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

            {/* GLOBAL FEEDBACK */}
            <div aria-live="polite">
              {globalError && (
                <p className="text-red-600 text-sm mb-3">{globalError}</p>
              )}
              {success && (
                <p className="text-green-600 text-sm mb-3">{success}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* AVATAR */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>

                  <label
                    htmlFor="avatar"
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer"
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

              {/* FULLNAME */}
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
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>

                {errors.fullName && <p className="text-red-600 text-xs">{errors.fullName}</p>}
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
                  placeholder="Ej: estudiante_123"
                  className="w-full px-4 py-3 border rounded-lg"
                />

                {errors.username && <p className="text-red-600 text-xs">{errors.username}</p>}
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
                    placeholder="ejemplo@universidad.edu.co"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>

                {errors.email && <p className="text-red-600 text-xs">{errors.email}</p>}
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
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>

                {errors.password && <p className="text-red-600 text-xs">{errors.password}</p>}
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
                    placeholder="Repite tu contraseña"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>

                {errors.confirmPassword && <p className="text-red-600 text-xs">{errors.confirmPassword}</p>}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Chrome className="h-5 w-5" />
                {googleLoading ? "Cargando..." : "Continuar con Google"}
              </button>

              {/* LOGIN */}
              <p className="text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-indigo-600 font-semibold"
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