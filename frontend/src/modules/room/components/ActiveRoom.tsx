import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Send,
  Settings as SettingsIcon,
  Users,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { api, type Room } from "@/services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

interface RoomParticipant {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  isHost?: boolean;
  isSpeaking?: boolean;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  screenSharing?: boolean;
}

interface ChatMessage {
  id: string;
  roomId?: string;
  senderUid: string;
  senderName: string;
  senderPhotoURL?: string;
  message: string;
  createdAt?: string;
}

type ApiError = Error & {
  code?: string;
  status?: number;
};

type PresenceUser = {
  uid?: string;
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  picture?: string;
};

type PresencePayload = {
  users?: unknown;
  participants?: unknown;
  onlineUsers?: unknown;
  presence?: unknown;
  connectedUsers?: unknown;
  members?: unknown;
  uid?: string;
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  name?: string;
  action?: string;
  type?: string;
  event?: string;
};

type NewMessagePayload = {
  id?: string;
  uid?: string;
  senderUid?: string;
  senderUsername?: string;
  username?: string;
  senderName?: string;
  content?: string;
  message?: string;
  createdAt?: string;
};

function getRoomErrorMessage(error: unknown) {
  const apiError = error as ApiError;

  if (
    apiError.code === "backend/room-not-found" ||
    apiError.status === 404
  ) {
    return "No encontramos esta sala. Verifica el ID e inténtalo nuevamente.";
  }

  if (
    apiError.code === "backend/unauthorized" ||
    apiError.status === 401
  ) {
    return "Tu sesión expiró. Inicia sesión nuevamente para ingresar a la sala.";
  }

  if (apiError.code === "backend/network-error") {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";
  }

  return "No pudimos cargar la información de la sala.";
}

function getParticipantName(participant: RoomParticipant) {
  return participant.displayName || participant.username || "Usuario conectado";
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

function getParticipantGradient(index: number) {
  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-primary-500 to-purple-500",
  ];

  return gradients[index % gradients.length];
}

function upsertParticipant(
  participants: RoomParticipant[],
  participant: RoomParticipant
) {
  const exists = participants.some((item) => item.uid === participant.uid);

  if (exists) {
    return participants.map((item) =>
      item.uid === participant.uid ? { ...item, ...participant } : item
    );
  }

  return [...participants, participant];
}

function formatMessageTime(value?: string) {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getArrayFromValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (isObject(value)) {
    return Object.values(value);
  }

  return [];
}

function getPresenceUsersFromObject(value: unknown): PresenceUser[] {
  if (!isObject(value)) return [];

  return Object.entries(value)
    .map(([uid, item]) => {
      if (typeof item === "string") {
        return {
          uid,
          username: item,
          displayName: item,
        };
      }

      if (isObject(item)) {
        return {
          uid,
          ...item,
        } as PresenceUser;
      }

      return null;
    })
    .filter(Boolean) as PresenceUser[];
}

function extractPresenceUsers(data: unknown): PresenceUser[] {
  if (Array.isArray(data)) {
    return data.filter(isObject) as PresenceUser[];
  }

  if (!isObject(data)) return [];

  const payload = data as PresencePayload;

  const possibleLists = [
    payload.users,
    payload.participants,
    payload.onlineUsers,
    payload.presence,
    payload.connectedUsers,
    payload.members,
  ];

  for (const list of possibleLists) {
    if (Array.isArray(list)) {
      return list.filter(isObject) as PresenceUser[];
    }

    const usersFromObject = getPresenceUsersFromObject(list);

    if (usersFromObject.length > 0) {
      return usersFromObject;
    }

    const users = getArrayFromValue(list);

    if (users.length > 0) {
      return users.filter(isObject) as PresenceUser[];
    }
  }

  if ("uid" in data || "userId" in data || "id" in data) {
    return [data as PresenceUser];
  }

  return [];
}

function getPresenceAction(data: unknown) {
  if (!isObject(data)) return "snapshot";

  const payload = data as PresencePayload;
  const action = String(payload.action || payload.type || payload.event || "")
    .toLowerCase()
    .trim();

  if (
    action.includes("leave") ||
    action.includes("left") ||
    action.includes("disconnect") ||
    action.includes("offline")
  ) {
    return "leave";
  }

  if (
    action.includes("join") ||
    action.includes("joined") ||
    action.includes("connect") ||
    action.includes("online")
  ) {
    return "join";
  }

  if (
    payload.users ||
    payload.participants ||
    payload.onlineUsers ||
    payload.presence ||
    payload.connectedUsers ||
    payload.members ||
    Array.isArray(data)
  ) {
    return "snapshot";
  }

  return "join";
}

