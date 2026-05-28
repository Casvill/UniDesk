import { useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome } from "lucide-react";
import logo from "@/assets/logo/unified-logo-light.svg";

type LoginProps = {
  onSubmit?: (e: React.FormEvent) => void;
};

export function Login({ onSubmit }: LoginProps) {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(e);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">

          {/* HEADER */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="UniDesk, plataforma de salas de estudio colaborativo"
              className="h-20 w-auto inline-flex mb-3 mt-2"
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Bienvenido a UniDesk
            </h1>

            <p className="text-gray-600">
              Inicia sesión para entrar a tus salas de estudio en tiempo real
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Correo institucional o personal
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" aria-hidden="true" />

                  <input
                    type="email"
                    required
                    placeholder="ejemplo@universidad.edu.co"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Contraseña
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" aria-hidden="true" />

                  <input
                    type="password"
                    required
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Usa tu contraseña para acceder a tus salas de estudio
                </p>
              </div>

              {/* OPTIONS */}
              <div className="flex items-center justify-between text-sm">

                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                  />
                  Recordar mi sesión
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-indigo-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold"
              >
                Iniciar Sesión
              </button>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Chrome className="h-5 w-5" />
                Continuar con Google
              </button>

              {/* REGISTER */}
              <p className="text-center text-sm">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-indigo-600 font-semibold"
                >
                  Crear cuenta
                </button>
              </p>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}