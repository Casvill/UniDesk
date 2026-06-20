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
  ScreenShare,
  ScreenShareOff,
  Phone,
  Send,
  Users,
  Video,
  VideoOff,
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
import { useMedia } from "@/hooks/useMedia";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useChat } from "@/hooks/useChat";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export function ActiveRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, profile } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const userProfilesCacheRef = useRef<Map<string, UserProfileSummary>>(new Map());
  const userProfilesInFlightRef = useRef<Set<string>>(new Set());
  const isChatOpenRef = useRef(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const retryingMediaRef = useRef<Set<"audio" | "video">>(new Set());

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [socketError, setSocketError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Conectando...");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  isChatOpenRef.current = isChatOpen;

  const webRTC = useWebRTC(localStreamRef);

  const {
    localVideoRef,
    mediaPerms,
    mediaInitStatus,
    retryMedia,
  } = useMedia(
    localStreamRef,
    () =>
      new Map(
        Array.from(
          webRTC.peerConnectionsRef.current.entries()
        )
      ),
    isMicOn,
    isCameraOn
  );
  const chat = useChat(userProfilesCacheRef);

  const isSm = useMediaQuery("(min-width: 640px)");
  const isLg = useMediaQuery("(min-width: 1024px)");

  const mobileCols = participants.length <= 3 ? 1 : 2;

  const desktopCols =
    participants.length <= 2
      ? participants.length
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
    const isCurrent = p.uid === user?.uid;
    const camOn = isCurrent ? isCameraOn : p.cameraEnabled ?? false;
    const micOn = isCurrent ? isMicOn : p.microphoneEnabled ?? false;
    const socketId = isCurrent ? undefined : webRTC.socketIdByUidRef.current.get(p.uid);
    const remoteStream = socketId ? webRTC.remoteStreams.get(socketId) : undefined;

    return (
      <motion.div
        key={p.uid}
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
        style={gridColumn ? ({ gridColumn } as React.CSSProperties) : undefined}
        aria-label={name}
      >
        {isCurrent && camOn && localStreamRef.current?.getVideoTracks().length ? (
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
        ) : !isCurrent && remoteStream ? (
          <video
            autoPlay
            playsInline
            className={`absolute inset-0 h-full w-full object-cover ${!camOn ? "hidden" : ""}`}
            ref={(el) => {
              if (el && remoteStream && el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
              }
            }}
          />
        ) : null}
        <div className="flex h-full min-h-[180px] items-center justify-center sm:min-h-[240px] lg:min-h-[280px]">
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
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-lg ${
              camOn ? "bg-green-600 text-white" : "bg-black/60 text-gray-400"
            }`}
            aria-label={camOn ? "Cámara encendida" : "Cámara apagada"}
          >
            {camOn ? (
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VideoOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-lg ${
              micOn ? "bg-green-600 text-white" : "bg-black/60 text-gray-400"
            }`}
            aria-label={micOn ? "Micrófono activado" : "Micrófono silenciado"}
          >
            {micOn ? (
              <Mic className="h-3.5 w-3.5" aria-hidden="true" />
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
          setIsConnected(true);
          setConnectionStatus("En tiempo real");
          setSocketError("");
          chat.setChatStatus("loading");
          chat.setChatHistoryError("");

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

          socket?.emit("join-room", {
            roomId,
            uid: user.uid,
            username: currentUsername,
            microphoneEnabled: isMicOn,
            cameraEnabled: isCameraOn,
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
            setParticipants((previousParticipants) =>
              mappedParticipants.map((participant) => {
                const previousParticipant = previousParticipants.find(
                  (item) => item.uid === participant.uid
                );
                const cachedProfile = userProfilesCacheRef.current.get(
                  participant.uid
                );
                const isCurrentUser = participant.uid === user.uid;

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
                  },
                  cachedProfile
                );
              })
            );
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

        socket.on(
          "room-participants-update",
          (currentParticipants: RoomParticipant[]) => {
            if (!Array.isArray(currentParticipants)) return;

            console.log("[Sync] room-participants-update received:", currentParticipants.map(p => ({ uid: p.uid, cam: p.cameraEnabled, mic: p.microphoneEnabled })));

            currentParticipants.forEach((p) => {
              if (p.socketId && p.uid) {
                webRTC.socketIdByUidRef.current.set(p.uid, p.socketId);
              }
            });

            setParticipants((previousParticipants) =>
              currentParticipants.map((participant) => {
                const previousParticipant = previousParticipants.find(
                  (item) => item.uid === participant.uid
                );
                const isCurrentUser = participant.uid === user.uid;

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

        webRTC.registerWebRTCEventHandlers(socket, user.uid);

        socket.on("user-muted", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === payload.uid ? { ...p, microphoneEnabled: false } : p
            )
          );
        });

        socket.on("user-unmuted", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === payload.uid ? { ...p, microphoneEnabled: true } : p
            )
          );
        });

        socket.on("camera-on", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === payload.uid ? { ...p, cameraEnabled: true } : p
            )
          );
        });

        socket.on("camera-off", (payload: { socketId: string; uid: string }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === payload.uid ? { ...p, cameraEnabled: false } : p
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
      webRTC.socketIdByUidRef.current.clear();

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

    if (isCameraOn) {
      const videoTracks = localStreamRef.current?.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0) {
        if (!retryingMediaRef.current.has("video")) {
          retryingMediaRef.current.add("video");
          retryMedia("video").finally(() => retryingMediaRef.current.delete("video"));
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
        if (!retryingMediaRef.current.has("audio")) {
          retryingMediaRef.current.add("audio");
          retryMedia("audio").finally(() => retryingMediaRef.current.delete("audio"));
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
  }, [chat.chatMessages.length, isChatOpen]);

  const handleCopyId = async () => {
    if (!roomId) return;

    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const renderChatContent = () => (
    <>
      <div
        ref={chatMessagesContainerRef}
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
                    className={`flex max-w-[82%] flex-col ${
                      isOwnMessage
                        ? "items-end text-right"
                        : "items-start text-left"
                    }`}
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
                      className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                        isOwnMessage
                          ? "rounded-br-sm bg-primary text-white"
                          : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {msg.message}
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
                    <span className="hidden sm:inline">ID copiado</span>
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

      {socketError && (
        <p
          className="flex-shrink-0 bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white"
          role="alert"
          aria-live="assertive"
        >
          {socketError}
        </p>
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
              <AnimatePresence mode="popLayout">
                {visibleParticipants.map((p, i) => {
                  const gridColumn = isSm && participants.length === 5
                    ? i < 3 ? "span 2" : "span 3"
                    : undefined;
                  return renderParticipantTile(p, i, gridColumn);
                })}
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
                onClick={() => setIsCameraOn((value) => !value)}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14 ${
                  isCameraOn
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isCameraOn}
                aria-label={isCameraOn ? "Apagar cámara" : "Encender cámara"}
              >
                {isCameraOn ? (
                  <Video className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                ) : (
                  <VideoOff className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                )}
              </button>

              {/* Mic */}
              <button
                type="button"
                onClick={() => setIsMicOn((value) => !value)}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:h-14 sm:w-14 ${
                  isMicOn
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                aria-pressed={isMicOn}
                aria-label={isMicOn ? "Silenciar micrófono" : "Activar micrófono"}
              >
                {isMicOn ? (
                  <Mic className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                ) : (
                  <MicOff className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                )}
              </button>

              {/* Share screen */}
              <button
                type="button"
                onClick={() => setIsScreenSharing((value) => !value)}
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
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white sm:h-6 sm:w-6 sm:text-sm">
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
              {renderChatContent()}
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
            onClick={() => setIsChatOpen((value) => !value)}
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
                {renderChatContent()}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
