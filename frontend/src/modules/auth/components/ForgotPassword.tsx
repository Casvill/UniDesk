import { useState } from "react";
import { useCardTransition } from "@/context/CardTransitionContext";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAutoTour } from "@/hooks/useAutoTour";

interface ForgotPasswordProps {
  onSubmit: () => Promise<void> | void;
}

export function Forgot({ onSubmit }: ForgotPasswordProps) {
  const { navigateWithTransition } = useCardTransition();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const tourStep = useAutoTour();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await onSubmit();
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div ref={tourStep(0)} className="text-center mb-6 outline-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          Recuperar contraseña
        </h1>
        <p className="text-muted-foreground">
          Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones.
        </p>
      </div>

      <div
        ref={tourStep(1)}
        tabIndex={-1}
        className="sr-only outline-none"
      >
        Estás en la pantalla de recuperación de contraseña de UniDesk. El formulario contiene, en orden de tabulación: Primero, un campo obligatorio para ingresar tu Correo Electrónico. Segundo, el botón Enviar enlace de recuperación. Y por último, un botón para volver al inicio de sesión.
      </div>

      {/* ANNOUNCER GLOBAL (CLAVE PARA VOICEOVER) */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading && "Enviando enlace de recuperación de contraseña"}
        {submitted &&
          "Enlace enviado correctamente. Revisa tu correo electrónico."}
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* EMAIL */}
          <div>
            <label
              htmlFor="reset-email"
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              Correo institucional
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </div>

              <input
                type="email"
                id="reset-email"
                name="email"
                required
                aria-required="true"
                autoComplete="email"
                placeholder="ejemplo@universidad.edu.co"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition placeholder-gray-500"
              />
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Enviar enlace de recuperación
          </button>

          {/* BACK */}
          <button
            type="button"
            onClick={() => navigateWithTransition("/")}
            aria-label="Volver al inicio de sesión"
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 rounded py-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio de sesión
          </button>

        </form>
      ) : (
        <div
          className="space-y-6"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >

          {/* SUCCESS MESSAGE */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex gap-4">

              <CheckCircle
                className="h-6 w-6 text-green-600"
                aria-hidden="true"
              />

              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Enlace enviado correctamente
                </h3>

                <p className="text-sm text-green-700">
                  Si la dirección de correo ingresada está asociada a una cuenta, recibirás un mensaje con instrucciones para restablecer tu contraseña.
                </p>
              </div>

            </div>
          </div>

          {/* BACK BUTTON */}
          <button
            type="button"
            onClick={() => navigateWithTransition("/")}
            aria-label="Volver al inicio de sesión"
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 rounded py-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio de sesión
          </button>

          <p className="text-center text-sm text-gray-600">
            ¿No recibiste el correo?{" "}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
            >
              Intentar nuevamente
            </button>
          </p>

        </div>
      )}
    </>
  );
}