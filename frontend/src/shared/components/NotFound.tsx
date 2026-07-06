import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

function IconHome({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function IconLogIn({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

function IconSearch({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <main className="max-w-[600px] text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl mb-6 shadow-2xl" aria-hidden="true">
            <span className="text-white text-5xl font-bold">?</span>
          </div>
          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 mb-4">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Página no encontrada</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            La página que buscas no existe o fue movida a otra ubicación.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <IconSearch className="h-5 w-5" />
            <p className="font-semibold">¿Buscabas algo?</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <IconHome className="h-5 w-5" />
              Ir al dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full bg-white border border-gray-300 px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition flex items-center justify-center gap-2"
            >
              <LogIn className="h-5 w-5" aria-hidden="true" />
              Ir a iniciar sesión
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta al soporte de la plataforma.</p>
        </div>
      </main>
    </div>
  );
}
