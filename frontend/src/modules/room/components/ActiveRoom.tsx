import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Settings as SettingsIcon,
  LogOut,
  Send,
  Users,
  MoreVertical,
} from "lucide-react";

export function ActiveRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [message, setMessage] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const participants = [
    { id: "1", name: "Sarah Johnson", isSpeaking: false, initials: "SJ", color: "from-blue-500 to-cyan-500" },
    { id: "2", name: "Mike Chen", isSpeaking: true, initials: "MC", color: "from-purple-500 to-pink-500" },
    { id: "3", name: "Emma Davis", isSpeaking: false, initials: "ED", color: "from-green-500 to-emerald-500" },
    { id: "4", name: "You", isSpeaking: false, initials: "YO", color: "from-primary-500 to-purple-500" },
  ];

  const chatMessages = [
    { id: "1", sender: "Sarah Johnson", message: "Hey everyone! Ready to start?", time: "2:30 PM", initials: "SJ" },
    { id: "2", sender: "Mike Chen", message: "Yes! Let's begin with problem 3", time: "2:31 PM", initials: "MC" },
    { id: "3", sender: "Emma Davis", message: "Sounds good to me", time: "2:31 PM", initials: "ED" },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessage("");
    }
  };

  const handleLeaveRoom = () => {
    if (confirm("Are you sure you want to leave this study room?")) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 flex-shrink-0 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Calculus Study Group</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-400">Room ID: {roomId}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>{participants.length} participants</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="w-full sm:w-auto bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            aria-label="Leave room"
          >
            <LogOut className="h-4 w-4" />
            Leave Room
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6" aria-label="Video area">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`bg-gray-800 rounded-2xl overflow-hidden relative shadow-xl transition-all ${
                  participant.isSpeaking
                    ? "ring-4 ring-green-500 shadow-green-500/50"
                    : "ring-2 ring-gray-700"
                }`}
                aria-label={`${participant.name}${participant.isSpeaking ? " - speaking" : ""}`}
              >
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`w-32 h-32 bg-gradient-to-br ${participant.color} rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl`}
                    >
                      <span className="text-white text-4xl font-bold">{participant.initials}</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{participant.name}</p>
                    {participant.isSpeaking && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-medium">Speaking</span>
                      </div>
                    )}
                  </div>
                </div>
                {participant.name === "You" && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-lg ${
                        isCameraOn
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      CAM {isCameraOn ? "ON" : "OFF"}
                    </span>
                    <span
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-lg ${
                        isMicOn
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      MIC {isMicOn ? "ON" : "OFF"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 flex-shrink-0 shadow-2xl border border-gray-700">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-3 sm:p-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl ${
                  isCameraOn
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-900`}
                aria-pressed={isCameraOn}
                aria-label="Toggle camera"
                title={isCameraOn ? "Turn camera off" : "Turn camera on"}
              >
                {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </button>

              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 sm:p-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl ${
                  isMicOn
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-900`}
                aria-pressed={isMicOn}
                aria-label="Toggle microphone"
                title={isMicOn ? "Mute microphone" : "Unmute microphone"}
              >
                {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3 sm:p-4 rounded-xl font-semibold transition shadow-lg hover:shadow-xl ${
                  isScreenSharing
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900`}
                aria-pressed={isScreenSharing}
                aria-label="Toggle screen sharing"
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <Monitor className="h-6 w-6" /> : <MonitorOff className="h-6 w-6" />}
              </button>

              <button
                className="p-3 sm:p-4 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 transition shadow-lg hover:shadow-xl"
                aria-label="Settings"
                title="Settings"
              >
                <SettingsIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </main>

        <aside className="w-full lg:w-96 bg-white flex flex-col shadow-2xl" aria-label="Chat panel">
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4 sm:p-6 flex-shrink-0">
            <h2 className="text-xl font-bold text-white mb-1">Chat</h2>
            <p className="text-sm text-primary-100">{participants.length} participants</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{msg.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1 gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">{msg.sender}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{msg.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
            <label htmlFor="chat-message" className="sr-only">
              Type a message
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                id="chat-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-5 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
