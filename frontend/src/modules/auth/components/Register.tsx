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

    if (!form.fullName.trim()) newErrors.fullName = "El nombre completo es obligatorio";
    if (!form.username.trim()) newErrors.username = "El nombre de usuario es obligatorio";
    if (form.username.length < 3) newErrors.username = "Mínimo 3 caracteres";

    if (!form.email.trim()) newErrors.email = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Correo inválido";

    if (!form.password) newErrors.password = "La contraseña es obligatoria";
    else if (form.password.length < 8) newErrors.password = "Mínimo 8 caracteres";

    if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await register(
        form.email,
        form.password,
        form.fullName,
        form.username
      );

      toast.success("Cuenta creada exitosamente");
      navigate("/dashboard");

    } catch (error) {
      toast.error("Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      toast.success("Cuenta creada con Google");

      navigate("/dashboard");
    } catch {
      toast.error("Error con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">

      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <div className="text-center mb-8">
            <img src={logo} className="h-20 w-auto mb-3" />
            <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
            <p className="text-gray-600">Únete a UniDesk</p>
          </div>

          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* AVATAR */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>

                  <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </label>

                  <input
                    type="file"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* FULL NAME */}
              <div>
                <label className="text-sm font-semibold">Nombre completo</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                {errors.fullName && <p className="text-red-600 text-xs">{errors.fullName}</p>}
              </div>

              {/* USERNAME */}
              <div>
                <label className="text-sm font-semibold">Usuario</label>
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
                <label className="text-sm font-semibold">
                  Correo institucional o personal
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ejemplo@universidad.edu.co"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                {errors.email && <p className="text-red-600 text-xs">{errors.email}</p>}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-semibold">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                {errors.password && <p className="text-red-600 text-xs">{errors.password}</p>}
              </div>

              {/* CONFIRM */}
              <div>
                <label className="text-sm font-semibold">Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs">{errors.confirmPassword}</p>
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg flex justify-center gap-2"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {loading ? "Creando..." : "Crear cuenta"}
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full border py-3 rounded-lg flex justify-center gap-2"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
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