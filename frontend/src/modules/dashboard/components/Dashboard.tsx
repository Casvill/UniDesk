import { useNavigate } from "react-router-dom";
import { Plus, Users, Book, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const activeRooms = [
    {
      id: "1",
      name: "Calculus Study Group",
      participants: 4,
      subject: "Mathematics",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "2",
      name: "CS Finals Prep",
      participants: 8,
      subject: "Computer Science",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "3",
      name: "Biology Lab Review",
      participants: 3,
      subject: "Biology",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const upcomingSessions = [
    {
      id: "1",
      name: "Chemistry Study Session",
      time: "Today, 3:00 PM",
      participants: 5,
    },
    {
      id: "2",
      name: "History Exam Prep",
      time: "Tomorrow, 10:00 AM",
      participants: 6,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : "Student"}
        </h2>
        <p className="text-gray-600 mb-6">
          Ready to start a productive study session?
        </p>
        <button
          onClick={() => navigate("/rooms/create")}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create New Room
        </button>
      </div>

      <section className="mb-8" aria-labelledby="active-rooms-heading">
        <h2
          id="active-rooms-heading"
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Active Study Rooms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRooms.map((room) => (
            <article
              key={room.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-r ${room.color}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Book className="h-4 w-4" />
                      <span>{room.subject}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Users className="h-4 w-4" />
                  <span>{room.participants} participants online</span>
                </div>
                <button
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-lg font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  Join Room
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
          Upcoming Sessions
        </h2>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {upcomingSessions.map((session, index) => (
            <div
              key={session.id}
              className={`p-6 hover:bg-gray-50 transition ${
                index < upcomingSessions.length - 1
                  ? "border-b border-gray-200"
                  : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {session.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{session.participants} participants</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/rooms/${session.id}`)}
                  className="w-full sm:w-auto bg-indigo-600 text-white py-2.5 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-md hover:shadow-lg"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}