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
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/shared/components/ui/dialog";

export function ActiveRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [message, setMessage] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const participants = [
    { id: "1", name: "Sarah Johnson", isSpeaking: false, initials: "SJ", color: "from-blue-500 to-cyan-500" },
    { id: "2", name: "Mike Chen", isSpeaking: true, initials: "MC", color: "from-purple-500 to-pink-500" },
    { id: "3", name: "Emma Davis", isSpeaking: false, initials: "ED", color: "from-green-500 to-emerald-500" },
    { id: "4", name: "Tú", isSpeaking: false, initials: "TU", color: "from-primary-500 to-purple-500" },
  ];

  const chatMessages = [
    { id: "1", sender: "Sarah Johnson", message: "¡Hola a todos! ¿Listos para empezar?", time: "2:30 PM", initials: "SJ" },
    { id: "2", sender: "Mike Chen", message: "¡Sí! Empecemos con el problema 3", time: "2:31 PM", initials: "MC" },
    { id: "3", sender: "Emma Davis", message: "Me parece bien", time: "2:31 PM", initials: "ED" },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessage("");
    }
  };

  const handleLeaveRoom = () => {
    if (confirm("¿Estás seguro de que quieres salir de esta sala de estudio?")) {
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
              <p className="text-sm text-gray-400">ID: {roomId}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>{participants.length} participantes</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="w-full sm:w-auto bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            aria-label="Salir de la sala"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6" aria-label="Área de video">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`bg-gray-800 rounded-2xl overflow-hidden relative shadow-xl transition-all ${
                  participant.isSpeaking
                    ? "ring-4 ring-green-500 shadow-green-500/50"
                    : "ring-2 ring-gray-700"
                }`}
                aria-label={`${participant.name}${participant.isSpeaking ? " - hablando" : ""}`}
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
                        <span className="text-sm text-green-400 font-medium">Hablando</span>
                      </div>
                    )}
                  </div>
                </div>
                {participant.name === "Tú" && (
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
                aria-label="Alternar cámara"
                title={isCameraOn ? "Apagar cámara" : "Encender cámara"}
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
                aria-label="Alternar micrófono"
                title={isMicOn ? "Silenciar micrófono" : "Activar micrófono"}
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
                aria-label="Alternar compartir pantalla"
                title={isScreenSharing ? "Dejar de compartir" : "Compartir pantalla"}
              >
                {isScreenSharing ? <Monitor className="h-6 w-6" /> : <MonitorOff className="h-6 w-6" />}
              </button>

              <button
                className="p-3 sm:p-4 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 transition shadow-lg hover:shadow-xl"
                aria-label="Configuración"
                title="Configuración"
              >
                <SettingsIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </main>

        <aside className="w-full lg:w-96 bg-white flex flex-col shadow-2xl" aria-label="Panel de chat">
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4 sm:p-6 flex-shrink-0">
            <h2 className="text-xl font-bold text-white mb-1">Chat</h2>
            <p className="text-sm text-primary-100">{participants.length} participantes</p>
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
              Escribe un mensaje
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                id="chat-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
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

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tu sala está lista para compartir</DialogTitle>
            <DialogDescription>
              Copia el código y compártelo con quienes quieras invitar
            </DialogDescription>
          </DialogHeader>

          <div
            onClick={handleCopyId}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCopyId(); }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-200 p-6 text-center cursor-pointer hover:bg-indigo-100/80 active:bg-indigo-200/80 transition group select-none"
            role="button"
            tabIndex={0}
            aria-label="Copiar código de la sala"
          >
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
              ID de sala
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tracking-wider whitespace-nowrap overflow-hidden mb-4">
              {roomId}
            </p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
              copied
                ? "bg-green-100 text-green-700 scale-105"
                : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 group-active:scale-95"
            }`}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar ID
                </>
              )}
            </span>
          </div>

          <DialogClose asChild>
            <button className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition mt-2">
              Cerrar
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
