import { useNavigate } from "react-router-dom";
import { Clock, TrendingUp, Award, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function UserProfile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const joinedDate = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : "Recientemente";

  const userStats = {
    totalSessions: 0, // Esto vendrá de otros endpoints en el futuro
    totalHours: 0,
    averageSessionLength: 0,
    joinedDate: joinedDate,
  };

  const recentSessions: any[] = [];

  const displayName = profile?.displayName || user?.displayName || "Estudiante";
  const userEmail = profile?.email || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Perfil de Usuario</h2>
        <p className="text-gray-600">Ver tus estadísticas de estudio y actividad reciente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-5xl font-bold">{initial}</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{displayName}</h3>
            {profile?.username && <p className="text-indigo-600 font-semibold mb-2">@{profile.username}</p>}
            <p className="text-gray-600 mb-6 truncate">{userEmail}</p>
            <button
              onClick={() => navigate("/settings")}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl"
            >
              Editar Perfil
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section aria-labelledby="study-stats-heading">
            <h3 id="study-stats-heading" className="text-2xl font-bold text-gray-900 mb-4">
              Study Statistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Total Sessions</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">{userStats.totalSessions}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Total Hours</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">{userStats.totalHours}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Avg Session</p>
                </div>
                <p className="text-4xl font-bold text-gray-900">
                  {userStats.averageSessionLength} <span className="text-xl text-gray-600">hrs</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Member Since</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{userStats.joinedDate}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="recent-sessions-heading">
            <h3 id="recent-sessions-heading" className="text-2xl font-bold text-gray-900 mb-4">
              Actividad Reciente
            </h3>
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className={`p-6 hover:bg-gray-50 transition ${
                      index < recentSessions.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{session.room}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{session.subject}</span>
                          <span>•</span>
                          <span>{session.date}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-indigo-600">{session.duration}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No hay actividad reciente para mostrar.
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="achievements-heading">
            <h3 id="achievements-heading" className="text-2xl font-bold text-gray-900 mb-4">
              Achievements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <p className="font-semibold text-gray-900">First Session</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <p className="font-semibold text-gray-900">10 Hours</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <p className="font-semibold text-gray-900">100 Hours</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
