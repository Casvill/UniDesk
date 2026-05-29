import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

interface ForgotPasswordProps {
  onSubmit: () => void;
}

export function Forgot({ onSubmit }: ForgotPasswordProps) {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitted(true);

    onSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-[1280px]">
        <div className="max-w-[440px] mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">S</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Recuperar contraseña
            </h1>

            <p className="text-gray-600">
              {!submitted
                ? "Ingresa tu correo institucional y te enviaremos instrucciones para recuperar el acceso a tu cuenta."
                : "Revisa tu correo electrónico para continuar con la recuperación de tu cuenta."}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block mb-2 text-sm font-semibold text-gray-700"
                  >
                    Correo institucional o personal
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>

                    <input
                      type="email"
                      id="reset-email"
                      name="email"
                      required
                      aria-required="true"
                      placeholder="ejemplo@universidad.edu.co"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl"
                >
                  Enviar enlace de recuperación
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </button>
              </form>
            ) : (
              <div className="space-y-6" role="status" aria-live="polite">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">
                        Enlace enviado correctamente
                      </h3>

                      <p className="text-sm text-green-700">
                        Hemos enviado un enlace de recuperación a tu correo
                        electrónico. Sigue las instrucciones para restablecer tu
                        contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl"
                >
                  Volver al inicio de sesión
                </button>

                <p className="text-center text-sm text-gray-600">
                  ¿No recibiste el correo?{" "}
                  <button
                    onClick={() => setSubmitted(false)}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                  >
                    Intentar nuevamente
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}