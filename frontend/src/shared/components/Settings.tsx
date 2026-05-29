import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Save, AlertTriangle, Shield, Bell, Video as VideoIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function Settings() {
  const navigate = useNavigate();
  const { user, profile, updateBackendProfile, deleteAccount, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    username: profile?.username || "",
  });

  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    roomInvites: true,
    sessionReminders: false,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBackendProfile(formData);
      toast.success("Perfil actualizado con éxito");
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDeleteAccount = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      try {
        await deleteAccount();
        toast.success("Cuenta eliminada permanentemente");
        navigate("/");
      } catch (error) {
        toast.error("No se pudo eliminar la cuenta");
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Configuración</h2>
        <p className="text-gray-600">Gestiona las preferencias y ajustes de tu cuenta</p>
      </div>

      <div className="max-w-[900px]">
        <form onSubmit={handleSave} className="space-y-6">
            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="account-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 id="account-settings-heading" className="text-xl font-bold text-gray-900">
                  Ajustes de la Cuenta
                </h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="display-name" className="block mb-2 text-sm font-semibold text-gray-700">
                    Nombre a Mostrar
                  </label>
                  <input
                    type="text"
                    id="display-name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block mb-2 text-sm font-semibold text-gray-700">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="settings-email" className="block mb-2 text-sm font-semibold text-gray-700">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="settings-email"
                    name="email"
                    value={user?.email || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">El correo no puede ser modificado por ahora.</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="notification-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <h3 id="notification-settings-heading" className="text-xl font-bold text-gray-900">
                  Preferencias de Notificación
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
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Notificaciones por Email</span>
                    <span className="text-sm text-gray-600">Recibe actualizaciones por correo</span>
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
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Invitaciones a Salas</span>
                    <span className="text-sm text-gray-600">Recibe avisos cuando te inviten a una sala</span>
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
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Recordatorios de Sesión</span>
                    <span className="text-sm text-gray-600">Avisos antes de las sesiones programadas</span>
                  </div>
                </label>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto bg-white border border-gray-300 px-8 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
              >
                Cancelar
              </button>
            </div>
          </form>

          <div className="mt-8 bg-red-50 rounded-2xl border-2 border-red-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">Zona de Peligro</h3>
                <p className="text-red-700 mb-4">
                  Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate bien.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition shadow-md hover:shadow-lg"
                >
                  Eliminar Cuenta
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
