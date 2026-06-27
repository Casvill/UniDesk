import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorPlay,
  ScreenShare,
  ScreenShareOff,
  Phone,
  Send,
  Settings,
  Users,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { api, type Room } from "@/services/api";
import { AnimatePresence, motion } from "motion/react";
import type {
  ChatMessage,
  NewMessagePayload,
  RoomParticipant,
  UserProfileSummary,
} from "@/utils/room";
import {
  extractPresenceUsers,
  fetchUserProfileSummary,
  formatMessageTime,
  getInitials,
  getParticipantGradient,
  getParticipantName,
  getPresenceAction,
  getRoomErrorMessage,
  mapPresenceUserToParticipant,
  mergeProfileIntoMessage,
  mergeProfileIntoParticipant,
  shouldFetchMessageProfile,
  shouldFetchParticipantProfile,
  upsertParticipant,
} from "@/utils/room";
import { showToast } from "@/shared/components/ui/toast";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { useMedia } from "@/hooks/useMedia";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useChat } from "@/hooks/useChat";

function renderMessageWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s)"'\]}>]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium hover:opacity-80"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export function ActiveRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, profile } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileChatMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const userProfilesCacheRef = useRef<Map<string, UserProfileSummary>>(new Map());
  const userProfilesInFlightRef = useRef<Set<string>>(new Set());
  const isChatOpenRef = useRef(true);
  const hasJoinedRoomRef = useRef(false);
  const localSocketIdRef = useRef<string | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const retryingMediaRef = useRef<Set<"audio" | "video">>(new Set());
  const wasScreenSharingRef = useRef(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [socketError, setSocketError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Conectando...");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waitingCopied, setWaitingCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  isChatOpenRef.current = isChatOpen;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");
  const [micLevel, setMicLevel] = useState<number>(0);
  const [settingsTab, setSettingsTab] = useState<"devices" | "room">("devices");
  const [editingRoomName, setEditingRoomName] = useState<string>("");
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  
  // Estados para sincronización de WebRTC y accesibilidad de audio
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isAudioAutoplayBlocked, setIsAudioAutoplayBlocked] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDuplicateTabDialog, setShowDuplicateTabDialog] = useState(false);
  const [duplicateTabResolved, setDuplicateTabResolved] = useState(false);
  const duplicateTabPendingRef = useRef(false);
  // FIX 2: flag para evitar registrar los handlers de WebRTC más de una vez
  // (p.ej. en reconexiones) y evitar listeners duplicados.
  const webRTCHandlersRegisteredRef = useRef(false);

  const webRTC = useWebRTC(localStreamRef);

  const getRealUsername = async (uid: string, fallback: string): Promise<string> => {
    const cached = userProfilesCacheRef.current.get(uid);
    if (cached?.username) return cached.username;

    if (user) {
      try {
        const token = await user.getIdToken();
        const profile = await fetchUserProfileSummary(uid, token);
        if (profile?.username) {
          userProfilesCacheRef.current.set(uid, profile);
          return profile.username;
        }
      } catch (err) {
        console.warn("Error resolving username for toast:", err);
      }
    }
    return fallback;
  };

  const {
    mediaPerms,
    mediaInitStatus,
    retryMedia,
    selectedAudioId,
    setSelectedAudioId,
    selectedVideoId,
    setSelectedVideoId,
    localAudioTrackId,
    screenStream,
    isScreenSharing,
    startScreenCapture,
    stopScreenCapture,
  } = useMedia(
    localStreamRef,
    () =>
      new Map(
        Array.from(
          webRTC.peerConnectionsRef.current.entries()
        )
      ),
    isMicOn,
    isCameraOn,
    setIsCameraOn
  );
  const chat = useChat(userProfilesCacheRef);

  const isSm = useMediaQuery("(min-width: 640px)");
  const isLg = useMediaQuery("(min-width: 1024px)");

  const mobileCols = participants.length <= 3 ? 1 : 2;

  const desktopCols =
    participants.length === 1
      ? 2 // Show local user tile + placeholder waiting card side-by-side
      : participants.length === 2
        ? 2
        : participants.length === 3
          ? 3
          : participants.length === 4
            ? 2
            : 3;

  const gridCols = isSm ? desktopCols : mobileCols;
  const effectiveGridCols = isSm && participants.length === 5 ? 6 : gridCols;

  const showOverflow = isSm ? participants.length > 6 : participants.length > 4;
  const overflowVisibleCount = gridCols * 2 - 1;

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.uid === user?.uid) return -1;
    if (b.uid === user?.uid) return 1;
    return 0;
  });
  const visibleParticipants = sortedParticipants.slice(
    0,
    showOverflow ? overflowVisibleCount : sortedParticipants.length
  );

  const renderOverflowAvatar = (p: RoomParticipant, idx: number) => (
    <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-gray-800 shadow-lg sm:h-12 sm:w-12 lg:h-14 lg:w-14">
      {p.photoURL ? (
        <img src={p.photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getParticipantGradient(idx)}`}
        >
          <span className="text-xs font-bold text-white sm:text-sm">
            {getInitials(getParticipantName(p))}
          </span>
        </div>
      )}
    </div>
  );

  const renderParticipantTile = (p: RoomParticipant, index: number, gridColumn?: string) => {
    const name = getParticipantName(p);
    const isCurrent = (p.socketId || p.uid) === (localSocketIdRef.current || user?.uid);
    const camOn = isCurrent ? (isCameraOn || isScreenSharing) : (p.cameraEnabled || p.screenSharing) ?? false;
    const micOn = isCurrent ? isMicOn : p.microphoneEnabled ?? false;
    const remoteStream = p.socketId ? webRTC.remoteStreams.get(p.socketId) : undefined;

    const hasMediaError = isCurrent && (
      mediaPerms.audio === "denied" ||
      mediaPerms.video === "denied" ||
      mediaPerms.audio === "error" ||
      mediaPerms.video === "error" ||
      mediaPerms.audio === "unavailable" ||
      mediaPerms.video === "unavailable"
    );

    return (
      <motion.div
        key={p.socketId || p.uid}
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={`relative overflow-hidden rounded-2xl bg-gray-800 transition-all duration-300 ${
          p.isSpeaking 
            ? "ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
            : "ring-0 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
        }`}
        style={gridColumn ? ({ gridColumn } as React.CSSProperties) : undefined}
        aria-label={hasMediaError ? `Error en transmisión de ${name}.` : p.isSpeaking ? `${name} hablando.` : name}
      >
        {isCurrent && camOn && mediaInitStatus === "ready" && localStreamRef.current?.getVideoTracks().length ? (
          <video
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            ref={(el) => {
              if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                el.srcObject = localStreamRef.current;
              }
            }}
          />
        ) : !isCurrent && remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <>
            <video
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${!camOn ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              ref={(el) => {
                if (el) {
                  if (remoteStream && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                  }
                  el.play().catch((err) => {
                    if (err.name !== "AbortError") {
                      console.warn("[WebRTC] Autoplay del video remoto bloqueado u omitido:", err);
                    }
                  });
                }
              }}
            />
            <audio
              autoPlay
              playsInline
              ref={(el) => {
                if (el) {
                  if (remoteStream && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                  }
                  if (selectedSpeakerId && typeof (el as any).setSinkId === "function") {
                    (el as any).setSinkId(selectedSpeakerId).catch((err: any) =>
                      console.warn("[WebRTC] Error al aplicar setSinkId al audio remoto:", err)
                    );
                  }
                  el.play().catch((err) => {
                    console.warn("[WebRTC] Autoplay del audio remoto bloqueado por el navegador:", err);
                    if (err.name === "NotAllowedError") {
                      setIsAudioAutoplayBlocked(true);
                    }
                  });
                }
              }}
            />
          </>
        ) : null}
        <div className="flex h-full min-h-[180px] items-center justify-center sm:min-h-[240px] lg:min-h-[280px]">
          {hasMediaError ? (
            <div className="text-center px-4 max-w-xs" role="alert" aria-live="assertive">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Acceso Denegado</p>
              <p className="text-[11px] text-gray-300 leading-normal">
                {mediaPerms.video === "denied" || mediaPerms.audio === "denied"
                  ? "Permiso de cámara/micrófono bloqueado. Concedelo en tu navegador para transmitir."
                  : mediaPerms.video === "unavailable" || mediaPerms.audio === "unavailable"
                    ? "Cámara/micrófono no detectados. Conecta un dispositivo multimedia."
                    : "No pudimos acceder a los dispositivos de captura. Revisa que no estén en uso."}
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await retryMedia("audio");
                    await retryMedia("video");
                    showToast.success("Reintentando acceder a dispositivos multimedia...");
                  } catch (err) {
                    console.warn("Reintento fallido de medios:", err);
                  }
                }}
                className="mt-3 cursor-pointer rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-amber-500 transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-label="Reintentar conectar cámara y micrófono"
              >
                Reintentar conexión
              </button>
            </div>
          ) : isCurrent && mediaInitStatus === "initializing" ? (
            <div className="text-center px-4" role="status" aria-live="polite">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-400 mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold text-gray-300">Solicitando acceso...</p>
              <p className="text-[10px] text-gray-500 mt-1">Concede los permisos en el navegador para comenzar.</p>
            </div>
          ) : !isCurrent && camOn && (!remoteStream || remoteStream.getVideoTracks().length === 0) ? (
            <div className="text-center px-4" role="status" aria-live="polite">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-400 mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold text-white">{name}</p>
              <p className="text-[10px] text-primary-200 mt-1 animate-pulse">Conectando transmisión...</p>
            </div>
          ) : (
            <div className="text-center">
              {p.photoURL ? (
                <img
                  src={p.photoURL}
                  alt=""
                  className="mx-auto mb-4 h-16 w-16 rounded-full object-cover shadow-2xl sm:h-20 sm:w-20 lg:h-32 lg:w-32"
                />
              ) : (
                <div
                  className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br sm:h-20 sm:w-20 lg:h-32 lg:w-32 ${getParticipantGradient(index)} shadow-2xl`}
                  aria-hidden="true"
                >
                  <span className="text-xl font-bold text-white sm:text-2xl lg:text-4xl">
                    {getInitials(name)}
                  </span>
                </div>
              )}
              <p className="text-sm font-semibold text-white sm:text-base lg:text-lg">
                {isCurrent ? "Tú" : name}
              </p>
              {p.isHost && (
                <p className="mt-1 text-sm font-medium text-primary-200">Anfitrión</p>
              )}
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-lg ${
              camOn ? "bg-green-600 text-white" : "bg-black/60 text-gray-400"
            }`}
            aria-label={camOn ? (p.screenSharing ? "Compartiendo pantalla" : "Cámara encendida") : "Cámara apagada"}
          >
            {camOn ? (
              p.screenSharing ? (
                <>
                  <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Compartiendo pantalla</span>
                </>
              ) : (
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
              )
            ) : (
              <VideoOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-lg transition-all duration-300 ${
              p.isSpeaking 
                ? "bg-green-500 text-white animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" 
                : micOn 
                  ? "bg-green-600 text-white" 
                  : "bg-black/60 text-gray-400"
            }`}
            aria-label={
              p.isSpeaking 
                ? "Micrófono transmitiendo voz" 
                : micOn 
                  ? "Micrófono activado" 
                  : "Micrófono silenciado"
            }
          >
            {micOn ? (
              <Mic className={`h-3.5 w-3.5 transition-transform duration-300 ${p.isSpeaking ? "scale-110" : ""}`} aria-hidden="true" />
            ) : (
              <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
        </div>
      </motion.div>
    );
  };

  const currentUserName =
    profile?.displayName || profile?.username || user?.email || "Tú";

  const currentUsername =
    profile?.username || profile?.displayName || user?.email || "Usuario";

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
          auth: { token },
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
          localSocketIdRef.current = socket!.id ?? null;
          setIsConnected(true);
          setConnectionStatus("En tiempo real");
          setSocketError("");
          chat.setChatStatus("loading");
          chat.setChatHistoryError("");

          // FIX 2: registrar los handlers de WebRTC aquí, cuando socket.id ya
          // existe, y pasar localSocketIdRef (ref mutable) para que el guard
          // interno siempre lea el valor actual y no el string vacío capturado
          // en el momento de registro. El flag evita duplicar listeners en
          // reconexiones automáticas del mismo socket.
          if (!webRTCHandlersRegisteredRef.current) {
            webRTC.registerWebRTCEventHandlers(socket!, localSocketIdRef);
            webRTCHandlersRegisteredRef.current = true;
          }
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
            setParticipants((previousParticipants) => {
              const result = mappedParticipants.map((participant) => {
                const previousParticipant = previousParticipants.find(
                  (item) => (item.socketId || item.uid) === (participant.socketId || participant.uid)
                );
                const cachedProfile = userProfilesCacheRef.current.get(
                  participant.uid
                );
                const isCurrentUser = (participant.socketId || participant.uid) === (localSocketIdRef.current || user?.uid);

                return mergeProfileIntoParticipant(
                  {
                    ...previousParticipant,
                    ...participant,
                    // Preservar estado de medios del participante existente
                    // (presence-data no tiene el estado real — siempre envía false)
                    screenSharing: previousParticipant?.screenSharing ?? participant.screenSharing ?? false,
                    cameraEnabled: previousParticipant?.cameraEnabled ?? participant.cameraEnabled ?? false,
                    microphoneEnabled: previousParticipant?.microphoneEnabled ?? participant.microphoneEnabled ?? false,
                    isSpeaking: previousParticipant?.isSpeaking ?? participant.isSpeaking ?? false,
                    username:
                      participant.username ||
                      previousParticipant?.username ||
                      (isCurrentUser ? currentUsername : undefined),
                    displayName:
                      participant.displayName ||
                      previousParticipant?.displayName ||
                      participant.username ||
                      previousParticipant?.username ||
                      (isCurrentUser ? currentUserName : "Usuario conectado"),
                    photoURL:
                      participant.photoURL ||
                      participant.avatar ||
                      previousParticipant?.photoURL ||
                      (isCurrentUser ? profile?.photoURL : undefined),
                  },
                  cachedProfile
                );
              });

              // Preservar participantes previos que no fueron cubiertos por el snapshot
              // (ej: misma cuenta con múltiples sesiones — cada una tiene distinto socketId)
              previousParticipants.forEach((prev) => {
                const exists = result.some(
                  (r) => (r.socketId || r.uid) === (prev.socketId || prev.uid)
                );
                if (!exists) {
                  result.push(prev);
                }
              });

              return result;
            });
            return;
          }

          if (action === "leave") {
            const leavingKeys = mappedParticipants.map(
              (p) => p.socketId || p.uid
            );

            setParticipants((currentParticipants) =>
              currentParticipants.filter(
                (p) => !leavingKeys.includes(p.socketId || p.uid)
              )
            );

            return;
          }

          setParticipants((currentParticipants) => {
            const updated = [...currentParticipants];
            mappedParticipants.forEach((participant) => {
              const existing = updated.find(
                (p) => (p.socketId || p.uid) === (participant.socketId || participant.uid)
              );
              if (existing) {
                const idx = updated.indexOf(existing);
                updated[idx] = {
                  ...existing,
                  ...participant,
                  socketId: existing.socketId,
                  // Preservar estado de medios del participante existente
                  screenSharing: existing.screenSharing ?? participant.screenSharing ?? false,
                  cameraEnabled: existing.cameraEnabled ?? participant.cameraEnabled ?? false,
                  microphoneEnabled: existing.microphoneEnabled ?? participant.microphoneEnabled ?? false,
                  isSpeaking: existing.isSpeaking ?? participant.isSpeaking ?? false,
                };
              } else {
                updated.push(participant);
              }
            });
            return updated;
          });
        });

        socket.on(
          "room-participants-update",
          (currentParticipants: RoomParticipant[]) => {
            if (!Array.isArray(currentParticipants)) return;

            setParticipants((previousParticipants) =>
              currentParticipants.map((participant) => {
                const previousParticipant = previousParticipants.find(
                  (item) => (item.socketId || item.uid) === (participant.socketId || participant.uid)
                );
                const isCurrentUser = (participant.socketId || participant.uid) === (localSocketIdRef.current || user?.uid);

                const cachedProfile = userProfilesCacheRef.current.get(
                  participant.uid
                );

                return mergeProfileIntoParticipant(
                  {
                    ...previousParticipant,
                    ...participant,
                    username:
                      participant.username ||
                      previousParticipant?.username ||
                      (isCurrentUser ? currentUsername : undefined),
                    displayName:
                      participant.displayName ||
                      previousParticipant?.displayName ||
                      participant.username ||
                      previousParticipant?.username ||
                      (isCurrentUser ? currentUserName : "Usuario conectado"),
                    photoURL:
                      participant.photoURL ||
                      participant.avatar ||
                      previousParticipant?.photoURL ||
                      (isCurrentUser ? profile?.photoURL : undefined),
                    isHost: participant.uid === room.ownerUid,
                    cameraEnabled:
                      participant.cameraEnabled ??
                      previousParticipant?.cameraEnabled ??
                      false,
                    microphoneEnabled:
                       participant.microphoneEnabled ??
                       previousParticipant?.microphoneEnabled ??
                       false,
                    screenSharing:
                      participant.screenSharing ??
                      previousParticipant?.screenSharing ??
                      false,
                    isSpeaking:
                      participant.isSpeaking ??
                      previousParticipant?.isSpeaking ??
                      false,
                  },
                  cachedProfile
                );
              })
            );
          }
        );

        chat.registerChatEventHandlers(socket, roomId, isChatOpenRef, (err) =>
          setSocketError(err)
        );

        socket.on("user-speaking", (payload: { socketId: string; uid: string; speaking: boolean }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              matchParticipant(p, payload.socketId, payload.uid) ? { ...p, isSpeaking: payload.speaking } : p
            )
          );
        });

        socket.on("user-joined", async (payload: { socketId: string; user: { uid: string; username?: string; displayName?: string; name?: string } }) => {
          if (payload.user && payload.user.uid !== user.uid) {
            const fallbackName = payload.user.username || "compañero";
            const name = await getRealUsername(payload.user.uid, fallbackName);
            showToast.info(`${name} ha entrado a la sala.`);
          }
        });

        socket.on("user-left", async (payload: { socketId: string; uid: string }) => {
          if (payload.uid !== user.uid) {
            const cached = userProfilesCacheRef.current.get(payload.uid);
            let name = cached?.username || "";
            
            if (!name) {
              const currentParticipant = participants.find(p => matchParticipant(p, payload.socketId, payload.uid));
              name = currentParticipant?.username || "";
            }
            
            if (!name) {
              name = await getRealUsername(payload.uid, "compañero");
            }
            
            showToast.info(`${name} ha salido de la sala.`);
          }
        });

        // matchParticipant: usado solo para eventos que NO son de estado de media
        // (user-joined toast, user-left toast). Tiene fallback a uid para compatibilidad.
        function matchParticipant(p: RoomParticipant, socketId: string | undefined, uid: string): boolean {
          if (p.socketId && socketId) return p.socketId === socketId;
          return p.uid === uid;
        }

        // FIX 3: matchBySocketIdOnly — usado para TODOS los eventos de estado de media
        // (mute, cámara, screen share, speaking). Dos usuarios de la misma cuenta tienen
        // el mismo uid pero distinto socketId. Usar uid como fallback aquí causaba que un
        // evento de A (p.ej. camera-off al iniciar screen share) también afectara el
        // estado visible de B, produciendo pantalla negra y estados incorrectos en C.
        function matchBySocketIdOnly(p: RoomParticipant, socketId: string): boolean {
          return !!p.socketId && p.socketId === socketId;
        }

        socket.on("user-muted", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              matchBySocketIdOnly(p, payload.socketId) ? { ...p, microphoneEnabled: false } : p
            )
          );
        });

        socket.on("user-unmuted", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              matchBySocketIdOnly(p, payload.socketId) ? { ...p, microphoneEnabled: true } : p
            )
          );
        });

        socket.on("camera-on", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              matchBySocketIdOnly(p, payload.socketId) ? { ...p, cameraEnabled: true } : p
            )
          );
        });

        socket.on("camera-off", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              matchBySocketIdOnly(p, payload.socketId) ? { ...p, cameraEnabled: false } : p
            )
          );
        });

        socket.on("screen-share-started", async (payload: { socketId: string; userId: string; estado: boolean }) => {
          const cached = userProfilesCacheRef.current.get(payload.userId);
          let name = cached?.username || "";

          if (!name) {
            const currentParticipant = participants.find(p => matchBySocketIdOnly(p, payload.socketId));
            name = currentParticipant?.username || "";
          }

          if (!name) {
            name = await getRealUsername(payload.userId, "compañero");
          }

          showToast.info(`${name} comenzó a compartir pantalla.`);

          setParticipants((prev) =>
            prev.map((p) =>
              matchBySocketIdOnly(p, payload.socketId) ? { ...p, screenSharing: true } : p
            )
          );
        });

        socket.on("screen-share-stopped", (payload: { socketId: string; userId: string; estado: boolean }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              matchBySocketIdOnly(p, payload.socketId) ? { ...p, screenSharing: false } : p
            )
          );
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
      webRTC.peerConnectionsRef.current.forEach((pc) => pc.close());
      webRTC.peerConnectionsRef.current.clear();

      if (socket) {
        socket.emit("leave-room");
        socket.disconnect();
      }

      socketRef.current = null;
      setIsConnected(false);
      hasJoinedRoomRef.current = false;
      setHasJoinedRoom(false);
      // FIX 2: resetear el flag para que si el efecto se vuelve a ejecutar
      // (p.ej. cambio de sala) los handlers se registren de nuevo correctamente.
      webRTCHandlersRegisteredRef.current = false;
    };
  }, [
    roomId,
    user,
    room,
    profile?.username,
    profile?.photoURL,
    currentUserName,
    currentUsername,
  ]);

  useEffect(() => {
    if (!user) return;

    const uidsToLoad = new Set<string>();

    participants.forEach((participant) => {
      if (
        participant.uid &&
        participant.uid !== user.uid &&
        shouldFetchParticipantProfile(participant) &&
        !userProfilesCacheRef.current.has(participant.uid) &&
        !userProfilesInFlightRef.current.has(participant.uid)
      ) {
        uidsToLoad.add(participant.uid);
      }
    });

    chat.chatMessages.forEach((chatMessage) => {
      if (
        chatMessage.senderUid &&
        chatMessage.senderUid !== user.uid &&
        shouldFetchMessageProfile(chatMessage) &&
        !userProfilesCacheRef.current.has(chatMessage.senderUid) &&
        !userProfilesInFlightRef.current.has(chatMessage.senderUid)
      ) {
        uidsToLoad.add(chatMessage.senderUid);
      }
    });

    if (uidsToLoad.size === 0) return;

    const loadMissingProfiles = async () => {
      try {
        const token = await user.getIdToken();

        await Promise.all(
          Array.from(uidsToLoad).map(async (uid) => {
            userProfilesInFlightRef.current.add(uid);

            try {
              const userProfile = await fetchUserProfileSummary(uid, token);

              if (!userProfile) return;

              userProfilesCacheRef.current.set(uid, userProfile);

              setParticipants((currentParticipants) =>
                currentParticipants.map((participant) =>
                  participant.uid === uid
                    ? mergeProfileIntoParticipant(participant, userProfile)
                    : participant
                )
              );

              chat.setChatMessages((currentMessages) =>
                currentMessages.map((chatMessage) =>
                  chatMessage.senderUid === uid
                    ? mergeProfileIntoMessage(chatMessage, userProfile)
                    : chatMessage
                )
              );
            } catch (error) {
              console.warn(`No se pudo cargar el perfil ${uid}:`, error);
            } finally {
              userProfilesInFlightRef.current.delete(uid);
            }
          })
        );
      } catch (error) {
        console.warn("No se pudo validar la sesión para cargar perfiles:", error);
      }
    };

    void loadMissingProfiles();
  }, [participants, chat.chatMessages, user]);

  useEffect(() => {
    if (!user) return;

    setParticipants((currentParticipants) =>
      currentParticipants.map((participant) =>
        (participant.socketId || participant.uid) === (localSocketIdRef.current || user?.uid)
          ? {
              ...participant,
              cameraEnabled: isCameraOn,
              microphoneEnabled: isMicOn,
              screenSharing: isScreenSharing,
            }
          : participant
      )
    );

    const shouldEnableVideo = isCameraOn || isScreenSharing;
    if (shouldEnableVideo) {
      const videoTracks = localStreamRef.current?.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0) {
        if (isCameraOn && mediaPerms.video === "granted") {
          retryMedia("video").catch(() => setIsCameraOn(false));
        } else if (isCameraOn && mediaPerms.video !== "prompt") {
          setIsCameraOn(false);
          if (mediaPerms.video === "denied") {
            showToast.error("Permiso de cámara denegado. Concede el permiso desde la configuración del navegador para usar la cámara.");
          } else if (mediaPerms.video === "unavailable") {
            showToast.error("No se detectó ninguna cámara en este dispositivo.");
          } else if (mediaPerms.video === "error") {
            showToast.error("Error al acceder a la cámara. Asegúrate de que no esté siendo usada por otra aplicación.");
          }
        }
      } else {
        videoTracks.forEach((t) => { t.enabled = true; });
      }
    } else {
      localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = false; });
    }

    if (isMicOn) {
      const audioTracks = localStreamRef.current?.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        if (mediaPerms.audio !== "prompt") {
          setIsMicOn(false);
          if (mediaPerms.audio === "denied") {
            showToast.error("Permiso de micrófono denegado. Concede el permiso desde la configuración del navegador para usar el micrófono.");
          } else if (mediaPerms.audio === "unavailable") {
            showToast.error("No se detectó ningún micrófono en este dispositivo.");
          } else if (mediaPerms.audio === "error") {
            showToast.error("Error al acceder al micrófono. Asegúrate de que no esté siendo usado por otra aplicación.");
          }
        }
      } else {
        audioTracks.forEach((t) => { t.enabled = true; });
      }
    } else {
      localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
    }

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit(isMicOn ? "user-unmuted" : "user-muted");
    socket.emit(isCameraOn ? "camera-on" : "camera-off");

    if (user) {
      if (isScreenSharing && !wasScreenSharingRef.current) {
        socket.emit("screen-share-started", { userId: user.uid, estado: true });
      } else if (!isScreenSharing && wasScreenSharingRef.current) {
        socket.emit("screen-share-stopped", { userId: user.uid, estado: false });
      }
    }
    wasScreenSharingRef.current = isScreenSharing;
  }, [isCameraOn, isMicOn, isScreenSharing, user, retryMedia]);

  useEffect(() => {
    if (!isChatOpen) return;

    const scrollContainer = (container: HTMLDivElement | null) => {
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    };

    const scrollTimer = setTimeout(() => {
      scrollContainer(chatMessagesContainerRef.current);
      scrollContainer(mobileChatMessagesContainerRef.current);
    }, 50);

    return () => clearTimeout(scrollTimer);
  }, [chat.chatMessages.length, isChatOpen]);

  // BroadcastChannel: detectar pestañas duplicadas del mismo usuario
  useEffect(() => {
    if (!user || !roomId) return;

    const bc = new BroadcastChannel(`unidesk-room-${roomId}`);
    broadcastChannelRef.current = bc;

    bc.onmessage = (event) => {
      if (event.data?.type === "duplicate-ping" && event.data.uid === user.uid) {
        bc.postMessage({ type: "duplicate-pong", uid: user.uid });
      }
      if (event.data?.type === "leave-request" && event.data.uid === user.uid) {
        if (socketRef.current) {
          socketRef.current.emit("leave-room");
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        showToast.info("Tu sesión fue transferida a otra pestaña.");
        navigate("/dashboard");
      }
    };

    return () => {
      bc.close();
      broadcastChannelRef.current = null;
    };
  }, [user, roomId, navigate]);

  // Sincronizar unión a la sala cuando el socket esté conectado y los medios inicializados
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !user || !room || !roomId || hasJoinedRoom || hasJoinedRoomRef.current) return;

    // Esperar a que la inicialización de medios haya concluido (ready o error)
    if (mediaInitStatus === "initializing" || mediaInitStatus === "idle") {
      return;
    }

    // Detectar pestañas duplicadas antes de unirse
    if (!duplicateTabResolved && !duplicateTabPendingRef.current) {
      duplicateTabPendingRef.current = true;
      let otherTabFound = false;

      const bc = broadcastChannelRef.current;
      if (bc) {
        const handler = (event: MessageEvent) => {
          if (event.data?.type === "duplicate-pong" && event.data.uid === user.uid) {
            otherTabFound = true;
            setShowDuplicateTabDialog(true);
            setDuplicateTabResolved(true);
          }
        };
        bc.addEventListener("message", handler);
        bc.postMessage({ type: "duplicate-ping", uid: user.uid });

        setTimeout(() => {
          bc.removeEventListener("message", handler);
          if (!otherTabFound) {
            setDuplicateTabResolved(true);
          }
          duplicateTabPendingRef.current = false;
        }, 500);
      } else {
        setDuplicateTabResolved(true);
        duplicateTabPendingRef.current = false;
      }

      return;
    }

    if (!duplicateTabResolved) return;

    const localParticipant: RoomParticipant = {
      uid: user.uid,
      username: currentUsername,
      displayName: currentUserName,
      photoURL: profile?.photoURL,
      isHost: room.ownerUid === user.uid,
      cameraEnabled: isCameraOn,
      microphoneEnabled: isMicOn,
      screenSharing: isScreenSharing,
      isSpeaking: false,
    };

    console.log("[ActiveRoom] Uniendo a la sala vía socket. Medios listos. Username:", currentUsername);
    socket.emit("join-room", {
      roomId,
      uid: user.uid,
      username: currentUsername,
      microphoneEnabled: isMicOn,
      cameraEnabled: isCameraOn,
    });

    setParticipants((currentParticipants) =>
      upsertParticipant(currentParticipants, localParticipant)
    );
    hasJoinedRoomRef.current = true;
    setHasJoinedRoom(true);
  }, [
    isConnected,
    mediaInitStatus,
    user,
    room,
    roomId,
    currentUsername,
    currentUserName,
    profile?.photoURL,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    hasJoinedRoom,
    duplicateTabResolved,
  ]);

  const handleUnblockAudio = () => {
    document.querySelectorAll("audio").forEach((el) => {
      el.play()
        .then(() => {
          console.log("Audio reproducido con éxito tras la interacción del usuario.");
        })
        .catch((err) => {
          console.error("No se pudo reproducir el audio remoto:", err);
        });
    });
    setIsAudioAutoplayBlocked(false);
  };

  // Efecto para detectar si el usuario local está hablando y sincronizarlo con el socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!isMicOn || !localStreamRef.current || !socket || mediaInitStatus !== "ready") {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId || p.uid) === (localSocketIdRef.current || user?.uid) ? { ...p, isSpeaking: false } : p)
      );
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isSpeaking = false;
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length === 0) return;

      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const audioStream = new MediaStream([audioTracks[0]]);
      source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalId = setInterval(() => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const volume = (average / 255) * 100; // Normalizado de 0 a 100

        const threshold = 1.5; // Umbral de detección de volumen para frecuencia

        if (volume > threshold) {
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
          if (!isSpeaking) {
            isSpeaking = true;
            socket.emit("user-speaking", { speaking: true });
            setParticipants((prev) =>
              prev.map((p) => (p.socketId || p.uid) === (localSocketIdRef.current || user?.uid) ? { ...p, isSpeaking: true } : p)
            );
          }
        } else {
          if (isSpeaking && !silenceTimeout) {
            silenceTimeout = setTimeout(() => {
              isSpeaking = false;
              socket.emit("user-speaking", { speaking: false });
              setParticipants((prev) =>
                prev.map((p) => (p.socketId || p.uid) === (localSocketIdRef.current || user?.uid) ? { ...p, isSpeaking: false } : p)
              );
              silenceTimeout = null;
            }, 400);
          }
        }
      }, 100);

    } catch (err) {
      console.warn("No se pudo iniciar el detector local de habla:", err);
    }

    return () => {
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (intervalId) clearInterval(intervalId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [isMicOn, mediaInitStatus, user?.uid, isConnected, localAudioTrackId]);

  // Efecto para monitorear el nivel de audio remoto vía getStats de WebRTC
  useEffect(() => {
    if (!isConnected) return;

    const intervalId = setInterval(async () => {
      const pcs = webRTC.peerConnectionsRef.current;
      if (pcs.size === 0) return;

      const speakingSocketIds = new Set<string>();

      for (const [socketId, pc] of pcs.entries()) {
        if (pc.connectionState !== "connected") continue;

        try {
          const stats = await pc.getStats();
          let isSpeakingRemote = false;

          stats.forEach((report) => {
            if (report.type === "inbound-rtp" && report.kind === "audio") {
              // audioLevel en inbound-rtp es una métrica normalizada de 0.0 a 1.0
              if (typeof report.audioLevel === "number" && report.audioLevel > 0.015) {
                isSpeakingRemote = true;
              }
            }
          });

          if (isSpeakingRemote) {
            speakingSocketIds.add(socketId);
          }
        } catch (err) {
          // Ignorar errores silenciosamente para evitar spam en consola
        }
      }

      setParticipants((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          const isCurrentUser = (p.socketId || p.uid) === (localSocketIdRef.current || user?.uid);
          if (isCurrentUser) return p; // La instancia local tiene su propio analizador de micrófono directo

          const shouldBeSpeaking = p.socketId ? speakingSocketIds.has(p.socketId) : false;
          if (p.isSpeaking !== shouldBeSpeaking) {
            changed = true;
            return { ...p, isSpeaking: shouldBeSpeaking };
          }
          return p;
        });
        return changed ? next : prev;
      });
    }, 200);

    return () => clearInterval(intervalId);
  }, [isConnected, user?.uid, webRTC.peerConnectionsRef]);

  const isCameraBlocked =
    mediaPerms.video === "denied" ||
    mediaPerms.video === "unavailable" ||
    mediaPerms.video === "error";

  const isMicBlocked =
    mediaPerms.audio === "denied" ||
    mediaPerms.audio === "unavailable" ||
    mediaPerms.audio === "error";

  const showCameraAlert = isCameraBlocked || isScreenSharing;

  const handleCameraClick = async () => {
    if (isScreenSharing) {
      showToast.error(
        "No puedes encender la cámara mientras compartes pantalla. Detén la presentación de pantalla para activar la cámara."
      );
      return;
    }
    if (isCameraBlocked) {
      if (mediaPerms.video === "denied") {
        showToast.error(
          "No es posible acceder a la cámara. Por favor, borra/reinicia los permisos de cámara en la configuración de tu navegador e inténtalo de nuevo."
        );
      } else if (mediaPerms.video === "unavailable") {
        showToast.error("No se detectó ninguna cámara en este dispositivo.");
      } else {
        showToast.error(
          "Error al acceder a la cámara. Asegúrate de que no esté siendo usada por otra aplicación."
        );
      }
      
      try {
        await retryMedia("video");
        const videoTracks = localStreamRef.current?.getVideoTracks() ?? [];
        if (videoTracks.length > 0) {
          setIsCameraOn(true);
          showToast.success("¡Cámara activada correctamente!");
        }
      } catch (err) {
        console.warn("Reintento de cámara fallido:", err);
      }
      return;
    }
    setIsCameraOn((value) => !value);
  };

  const handleMicClick = async () => {
    if (isMicBlocked) {
      if (mediaPerms.audio === "denied") {
        showToast.error(
          "No es posible acceder al micrófono. Por favor, borra/reinicia los permisos de micrófono en la configuración de tu navegador e inténtalo de nuevo."
        );
      } else if (mediaPerms.audio === "unavailable") {
        showToast.error("No se detectó ningún micrófono en este dispositivo.");
      } else {
        showToast.error(
          "Error al acceder al micrófono. Asegúrate de que no esté siendo usado por otra aplicación."
        );
      }
      
      try {
        await retryMedia("audio");
        const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
        if (audioTracks.length > 0) {
          setIsMicOn(true);
          showToast.success("¡Micrófono activado correctamente!");
        }
      } catch (err) {
        console.warn("Reintento de micrófono fallido:", err);
      }
      return;
    }
    setIsMicOn((value) => !value);
  };

  const handleDeviceChange = async (kind: "audio" | "video", deviceId: string) => {
    if (kind === "audio") {
      setSelectedAudioId(deviceId);
      if (isMicOn) {
        await retryMedia("audio", deviceId);
      }
    } else {
      setSelectedVideoId(deviceId);
      if (isCameraOn) {
        await retryMedia("video", deviceId);
      }
    }
  };

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    document.querySelectorAll("video, audio").forEach((el) => {
      if (typeof (el as any).setSinkId === "function") {
        (el as any).setSinkId(deviceId).catch((err: any) => 
          console.warn("Error al redireccionar salida de audio para el elemento:", err)
        );
      }
    });
  };

  const playTestSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (selectedSpeakerId && typeof (audioCtx as any).setSinkId === "function") {
        (audioCtx as any).setSinkId(selectedSpeakerId).catch((err: any) => 
          console.warn("No se pudo establecer el dispositivo de salida en el contexto de audio:", err)
        );
      }

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5 chime
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8); // decay
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
      
      showToast.success("Reproduciendo sonido de prueba...");
    } catch (err) {
      console.error("Error al reproducir sonido de prueba:", err);
      showToast.error("No se pudo reproducir el sonido de prueba.");
    }
  };

  const handleSaveRoomName = async () => {
    if (!roomId || !editingRoomName.trim() || !user) return;
    try {
      setIsSavingRoom(true);
      const token = await user.getIdToken();
      const updated = await api.updateRoom(roomId, { name: editingRoomName.trim() }, token);
      setRoom(updated);
      showToast.success("¡Nombre de la sala actualizado correctamente!");
    } catch (err) {
      console.error("Error al actualizar la sala:", err);
      showToast.error("No se pudo actualizar el nombre de la sala.");
    } finally {
      setIsSavingRoom(false);
    }
  };

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const video = devices.filter(d => d.kind === "videoinput");
        const audioIn = devices.filter(d => d.kind === "audioinput");
        const audioOut = devices.filter(d => d.kind === "audiooutput");

        setVideoDevices(video);
        setAudioInputDevices(audioIn);
        setAudioOutputDevices(audioOut);

        if (!selectedSpeakerId && audioOut.length > 0) {
          const defaultSpk = audioOut.find(d => d.deviceId === "default") || audioOut[0];
          setSelectedSpeakerId(defaultSpk.deviceId);
        }
      } catch (err) {
        console.error("Error al obtener la lista de dispositivos:", err);
      }
    }
    
    if (isSettingsOpen) {
      getDevices();
    }
  }, [isSettingsOpen, mediaPerms]);

  useEffect(() => {
    if (!isSettingsOpen || !selectedAudioId || mediaPerms.audio !== "granted") {
      setMicLevel(0);
      return;
    }
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId = 0;

    async function startAnalyser() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedAudioId } }
        });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const level = Math.min(100, Math.round((average / 120) * 100));
          setMicLevel(level);
          animationFrameId = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
      } catch (err) {
        console.warn("No se pudo iniciar el analizador de volumen del micrófono:", err);
      }
    }

    startAnalyser();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [isSettingsOpen, selectedAudioId, mediaPerms.audio]);

  useEffect(() => {
    if (!selectedSpeakerId) return;
    document.querySelectorAll("video, audio").forEach((el) => {
      if (typeof (el as any).setSinkId === "function") {
        (el as any).setSinkId(selectedSpeakerId).catch((err: any) => 
          console.warn("Error al redireccionar salida de audio para el elemento:", err)
        );
      }
    });
  }, [selectedSpeakerId, webRTC.remoteStreams]);

  useEffect(() => {
    if (isSettingsOpen && room) {
      setEditingRoomName(room.name);
    }
  }, [isSettingsOpen, room]);

  const handleCopyId = async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWaitingCopyId = async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      setWaitingCopied(true);
      setTimeout(() => setWaitingCopied(false), 2000);
    } catch {
      setWaitingCopied(true);
      setTimeout(() => setWaitingCopied(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    navigate("/dashboard");
  };

  const renderChatContent = (containerRef: React.RefObject<HTMLDivElement | null>) => (
    <>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-50 p-4 sm:p-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Mensajes del chat de la sala"
      >
        {chat.chatStatus === "loading" ? (
          <div className="flex h-full min-h-[220px] items-center justify-center">
            <div
              className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="mx-auto h-8 w-8 animate-spin text-primary"
                aria-hidden="true"
              />

              <p className="mt-4 font-semibold text-gray-800">
                Cargando historial del chat...
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Estamos recuperando los mensajes anteriores de la sala.
              </p>
            </div>
          </div>
        ) : chat.chatStatus === "error" ? (
          <div className="flex h-full min-h-[220px] items-center justify-center">
            <div
              className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"
              role="alert"
            >
              <AlertCircle
                className="mx-auto h-8 w-8 text-red-600"
                aria-hidden="true"
              />

              <p className="mt-4 font-semibold text-gray-800">
                No pudimos cargar el historial
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {chat.chatHistoryError}
              </p>

              <button
                type="button"
                onClick={() => {
                  if (socketRef.current && roomId)
                    chat.handleRetryChatHistory(socketRef.current, roomId);
                }}
                className="mt-4 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : chat.chatStatus === "empty" ? (
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
            {chat.chatMessages.map((msg) => {
              const isOwnMessage =
                msg.senderUid === user?.uid ||
                msg.senderName === currentUsername;
              const messageUsername = chat.getMessageUsername(
                msg,
                participants,
                user,
                currentUsername
              );
              const messageAvatar = chat.getMessageAvatar(
                msg,
                participants,
                user,
                currentUsername,
                profile
              );
              const avatar = messageAvatar ? (
                <img
                  src={messageAvatar}
                  alt=""
                  className="mt-1 h-9 w-9 flex-shrink-0 rounded-full object-cover shadow-md"
                />
              ) : (
                <div
                  className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-500 shadow-md"
                  aria-hidden="true"
                >
                  <span className="text-xs font-bold text-white">
                    {getInitials(messageUsername)}
                  </span>
                </div>
              );

              return (
                <li
                  key={msg.id}
                  className={`flex gap-3 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isOwnMessage && avatar}

                  <div
                    className={`min-w-0 max-w-[82%] flex-col overflow-hidden ${
                      isOwnMessage
                        ? "items-end text-right"
                        : "items-start text-left"
                    } flex`}
                  >
                    <div className="mb-1 flex max-w-full items-center gap-2">
                      <span className="truncate text-xs font-semibold text-gray-700">
                        {messageUsername}
                      </span>

                      <span className="text-[11px] text-gray-500">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm break-all ${
                        isOwnMessage
                          ? "rounded-br-sm bg-primary text-white"
                          : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {renderMessageWithLinks(msg.message)}
                    </p>
                  </div>

                  {isOwnMessage && avatar}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={(event) =>
          chat.handleSendMessage(
            event,
            socketRef.current!,
            isConnected,
            user,
            roomId,
            (err) => setSocketError(err)
          )
        }
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
            value={chat.message}
            onChange={(event) => chat.setMessage(event.target.value)}
            placeholder="Escribe un mensaje..."
            aria-describedby="chat-message-help"
            disabled={!isConnected}
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          />

          <button
            type="submit"
            disabled={!chat.message.trim() || !isConnected}
            className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md transition hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={
              isConnected
                ? chat.message.trim()
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
  );

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
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10 sm:py-6 lg:px-12">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {room?.name || "Sala de estudio"}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-1.5 sm:gap-4">
              <p className="text-sm font-medium text-gray-400">ID: {roomId}</p>

              <button
                type="button"
                onClick={handleCopyId}
                className="flex cursor-pointer items-center gap-1 rounded p-1.5 text-sm text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={
                  copied
                    ? "ID copiado al portapapeles"
                    : "Copiar ID de la sala"
                }
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline"> Copiado </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Copiar ID</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-sm text-gray-400 sm:gap-2">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>{participants.length}<span className="hidden sm:inline"> participantes</span></span>
              </div>

              <div
                className={`flex items-center gap-1.5 text-sm sm:gap-2 ${
                  isConnected ? "text-green-400" : "text-gray-400"
                }`}
                role="status"
                aria-live="polite"
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{connectionStatus}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{connectionStatus}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {!isConnected && (
        <div 
          className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-200 text-sm shadow-md flex items-center justify-between gap-3"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
            <span>
              <span className="font-semibold text-amber-400">Sin conexión en tiempo real:</span>{" "}
              {socketError || "Intentando establecer la conexión con la sala. Verifica tu red."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (socketRef.current) {
                socketRef.current.connect();
              }
            }}
            className="text-xs bg-amber-500 text-gray-950 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-400 transition cursor-pointer"
          >
            Reconectar
          </button>
        </div>
      )}

      {isAudioAutoplayBlocked && (
        <div 
          className="flex-shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-3 text-red-200 text-sm shadow-md flex items-center justify-between gap-3"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 animate-pulse" aria-hidden="true" />
            <span>
              <span className="font-semibold text-red-400">Audio bloqueado:</span>{" "}
              El navegador ha silenciado el audio de la sala. Presiona el botón para activar el audio de los participantes.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUnblockAudio}
            className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-500 transition cursor-pointer focus:ring-2 focus:ring-red-400"
            aria-label="Activar audio de los participantes"
          >
            Activar audio
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-visible lg:flex-row">
        <main
          className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6"
          aria-label="Área de video"
        >
          <div
            className="grid min-h-0 flex-1 auto-rows-fr gap-2 overflow-visible pr-1 sm:gap-4"
            style={{
              gridTemplateColumns: `repeat(${effectiveGridCols}, minmax(0, 1fr))`,
            }}
          >
            {participants.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-600 bg-gray-800 p-10 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-500 animate-pulse" aria-hidden="true" />
                <p className="mt-4 font-semibold text-white">Conectando a la sala...</p>
                <p className="mt-1 text-sm text-gray-400">Por favor, espera mientras nos unimos a la sesión.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {visibleParticipants.map((p, i) => {
                  const gridColumn = isSm && participants.length === 5
                    ? i < 3 ? "span 2" : "span 3"
                    : undefined;
                  return renderParticipantTile(p, i, gridColumn);
                })}

                {participants.length === 1 && (
                  <motion.div
                    key="waiting-placeholder"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-800/40 p-6 text-center backdrop-blur-sm min-h-[180px] sm:min-h-[240px] lg:min-h-[280px]"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 text-primary-400 mb-4">
                      <Users className="h-8 w-8 text-primary-400 animate-pulse" />
                    </div>
                    <h3 className="text-base font-semibold text-white">Esperando a otros participantes</h3>
                    <p className="mt-2 text-xs text-gray-400 max-w-xs mx-auto">
                      Comparte el ID de la sala con tus compañeros para que se unan a la sesión de estudio.
                    </p>
                    <button
                      type="button"
                      onClick={handleWaitingCopyId}
                      className="mt-4 flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-700/80 px-6 py-3 text-sm sm:px-4 sm:py-2.5 sm:text-xs font-semibold text-white hover:bg-gray-600 transition"
                    >
                      {waitingCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-400" />
                          <span> Copiado </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar ID</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {showOverflow && (
                  <motion.div
                    key="overflow"
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative overflow-hidden rounded-2xl bg-gray-800 ring-2 ring-gray-700 shadow-xl"
                  >
                    <div className="flex h-full min-h-[180px] flex-col items-center justify-center sm:min-h-[240px] lg:min-h-[280px]">
                      <div className="flex items-center justify-center">
                        <div className="relative z-10 mr-[-14px] sm:mr-[-16px] lg:mr-[-20px]">
                          {renderOverflowAvatar(
                            sortedParticipants[overflowVisibleCount],
                            overflowVisibleCount
                          )}
                        </div>
                        {sortedParticipants.length > overflowVisibleCount + 1 && (
                          <div>
                            {renderOverflowAvatar(
                              sortedParticipants[overflowVisibleCount + 1],
                              overflowVisibleCount + 1
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-300 sm:text-base">
                        +{sortedParticipants.length - overflowVisibleCount} más
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="flex-shrink-0 rounded-2xl border border-gray-700 bg-gray-900/90 px-4 py-3 shadow-2xl backdrop-blur-sm sm:px-6 sm:py-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Camera */}
              <button
                type="button"
                onClick={handleCameraClick}
                className={`relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14 ${
                  showCameraAlert
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30"
                    : isCameraOn
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isCameraOn}
                aria-label={
                  showCameraAlert
                    ? isScreenSharing
                      ? "Cámara desactivada mientras compartes pantalla"
                      : "Cámara bloqueada por permisos"
                    : isCameraOn
                      ? "Apagar cámara"
                      : "Encender cámara"
                }
              >
                  {isCameraOn ? (
                    <Video className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  ) : (
                    <VideoOff className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  )}
                  {showCameraAlert && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#403421] shadow-md">
                      <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    </span>
                  )}
              </button>

              {/* Mic */}
              <button
                type="button"
                onClick={handleMicClick}
                className={`relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14 ${
                  isMicBlocked
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30"
                    : isMicOn
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isMicOn}
                aria-label={
                  isMicBlocked
                    ? "Micrófono bloqueado por permisos"
                    : isMicOn
                      ? "Silenciar micrófono"
                      : "Activar micrófono"
                }
              >
                  {isMicOn ? (
                    <Mic className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  ) : (
                    <MicOff className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  )}
                  {isMicBlocked && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#403421] shadow-md">
                      <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    </span>
                  )}
              </button>

              {/* Share screen */}
              <button
                type="button"
                onClick={async () => {
                  if (isScreenSharing) {
                    await stopScreenCapture();
                  } else {
                    try {
                      await startScreenCapture();
                    } catch (err) {
                      console.warn("Screen capture cancelled or failed", err);
                    }
                  }
                }}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14 ${
                  isScreenSharing
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isScreenSharing}
                aria-label={isScreenSharing ? "Dejar de compartir pantalla" : "Compartir pantalla"}
              >
                {isScreenSharing ? (
                  <ScreenShare className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                ) : (
                  <ScreenShareOff className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                )}
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14"
                aria-label="Configuración de la sala"
                title="Configuración"
              >
                <Settings className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
              </button>

              {/* Chat — mobile only */}
              <div className="relative lg:hidden">
                <button
                  type="button"
                  onClick={() => { setIsChatOpen((value) => !value); chat.setUnreadCount(0); }}
                  className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14 ${
                    isChatOpen
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  aria-pressed={isChatOpen}
                  aria-label={isChatOpen ? "Ocultar chat" : "Mostrar chat"}
                >
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                </button>
                {chat.unreadCount > 0 && !isChatOpen && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md animate-badge-bounce sm:h-6 sm:w-6 sm:text-sm">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}
              </div>

              {/* Leave call */}
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-red-600 text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14"
                aria-label="Salir de la sala"
              >
                <Phone className="h-6 w-6 rotate-[135deg] sm:h-7 sm:w-7" aria-hidden="true" />
              </button>
            </div>
          </div>
        </main>

        {/* Mobile chat overlay (< lg) */}
        <div
          className={`fixed inset-0 z-50 flex flex-col transition-all duration-300 ease-out motion-reduce:transition-none lg:hidden ${
            isChatOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!isChatOpen}
        >
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              isChatOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => { setIsChatOpen(false); chat.setUnreadCount(0); }}
            aria-hidden="true"
          />
          <div
            className={`relative z-10 mt-auto flex max-h-[75vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none ${
              isChatOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
              <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-purple-600 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      id="chat-title-mobile"
                      className="mb-1 text-xl font-bold text-white"
                    >
                      Chat de la sala
                    </h2>
                    <p className="text-sm text-primary-100">
                      {participants.length === 1
                        ? "1 participante conectado"
                        : `${participants.length} participantes conectados`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsChatOpen(false); chat.setUnreadCount(0); }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Cerrar chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {renderChatContent(mobileChatMessagesContainerRef)}
            </div>
          </div>

        {/* Desktop chat sidebar (lg+) */}
        <div
          className={`relative hidden min-h-0 flex-shrink-0 transition-all duration-300 ease-out motion-reduce:transition-none lg:block ${
            isChatOpen
              ? "lg:h-full lg:w-96"
              : "lg:h-full lg:w-0"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setIsChatOpen((value) => !value);
              chat.setUnreadCount(0);
            }}
            className="absolute right-4 bottom-0 z-30 flex h-10 w-16 translate-y-full cursor-pointer items-center justify-center rounded-b-1xl bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-xl transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 lg:left-0 lg:right-auto lg:top-1/2 lg:bottom-auto lg:h-16 lg:w-11 lg:-translate-x-full lg:-translate-y-1/2 lg:rounded-l-2xl lg:rounded-tr-none lg:bg-gradient-to-b"
            aria-label={
              isChatOpen ? "Ocultar chat de la sala" : "Mostrar chat de la sala"
            }
            aria-expanded={isChatOpen}
            aria-controls="room-chat-panel"
            title={isChatOpen ? "Ocultar chat" : "Mostrar chat"}
          >
            {isChatOpen ? (
              <ChevronDown className="h-5 w-5 lg:hidden" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-5 w-5 lg:hidden" aria-hidden="true" />
            )}

            {isChatOpen ? (
              <ChevronRight className="hidden h-6 w-6 lg:block" aria-hidden="true" />
            ) : (
              <ChevronLeft className="hidden h-6 w-6 lg:block" aria-hidden="true" />
            )}

            {chat.unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md animate-badge-bounce">
                {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
              </span>
            )}
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
                {renderChatContent(chatMessagesContainerRef)}
              </>
            )}
          </aside>
        </div>
      </div>

      {/* Modal de Configuración */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-dialog-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
                <h2 id="settings-dialog-title" className="text-lg font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary-400" />
                  Configuración de la Sala
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition cursor-pointer"
                  aria-label="Cerrar configuración"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              {room?.ownerUid === user?.uid && (
                <div className="flex border-b border-gray-800 px-6 bg-gray-950" role="tablist" aria-label="Secciones de configuración">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={settingsTab === "devices"}
                    aria-controls="settings-panel-devices"
                    onClick={() => setSettingsTab("devices")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
                      settingsTab === "devices"
                        ? "border-primary-500 text-primary-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Dispositivos
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={settingsTab === "room"}
                    aria-controls="settings-panel-room"
                    onClick={() => setSettingsTab("room")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
                      settingsTab === "room"
                        ? "border-primary-500 text-primary-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Gestión de Sala (Anfitrión)
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {settingsTab === "devices" ? (
                  <div id="settings-panel-devices" role="tabpanel" className="space-y-6">
                    {/* Selector de Cámara */}
                    <div className="space-y-2">
                      <label htmlFor="settings-camera-select" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Cámara de video
                      </label>
                      <select
                        id="settings-camera-select"
                        value={selectedVideoId}
                        onChange={(e) => handleDeviceChange("video", e.target.value)}
                        className="w-full rounded-xl bg-gray-850 border border-gray-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer animate-none"
                      >
                        {videoDevices.length === 0 ? (
                          <option value="">Cámara por defecto / No detectada</option>
                        ) : (
                          videoDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Cámara (${d.deviceId.slice(0, 5)}...)`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Selector de Micrófono */}
                    <div className="space-y-2">
                      <label htmlFor="settings-mic-select" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Micrófono (Entrada)
                      </label>
                      <select
                        id="settings-mic-select"
                        value={selectedAudioId}
                        onChange={(e) => handleDeviceChange("audio", e.target.value)}
                        className="w-full rounded-xl bg-gray-850 border border-gray-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer animate-none"
                      >
                        {audioInputDevices.length === 0 ? (
                          <option value="">Micrófono por defecto / No detectado</option>
                        ) : (
                          audioInputDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Micrófono (${d.deviceId.slice(0, 5)}...)`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Medidor de Micrófono */}
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Prueba de voz en vivo
                      </span>
                      <div 
                        className="h-3 w-full rounded-full bg-gray-800 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={micLevel}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Nivel de entrada del micrófono"
                      >
                        <div
                          className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-500 transition-all duration-75 ease-out"
                          style={{ width: `${micLevel}%` }}
                        />
                      </div>
                      <span className="sr-only">Nivel actual del micrófono: {micLevel} por ciento.</span>
                    </div>

                    {/* Selector de Parlantes */}
                    <div className="space-y-2">
                      <label htmlFor="settings-speaker-select" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Salida de audio (Altavoces / Auriculares)
                      </label>
                      <select
                        id="settings-speaker-select"
                        value={selectedSpeakerId}
                        onChange={(e) => handleSpeakerChange(e.target.value)}
                        className="w-full rounded-xl bg-gray-850 border border-gray-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer animate-none"
                      >
                        {audioOutputDevices.length === 0 ? (
                          <option value="">Sistema por defecto</option>
                        ) : (
                          audioOutputDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Altavoces (${d.deviceId.slice(0, 5)}...)`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Botón Probar Sonido */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={playTestSound}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-750 transition cursor-pointer"
                        aria-label="Probar sonido de salida. Reproducirá un tono de prueba en el altavoz seleccionado."
                      >
                        <Volume2 className="h-4.5 w-4.5 text-primary-400" />
                        Probar sonido de salida
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Room management (Host only) */
                  <div id="settings-panel-room" role="tabpanel" className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="settings-room-name-input" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Nombre de la sala
                      </label>
                      <input
                        id="settings-room-name-input"
                        type="text"
                        value={editingRoomName}
                        onChange={(e) => setEditingRoomName(e.target.value)}
                        className="w-full rounded-xl bg-gray-850 border border-gray-800 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej. Clase de Matemáticas"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSavingRoom || !editingRoomName.trim() || editingRoomName === room?.name}
                      onClick={handleSaveRoomName}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:bg-gray-800 disabled:text-gray-500 transition cursor-pointer"
                    >
                      {isSavingRoom ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando cambios...
                        </>
                      ) : (
                        "Guardar cambios de la sala"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-950 border-t border-gray-800 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDuplicateTabDialog}
        onOpenChange={(open) => { setShowDuplicateTabDialog(open); if (!open) navigate("/dashboard"); }}
        title="Sesión duplicada detectada"
        description="Ya tienes una sesión activa en esta sala desde otra pestaña. ¿Quieres usar esta y cerrar la otra?"
        confirmLabel="Usar esta y cerrar la otra"
        onConfirm={() => {
          broadcastChannelRef.current?.postMessage({ type: "leave-request", uid: user?.uid });
          setShowDuplicateTabDialog(false);
        }}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="¿Salir de la sala?"
        description="¿Estás seguro de que quieres salir de esta sala de estudio?"
        confirmLabel="Salir"
        variant="destructive"
        onConfirm={confirmLeaveRoom}
      />
    </div>
  );
}