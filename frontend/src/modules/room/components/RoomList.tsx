import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Book, Search, Filter } from "lucide-react";

export function RoomList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const rooms = [
    { id: "1", name: "Calculus Study Group", subject: "Mathematics", participants: 4, capacity: 10, status: "active", color: "from-blue-500 to-cyan-500" },
    { id: "2", name: "CS Finals Prep", subject: "Computer Science", participants: 8, capacity: 12, status: "active", color: "from-purple-500 to-pink-500" },
    { id: "3", name: "Biology Lab Review", subject: "Biology", participants: 3, capacity: 6, status: "active", color: "from-green-500 to-emerald-500" },
    { id: "4", name: "Physics Problem Set", subject: "Physics", participants: 5, capacity: 8, status: "active", color: "from-orange-500 to-red-500" },
    { id: "5", name: "Essay Writing Workshop", subject: "English", participants: 2, capacity: 8, status: "active", color: "from-teal-500 to-cyan-500" },
    { id: "6", name: "Organic Chemistry", subject: "Chemistry", participants: 6, capacity: 10, status: "active", color: "from-yellow-500 to-orange-500" },
  ];

  const subjects = ["all", "Mathematics", "Computer Science", "Biology", "Physics", "English", "Chemistry"];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || room.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Study Rooms</h2>
        <p className="text-gray-600 mb-6">Find the perfect study group for your needs</p>
        <button
          onClick={() => navigate("/rooms/create")}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create New Room
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Search & Filter</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block mb-2 text-sm font-semibold text-gray-700">
              Search Rooms
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter room name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject-filter" className="block mb-2 text-sm font-semibold text-gray-700">
              Filter by Subject
            </label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === "all" ? "All Subjects" : subject}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section aria-labelledby="available-rooms-heading">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 id="available-rooms-heading" className="text-2xl font-bold text-gray-900">
            Available Rooms
          </h2>
          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            {filteredRooms.length} {filteredRooms.length === 1 ? "room" : "rooms"}
          </span>
        </div>
        <div className="space-y-4">
          {filteredRooms.map((room) => (
            <article
              key={room.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden group"
            >
              <div className={`h-1.5 bg-gradient-to-r ${room.color}`}></div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                      {room.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Book className="h-4 w-4" />
                        <span className="font-medium">{room.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>
                          {room.participants}/{room.capacity} participants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600 capitalize">{room.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/rooms/join/${room.id}`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-md hover:shadow-lg"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filteredRooms.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">No rooms found</p>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
