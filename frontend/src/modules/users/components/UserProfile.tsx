import { useNavigate } from "react-router-dom";
import { Clock, TrendingUp, Award, Calendar, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "UD";
}

function formatJoinedDate(date?: string) {
  if (!date) return "Fecha no disponible";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

export function UserProfile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    "Estudiante UniDesk";

  const email =
    user?.email ||
    "Correo no disponible";

  const username =
    profile?.username
      ? `@${profile.username}`
      : "Nombre de usuario pendiente";

  const photoURL =
    profile?.photoURL ||
    user?.photoURL ||
    "";

  const initials = getInitials(displayName, email);

  const userStats = {
    totalSessions: 0,
    totalHours: 0,
    averageSessionLength: 0,
    joinedDate: formatJoinedDate(user?.metadata?.creationTime),
  };

  const recentSessions: {
    id: string;
    room: string;
    date: string;
    duration: string;
    subject: string;
  }[] = [];

  const achievements = [
    {
      id: "first-session",
      title: "Primera sesión",
      status: userStats.totalSessions >= 1 ? "Completado" : "Por desbloquear",
      unlocked: userStats.totalSessions >= 1,
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "ten-hours",
      title: "10 horas de estudio",
      status: userStats.totalHours >= 10 ? "Completado" : "Por desbloquear",
      unlocked: userStats.totalHours >= 10,
      color: "from-blue-400 to-cyan-500",
    },
    {
      id: "hundred-hours",
      title: "100 horas de estudio",
      status: userStats.totalHours >= 100 ? "Completado" : "Por desbloquear",
      unlocked: userStats.totalHours >= 100,
      color: "from-purple-400 to-pink-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Mi perfil
        </h2>

        <p className="text-gray-600">
          Consulta tu información, tus estadísticas de estudio y tu actividad reciente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl overflow-hidden">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Foto de perfil del usuario"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-5xl font-bold">
                  {initials}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {displayName}
            </h3>

            <p className="text-gray-600 mb-1">
              {email}
            </p>

            <p className="text-gray-500 text-sm mb-6">
              {username}
            </p>

            <button
              onClick={() => navigate("/my-profile")}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition shadow-lg hover:shadow-xl"
            >
              Editar perfil
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section aria-labelledby="study-stats-heading">
            <h3 id="study-stats-heading" className="text-2xl font-bold text-gray-900 mb-4">
              Estadísticas de estudio
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>

                  <p className="text-sm font-semibold text-gray-600">
                    Sesiones realizadas
                  </p>
                </div>

                <p className="text-4xl font-bold text-gray-900">
                  {userStats.totalSessions}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  </div>

                  <p className="text-sm font-semibold text-gray-600">
                    Horas acumuladas
                  </p>
                </div>

                <p className="text-4xl font-bold text-gray-900">
                  {userStats.totalHours}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>

                  <p className="text-sm font-semibold text-gray-600">
                    Promedio por sesión
                  </p>
                </div>

                <p className="text-4xl font-bold text-gray-900">
                  {userStats.averageSessionLength}{" "}
                  <span className="text-xl text-gray-600">
                    h
                  </span>
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" aria-hidden="true" />
                  </div>

                  <p className="text-sm font-semibold text-gray-600">
                    Miembro desde
                  </p>
                </div>

                <p className="text-lg font-bold text-gray-900 capitalize">
                  {userStats.joinedDate}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="recent-sessions-heading">
            <h3 id="recent-sessions-heading" className="text-2xl font-bold text-gray-900 mb-4">
              Sesiones recientes
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
                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                          {session.room}
                        </h4>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{session.subject}</span>
                          <span aria-hidden="true">•</span>
                          <span>{session.date}</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-indigo-600">
                          {session.duration}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-primary-600">{session.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <UserIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" aria-hidden="true" />

                  <p className="font-semibold text-gray-900">
                    Aún no tienes sesiones recientes
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    Cuando participes en una sala de estudio, tu actividad aparecerá aquí.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="achievements-heading">
            <h3 id="achievements-heading" className="text-2xl font-bold text-gray-900 mb-4">
              Logros
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition ${
                    achievement.unlocked ? "" : "opacity-70"
                  }`}
                >
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${achievement.color} rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg`}
                  >
                    <Award className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>

                  <p className="font-semibold text-gray-900">
                    {achievement.title}
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    {achievement.status}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}