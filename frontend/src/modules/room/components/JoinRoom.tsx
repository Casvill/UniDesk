import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Book, User as UserIcon, MessageSquare, Video, Monitor, CheckCircle } from "lucide-react";

export function JoinRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const roomDetails = {
    name: "Calculus Study Group",
    subject: "Mathematics",
    description: "Working through chapter 5 problems and reviewing for the upcoming midterm exam.",
    host: "Sarah Johnson",
    participants: 4,
    capacity: 10,
    features: {
      chat: true,
      video: true,
      screenShare: true,
    },
  };

  const handleJoinRoom = () => {
    navigate(`/rooms/${roomId}`);
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <button
        onClick={() => navigate("/rooms")}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Room List
      </button>

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Join Study Room</h2>
        <p className="text-gray-600">Review the room details before joining</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2"></div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{roomDetails.name}</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <Book className="h-5 w-5" />
              <span className="font-medium">{roomDetails.subject}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Description</h4>
            <p className="text-gray-700 leading-relaxed">{roomDetails.description}</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Room Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Host</span>
                </div>
                <p className="text-gray-900 font-semibold">{roomDetails.host}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Participants</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {roomDetails.participants}/{roomDetails.capacity}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Available Features</h4>
            <div className="space-y-3">
              {roomDetails.features.chat && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Text Chat</span>
                  </div>
                </div>
              )}
              {roomDetails.features.video && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Video/Audio Call</span>
                  </div>
                </div>
              )}
              {roomDetails.features.screenShare && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Screen Sharing</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Audio/Video Settings
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="join-camera"
                  name="joinCamera"
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-700">Join with camera on</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="join-microphone"
                  name="joinMicrophone"
                  defaultChecked
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-700">Join with microphone on</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleJoinRoom}
              className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl"
            >
              Join Room
            </button>
            <button
              onClick={() => navigate("/rooms")}
              className="w-full sm:flex-1 bg-white border border-gray-300 px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