function mapPresenceUserToParticipant(
  item: PresenceUser,
  ownerUid?: string
): RoomParticipant | null {
  const uid = item.uid || item.userId || item.id;

  if (!uid) return null;

  return {
    uid,
    username: item.username || item.name || item.displayName,
    displayName:
      item.displayName || item.username || item.name || "Usuario conectado",
    photoURL: item.photoURL || item.picture,
    isHost: ownerUid ? uid === ownerUid : false,
    cameraEnabled: false,
    microphoneEnabled: true,
    screenSharing: false,
    isSpeaking: false,
  };
}

export function ActiveRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, profile } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");

  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [socketError, setSocketError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Conectando...");

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const currentUserName =
    profile?.displayName || profile?.username || user?.email || "Tú";

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) {
        setRoomError("No encontramos el ID de la sala.");
        setIsLoadingRoom(false);
        return;
      }

      if (!user) {
        setRoomError("No pudimos validar tu sesión. Inicia sesión nuevamente.");
        setIsLoadingRoom(false);
        return;
      }

      try {
        setIsLoadingRoom(true);
        setRoomError("");

        const token = await user.getIdToken();
        const currentRoom = await api.getRoomById(roomId, token);

        setRoom(currentRoom);
      } catch (error) {
        console.error("Error al cargar la sala:", error);
        setRoomError(getRoomErrorMessage(error));
      } finally {
        setIsLoadingRoom(false);
      }
    };

    void loadRoom();
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user || !room) return;

    let socket: Socket | null = null;

    const connectSocket = async () => {
      try {
        const token = await user.getIdToken();

        socket = io(SOCKET_URL, {
          auth: {
            token,
          },
          reconnection: true,
          reconnectionAttempts: 8,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        socket.io.on("reconnect_attempt", (attempt) => {
          setConnectionStatus(`Reconectando... intento ${attempt}`);
          setSocketError("");
        });

        socket.io.on("reconnect", () => {
          setConnectionStatus("Reconectado en tiempo real");
          setSocketError("");
        });

        socket.io.on("reconnect_error", () => {
          setConnectionStatus("Intentando reconectar...");
        });

        socket.io.on("reconnect_failed", () => {
          setIsConnected(false);
          setConnectionStatus("Sin conexión en tiempo real");
          setSocketError(
            "No pudimos restablecer la conexión con la sala en tiempo real."
          );
        });

        socket.on("connect", () => {
          setIsConnected(true);
          setConnectionStatus("En tiempo real");
          setSocketError("");

          const localParticipant: RoomParticipant = {
            uid: user.uid,
            username: profile?.username,
            displayName: currentUserName,
            photoURL: profile?.photoURL,
            isHost: room.ownerUid === user.uid,
            cameraEnabled: isCameraOn,
            microphoneEnabled: isMicOn,
            screenSharing: isScreenSharing,
            isSpeaking: false,
          };

          socket?.emit("join-room", {
            roomId,
            uid: user.uid,
            username: currentUserName,
          });

          setParticipants((currentParticipants) =>
            upsertParticipant(currentParticipants, localParticipant)
          );
        });

        socket.on("connect_error", (error) => {
          console.error("Error de conexión Socket.IO:", error);
          setIsConnected(false);
          setConnectionStatus("Error de conexión");
          setSocketError(
            "No pudimos conectar con la sala en tiempo real. Verifica que el backend realtime esté activo."
          );
        });

        socket.on("disconnect", (reason) => {
          console.warn("Socket desconectado:", reason);
          setIsConnected(false);
          setConnectionStatus("Desconectado");

          if (reason === "io server disconnect") {
            socket?.connect();
          }
        });

        socket.on("presence-change", (data: unknown) => {
          console.log("Actualización de presencia:", data);

          const users = extractPresenceUsers(data);
          const action = getPresenceAction(data);

          if (users.length === 0) return;

          const mappedParticipants = users
            .map((item) => mapPresenceUserToParticipant(item, room.ownerUid))
            .filter(Boolean) as RoomParticipant[];

          if (mappedParticipants.length === 0) return;

          if (action === "snapshot") {
            setParticipants(mappedParticipants);
            return;
          }

          if (action === "leave") {
            const leavingIds = mappedParticipants.map(
              (participant) => participant.uid
            );

            setParticipants((currentParticipants) =>
              currentParticipants.filter(
                (participant) => !leavingIds.includes(participant.uid)
              )
            );

            return;
          }

          setParticipants((currentParticipants) =>
            mappedParticipants.reduce(
              (updatedParticipants, participant) =>
                upsertParticipant(updatedParticipants, participant),
              currentParticipants
            )
          );
        });

        socket.on("new-message", (msg: NewMessagePayload) => {
          console.log("Nuevo mensaje:", msg);

          const newMessage: ChatMessage = {
            id: msg.id || crypto.randomUUID(),
            roomId,
            senderUid: msg.senderUid || msg.uid || "",
            senderName:
              msg.senderUsername ||
              msg.senderName ||
              msg.username ||
              "Usuario",
            message: msg.content || msg.message || "",
            createdAt: msg.createdAt || new Date().toISOString(),
          };

          if (!newMessage.message) return;

          setChatMessages((currentMessages) => {
            const exists = currentMessages.some(
              (item) => item.id === newMessage.id
            );

            if (exists) return currentMessages;

            return [...currentMessages, newMessage];
          });
        });
      } catch (error) {
        console.error("Error al conectar Socket.IO:", error);
        setIsConnected(false);
        setConnectionStatus("Error de conexión");
        setSocketError("No pudimos iniciar la conexión en tiempo real.");
      }
    };

    void connectSocket();

    return () => {
      if (socket) {
        socket.emit("leave-room");
        socket.disconnect();
      }

      socketRef.current = null;
      setIsConnected(false);
    };
  }, [
    roomId,
    user,
    room,
    profile?.username,
    profile?.photoURL,
    currentUserName,
  ]);

  useEffect(() => {
    if (!user) return;

    setParticipants((currentParticipants) =>
      currentParticipants.map((participant) =>
        participant.uid === user.uid
          ? {
              ...participant,
              cameraEnabled: isCameraOn,
              microphoneEnabled: isMicOn,
              screenSharing: isScreenSharing,
            }
          : participant
      )
    );
  }, [isCameraOn, isMicOn, isScreenSharing, user]);

  useEffect(() => {
    if (!isChatOpen) return;

    const chatContainer = chatMessagesContainerRef.current;

    if (!chatContainer) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [chatMessages.length, isChatOpen]);

  const handleCopyId = async () => {
    if (!roomId) return;

    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || !user || !roomId) return;

    if (!socketRef.current || !isConnected) {
      setSocketError(
        "No estás conectado a la sala en tiempo real. Intenta nuevamente."
      );
      return;
    }

    socketRef.current.emit("send-message", {
      content: cleanMessage,
    });

    setMessage("");
  };

  const handleLeaveRoom = () => {
    const shouldLeave = window.confirm(
      "¿Estás seguro de que quieres salir de esta sala de estudio?"
    );

    if (!shouldLeave) return;

    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    navigate("/dashboard");
  };

  if (isLoadingRoom) {
    return (
      <section
        className="flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="h-10 w-10 animate-spin text-white"
          aria-hidden="true"
        />

        <p className="mt-4 text-gray-200">Cargando sala de estudio...</p>
      </section>
    );
  }

  if (roomError) {
    return (
      <section className="flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div
          className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          role="alert"
        >
          <AlertCircle
            className="mx-auto h-10 w-10 text-red-600"
            aria-hidden="true"
          />

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            No pudimos cargar la sala
          </h1>

          <p className="mt-2 text-gray-600">{roomError}</p>

          <button
            type="button"
            onClick={() => navigate("/rooms")}
            className="mt-6 cursor-pointer rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Volver al dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="flex-shrink-0 border-b border-gray-700 bg-gray-900/90 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-white">
              {room?.name || "Sala de estudio"}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-4">
              <p className="text-sm text-gray-400">ID: {roomId}</p>

              <button
                type="button"
                onClick={handleCopyId}
                className="flex cursor-pointer items-center gap-1 rounded text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={
                  copied
                    ? "ID copiado al portapapeles"
                    : "Copiar ID de la sala"
                }
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    ID copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copiar ID
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>{participants.length} participantes</span>
              </div>

              <div
                className={`flex items-center gap-2 text-sm ${
                  isConnected ? "text-green-400" : "text-gray-400"
                }`}
                role="status"
                aria-live="polite"
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4" aria-hidden="true" />
                    {connectionStatus}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" aria-hidden="true" />
                    {connectionStatus}
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto"
            aria-label="Salir de la sala"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Salir
          </button>
        </div>
      </header>

      {socketError && (
        <p
          className="flex-shrink-0 bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white"
          role="alert"
          aria-live="assertive"
        >
          {socketError}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <main
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-4 sm:p-6"
          aria-label="Área de video"
        >
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            {participants.length === 0 ? (
              <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-gray-600 bg-gray-800 p-10 text-center">
                <div>
                  <Users
                    className="mx-auto h-10 w-10 text-gray-400"
                    aria-hidden="true"
                  />

                  <p className="mt-4 font-semibold text-white">
                    Aún no hay participantes conectados
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Cuando alguien entre a la sala aparecerá aquí.
                  </p>
                </div>
              </div>
            ) : (
              participants.map((participant, index) => {
                const participantName = getParticipantName(participant);
                const isCurrentUser = participant.uid === user?.uid;

                return (
                  <div
                    key={participant.uid}
                    className={`relative overflow-hidden rounded-2xl bg-gray-800 shadow-xl transition-all ${
                      participant.isSpeaking
                        ? "ring-4 ring-green-500 shadow-green-500/50"
                        : "ring-2 ring-gray-700"
                    }`}
                    aria-label={`${participantName}${
                      participant.isSpeaking ? " - hablando" : ""
                    }`}
                  >
                    <div className="flex h-full min-h-[280px] items-center justify-center">
                      <div className="text-center">
                        {participant.photoURL ? (
                          <img
                            src={participant.photoURL}
                            alt=""
                            className="mx-auto mb-4 h-32 w-32 rounded-full object-cover shadow-2xl"
                          />
                        ) : (
                          <div
                            className={`mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${getParticipantGradient(
                              index
                            )} shadow-2xl`}
                            aria-hidden="true"
                          >
                            <span className="text-4xl font-bold text-white">
                              {getInitials(participantName)}
                            </span>
                          </div>
                        )}

                        <p className="text-lg font-semibold text-white">
                          {isCurrentUser ? "Tú" : participantName}
                        </p>

                        {participant.isHost && (
                          <p className="mt-1 text-sm font-medium text-primary-200">
                            Anfitrión
                          </p>
                        )}

                        {participant.isSpeaking && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-green-400">
                              Hablando
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isCurrentUser && (
                      <div className="absolute right-4 top-4 flex gap-2">
                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg ${
                            isCameraOn
                              ? "bg-green-500 text-white"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          CAM {isCameraOn ? "ON" : "OFF"}
                        </span>

                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg ${
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
                );
              })
            )}
          </div>

          <div className="flex-shrink-0 rounded-2xl border border-gray-700 bg-gray-900/90 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsCameraOn((value) => !value)}
                className={`cursor-pointer rounded-xl p-3 font-semibold shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:p-4 ${
                  isCameraOn
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isCameraOn}
                aria-label={isCameraOn ? "Apagar cámara" : "Encender cámara"}
                title={isCameraOn ? "Apagar cámara" : "Encender cámara"}
              >
                {isCameraOn ? (
                  <Video className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <VideoOff className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMicOn((value) => !value)}
                className={`cursor-pointer rounded-xl p-3 font-semibold shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:p-4 ${
                  isMicOn
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isMicOn}
                aria-label={
                  isMicOn ? "Silenciar micrófono" : "Activar micrófono"
                }
                title={isMicOn ? "Silenciar micrófono" : "Activar micrófono"}
              >
                {isMicOn ? (
                  <Mic className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <MicOff className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsScreenSharing((value) => !value)}
                className={`cursor-pointer rounded-xl p-3 font-semibold shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:p-4 ${
                  isScreenSharing
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isScreenSharing}
                aria-label={
                  isScreenSharing
                    ? "Dejar de compartir pantalla"
                    : "Compartir pantalla"
                }
                title={
                  isScreenSharing
                    ? "Dejar de compartir pantalla"
                    : "Compartir pantalla"
                }
              >
                {isScreenSharing ? (
                  <Monitor className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <MonitorOff className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                className="cursor-pointer rounded-xl bg-gray-700 p-3 text-gray-300 shadow-lg transition hover:bg-gray-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:p-4"
                aria-label="Configuración"
                title="Configuración"
              >
                <SettingsIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </main>

        <div
          className={`relative min-h-0 flex-shrink-0 transition-all duration-300 ease-out motion-reduce:transition-none ${
            isChatOpen
              ? "h-[42vh] w-full lg:h-full lg:w-96"
              : "h-0 w-full lg:h-full lg:w-0"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsChatOpen((value) => !value)}
            className="absolute right-4 top-0 z-30 flex h-10 w-16 -translate-y-full cursor-pointer items-center justify-center rounded-t-2xl bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-xl transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 lg:left-0 lg:right-auto lg:top-1/2 lg:h-16 lg:w-11 lg:-translate-x-full lg:-translate-y-1/2 lg:rounded-l-2xl lg:rounded-tr-none lg:bg-gradient-to-b"
            aria-label={
              isChatOpen ? "Ocultar chat de la sala" : "Mostrar chat de la sala"
            }
            aria-expanded={isChatOpen}
            aria-controls="room-chat-panel"
            title={isChatOpen ? "Ocultar chat" : "Mostrar chat"}
          >
            {isChatOpen ? (
              <ChevronRight className="hidden h-6 w-6 lg:block" aria-hidden="true" />
            ) : (
              <ChevronLeft className="hidden h-6 w-6 lg:block" aria-hidden="true" />
            )}

            <MessageSquare className="h-5 w-5 lg:hidden" aria-hidden="true" />
          </button>

          <aside
            id="room-chat-panel"
            className={`flex h-full min-h-0 flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none ${
              isChatOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            role="region"
            aria-labelledby="chat-title"
            aria-describedby="chat-description"
            aria-hidden={!isChatOpen}
          >
            {isChatOpen && (
              <>
                <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-purple-600 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2
                        id="chat-title"
                        className="mb-1 text-xl font-bold text-white"
                      >
                        Chat de la sala
                      </h2>

                      <p
                        id="chat-description"
                        className="text-sm text-primary-100"
                      >
                        {participants.length === 1
                          ? "1 participante conectado"
                          : `${participants.length} participantes conectados`}
                      </p>
                    </div>

                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
                      aria-hidden="true"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div
                  ref={chatMessagesContainerRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-50 p-4 sm:p-6"
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions text"
                  aria-label="Mensajes del chat de la sala"
                >
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full min-h-[220px] items-center justify-center">
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
                        <div
                          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <MessageSquare className="h-6 w-6" />
                        </div>

                        <p className="mt-4 font-semibold text-gray-800">
                          Aún no hay mensajes
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Escribe el primer mensaje para iniciar la conversación.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {chatMessages.map((msg) => {
                        const isOwnMessage =
                          msg.senderUid === user?.uid ||
                          msg.senderName === currentUserName;

                        return (
                          <li
                            key={msg.id}
                            className={`flex gap-3 ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isOwnMessage && (
                              <>
                                {msg.senderPhotoURL ? (
                                  <img
                                    src={msg.senderPhotoURL}
                                    alt=""
                                    className="mt-1 h-9 w-9 flex-shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-500 shadow-md"
                                    aria-hidden="true"
                                  >
                                    <span className="text-xs font-bold text-white">
                                      {getInitials(msg.senderName)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            <div
                              className={`flex max-w-[82%] flex-col ${
                                isOwnMessage
                                  ? "items-end text-right"
                                  : "items-start text-left"
                              }`}
                            >
                              <div className="mb-1 flex max-w-full items-center gap-2">
                                <span className="truncate text-xs font-semibold text-gray-700">
                                  {isOwnMessage ? "Tú" : msg.senderName}
                                </span>

                                <span className="text-[11px] text-gray-500">
                                  {formatMessageTime(msg.createdAt)}
                                </span>
                              </div>

                              <p
                                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                                  isOwnMessage
                                    ? "rounded-br-sm bg-primary text-white"
                                    : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                                }`}
                              >
                                {msg.message}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="flex-shrink-0 border-t border-gray-200 bg-white p-4"
                  aria-label="Formulario para enviar mensajes"
                >
                  <label htmlFor="chat-message" className="sr-only">
                    Escribe un mensaje para enviarlo al chat de la sala
                  </label>

                  <p id="chat-message-help" className="sr-only">
                    Escribe tu mensaje y presiona Enter o el botón enviar.
                  </p>

                  <div className="flex items-end gap-2">
                    <input
                      type="text"
                      id="chat-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Escribe un mensaje..."
                      aria-describedby="chat-message-help"
                      disabled={!isConnected}
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />

                    <button
                      type="submit"
                      disabled={!message.trim() || !isConnected}
                      className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md transition hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={
                        isConnected
                          ? message.trim()
                            ? "Enviar mensaje"
                            : "Escribe un mensaje antes de enviar"
                          : "Conecta a la sala antes de enviar mensajes"
                      }
                    >
                      <Send className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
