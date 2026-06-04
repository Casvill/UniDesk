import { useNavigate } from "react-router-dom";
import { Plus, MessageSquare, Video, Monitor, Lock } from "lucide-react";

export function CreateRoom() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/rooms/1");
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create New Study Room</h2>
        <p className="text-gray-600">Set up your study space and invite others to join</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
        <div>
          <label htmlFor="room-name" className="block mb-2 text-sm font-semibold text-gray-700">
            Room Name
          </label>
          <input
            type="text"
            id="room-name"
            name="roomName"
            required
            aria-required="true"
            placeholder="e.g., Calculus Study Group"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block mb-2 text-sm font-semibold text-gray-700">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            aria-required="true"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          >
            <option value="">Select a subject</option>
            <option value="mathematics">Mathematics</option>
            <option value="computer-science">Computer Science</option>
            <option value="biology">Biology</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="english">English</option>
            <option value="history">History</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block mb-2 text-sm font-semibold text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Brief description of what you'll be studying..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
          />
        </div>

        <div>
          <label htmlFor="capacity" className="block mb-2 text-sm font-semibold text-gray-700">
            Maximum Participants
          </label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            min="2"
            max="20"
            defaultValue="10"
            required
            aria-required="true"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Room Features</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id="enable-chat"
                name="enableChat"
                defaultChecked
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2 flex-1">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                    Enable Text Chat
                  </span>
                  <p className="text-sm text-gray-600">Allow participants to send messages</p>
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id="enable-video"
                name="enableVideo"
                defaultChecked
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2 flex-1">
                <Video className="h-5 w-5 text-primary-600" />
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                    Enable Video/Audio
                  </span>
                  <p className="text-sm text-gray-600">Support video and audio calls</p>
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id="enable-screen-share"
                name="enableScreenShare"
                defaultChecked
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2 flex-1">
                <Monitor className="h-5 w-5 text-primary-600" />
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                    Enable Screen Sharing
                  </span>
                  <p className="text-sm text-gray-600">Allow screen sharing for presentations</p>
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id="private-room"
                name="privateRoom"
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2 flex-1">
                <Lock className="h-5 w-5 text-primary-600" />
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                    Private Room (Invite Only)
                  </span>
                  <p className="text-sm text-gray-600">Require invitation to join</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            className="w-full sm:flex-1 bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Room
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:flex-1 bg-white border border-gray-300 px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
