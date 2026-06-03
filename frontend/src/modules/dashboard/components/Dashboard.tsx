import { useNavigate } from "react-router-dom";
import { Plus, Users, Book, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const activeRooms = [
    {
      id: "1",
      name: "Grupo de estudio de Cálculo",
      participants: 4,
      subject: "Matemáticas",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "2",
      name: "Preparación para finales de Programación",
      participants: 8,
      subject: "Ciencias de la Computación",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "3",
      name: "Repaso de laboratorio de Biología",
      participants: 3,
      subject: "Biología",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const upcomingSessions = [
    {
      id: "1",
      name: "Sesión de estudio de Química",
      time: "Hoy, 3:00 p. m.",
      participants: 5,
    },
    {
      id: "2",
      name: "Repaso para examen de Historia",
      time: "Mañana, 10:00 a. m.",
      participants: 6,
    },
  ];

  const username = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
    : "estudiante";

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          ¡Qué bueno verte de nuevo, {username}!
        </h2>

        <p className="text-gray-600 mb-6">
          Organiza tus salas, únete a tus compañeros y continúa estudiando en equipo.
        </p>

        <button
          onClick={() => navigate("/rooms/create")}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          aria-label="Crear una nueva sala de estudio"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Crear nueva sala
        </button>
      </div>

      <section className="mb-8" aria-labelledby="active-rooms-heading">
        <h2
          id="active-rooms-heading"
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Salas de estudio activas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRooms.map((room) => (
            <article
              key={room.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden group"
              aria-label={`Sala de estudio ${room.name}`}
            >
              <div className={`h-2 bg-gradient-to-r ${room.color}`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
                      {room.name}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Book className="h-4 w-4" aria-hidden="true" />
                      <span>{room.subject}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {room.participants} participantes en línea
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-lg font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  aria-label={`Unirse a la sala ${room.name}`}
                >
                  Unirse a la sala
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="upcoming-sessions-heading">
        <h2
          id="upcoming-sessions-heading"
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Próximas sesiones
        </h2>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {upcomingSessions.map((session, index) => (
            <article
              key={session.id}
              className={`p-6 hover:bg-gray-50 transition ${
                index < upcomingSessions.length - 1
                  ? "border-b border-gray-200"
                  : ""
              }`}
              aria-label={`Sesión programada ${session.name}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {session.name}
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>{session.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {session.participants} participantes
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/rooms/${session.id}`)}
                  className="w-full sm:w-auto bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-lg font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  aria-label={`Entrar a la sesión ${session.name}`}
                >
                  Entrar a la sesión
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}