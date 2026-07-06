import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MessageSquare,
  Monitor,
  User as UserIcon,
  Users,
  Video,
  Wifi,
  WifiOff,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { api, type Room } from "@/services/api";
import { useAutoTour } from "@/hooks/useAutoTour";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

interface RoomParticipant {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  isHost?: boolean;
  joinedAt?: string;
}

function getRoomErrorMessage(error: unknown) {
  const apiError = error as Error & {
    code?: string;
    status?: number;
  };

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
  return (
    participant.username ||
    participant.displayName ||
    "Usuario conectado"
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function formatRoomDate(room: Room | null) {
  if (!room?.createdAt?.seconds) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(room.createdAt.seconds * 1000));
}

export function JoinRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, profile } = useAuth();

  const socketRef = useRef<Socket | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [joinCamera, setJoinCamera] = useState(false);
  const [joinMicrophone, setJoinMicrophone] = useState(true);

  // Recorrido automático: encabezado → información de la sala → participantes.
  const tourStep = useAutoTour({
    enabled: !isLoadingRoom && !roomError && Boolean(room),
  });

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
        setRoomError(
          "No pudimos validar tu sesión. Inicia sesión nuevamente."
        );
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
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  const handleJoinRoom = async () => {
    if (!roomId || !room) {
      setJoinError("No pudimos identificar la sala.");
      return;
    }

    if (!user) {
      setJoinError(
        "No pudimos validar tu sesión. Inicia sesión nuevamente."
      );
      return;
    }

    try {
      setIsJoining(true);
      setJoinError("");

      const token = await user.getIdToken();

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ["websocket"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setIsJoining(false);

        socket.emit("join-room", {
          roomId,
          uid: user.uid,
          username: currentUsername,
          cameraEnabled: joinCamera,
          microphoneEnabled: joinMicrophone,
        });

        if (user.uid) {
          setParticipants((currentParticipants) =>
            upsertParticipant(currentParticipants, {
              uid: user.uid,
              username: currentUsername,
              displayName: currentUserName,
              photoURL: profile?.photoURL,
              isHost: room.ownerUid === user.uid,
            })
          );
        }
      });

      socket.on("connect_error", () => {
        setIsConnected(false);
        setIsJoining(false);
        setJoinError(
          "No pudimos conectar con la sala en tiempo real. Intenta nuevamente."
        );
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      const handleParticipantsUpdate = (currentParticipants: RoomParticipant[]) => {
        if (!Array.isArray(currentParticipants)) return;

        setParticipants((previousParticipants) =>
          currentParticipants.map((participant) => {
            const previousParticipant = previousParticipants.find(
              (item) => item.uid === participant.uid
            );
            const isCurrentUser = participant.uid === user.uid;

            return {
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
                previousParticipant?.photoURL ||
                (isCurrentUser ? profile?.photoURL : undefined),
              isHost: participant.uid === room.ownerUid,
            };
          })
        );
      };

      socket.on("room-participants-update", handleParticipantsUpdate);
      socket.on("room:participants", handleParticipantsUpdate);

      socket.on("room:participant-joined", (participant: RoomParticipant) => {
        if (!participant?.uid) return;

        setParticipants((currentParticipants) => {
          const previousParticipant = currentParticipants.find(
            (item) => item.uid === participant.uid
          );
          const isCurrentUser = participant.uid === user.uid;

          return upsertParticipant(currentParticipants, {
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
              previousParticipant?.photoURL ||
              (isCurrentUser ? profile?.photoURL : undefined),
            isHost: participant.uid === room.ownerUid,
          });
        });
      });

      socket.on(
        "room:participant-left",
        (participant: { uid?: string }) => {
          if (!participant?.uid) return;

          setParticipants((currentParticipants) =>
            currentParticipants.filter((item) => item.uid !== participant.uid)
          );
        }
      );

      socket.on("room:error", (message: string) => {
        setJoinError(
          message || "Ocurrió un error al ingresar a la sala."
        );
      });
    } catch (error) {
      console.error("Error al ingresar a la sala:", error);
      setJoinError(
        "No pudimos ingresar a la sala. Intenta nuevamente."
      );
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room", { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
  };

  if (isLoadingRoom) {
    return (
      <section
        className="flex flex-col items-center justify-center py-20 text-center"
        role="status"
        aria-live="polite"
        aria-label="Cargando información de la sala"
      >
        <Loader2
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="mt-4 text-gray-600">
          Cargando información de la sala...
        </p>
      </section>
    );
  }

  if (roomError) {
    return (
      <section className="max-w-[700px] mx-auto">
        <button
          type="button"
          onClick={() => navigate("/rooms")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded px-1 transition cursor-pointer"
          aria-label="Volver al listado de salas"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a salas
        </button>

        <div
          className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl"
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
            className="mt-6 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            Volver al dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="max-w-[1000px] mx-auto"
      aria-labelledby="room-title"
    >
      <button
        type="button"
        onClick={() => navigate("/rooms")}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded px-1 transition cursor-pointer"
        aria-label="Volver al listado de salas"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a salas
      </button>

      <div
        ref={tourStep(0)}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between outline-none"
        aria-label={`Estás en la vista previa de la sala ${room?.name || ""}. Aquí puedes revisar la información de la sala, configurar tu cámara y micrófono, y entrar cuando estés listo.`}
      >
        <div>
          <h1
            id="room-title"
            className="text-2xl sm:text-3xl font-bold text-gray-900"
          >
            {room?.name}
          </h1>
          <p className="mt-2 text-gray-600">
            Sala de estudio colaborativa en tiempo real.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            isConnected
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" aria-hidden="true" />
              Conectado en tiempo real
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" aria-hidden="true" />
              Sin conexión a la sala
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div
          ref={tourStep(1)}
          role="group"
          aria-label="Información de la sala: ID, anfitrión, participantes conectados, fecha de creación, herramientas disponibles, configuración de cámara y micrófono, y los botones para entrar a la sala o volver al dashboard."
          className="rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden outline-none"
        >
          <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Información de la sala
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-gray-600">
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">ID de sala</span>
                  </div>
                  <p className="break-all font-semibold text-gray-900">
                    {room?.id}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-gray-600">
                    <UserIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">Anfitrión</span>
                  </div>
                  <p className="break-all font-semibold text-gray-900">
                    {room?.ownerUid}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">Participantes</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {participants.length} conectados
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">Creada</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatRoomDate(room)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                Herramientas disponibles
              </h2>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <MessageSquare
                    className="h-5 w-5 text-gray-600"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-gray-900">
                    Chat
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <Video
                    className="h-5 w-5 text-gray-600"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-gray-900">
                    Audio/video
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <Monitor
                    className="h-5 w-5 text-gray-600"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-gray-900">
                    Pantalla
                  </span>
                </div>
              </div>
            </div>

            {!isConnected && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                  Configuración antes de entrar
                </h2>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={joinCamera}
                      onChange={(event) =>
                        setJoinCamera(event.target.checked)
                      }
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-gray-700">
                      Entrar con cámara activada
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={joinMicrophone}
                      onChange={(event) =>
                        setJoinMicrophone(event.target.checked)
                      }
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-gray-700">
                      Entrar con micrófono activado
                    </span>
                  </label>
                </div>
              </div>
            )}

            {joinError && (
              <p
                className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
                aria-live="assertive"
              >
                {joinError}
              </p>
            )}

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  aria-busy={isJoining}
                  className="w-full sm:flex-1 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-wait disabled:opacity-80 cursor-pointer"
                >
                  {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Entrando...
                    </span>
                  ) : (
                    "Entrar a la sala"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="w-full sm:flex-1 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                >
                  Salir de la sala
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/rooms")}
                disabled={isJoining}
                className="w-full sm:flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                Volver al dashboard
              </button>
            </div>
          </div>
        </div>

        <aside
          ref={tourStep(2)}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl outline-none"
          aria-label="Usuarios en sala. Lista de participantes conectados, actualizada en tiempo real."
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2
                id="participants-title"
                className="text-lg font-bold text-gray-900"
              >
                Usuarios en sala
              </h2>
              <p className="text-sm text-gray-500">
                Actualización en tiempo real
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              {participants.length}
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
              <Users
                className="mx-auto h-8 w-8 text-gray-400"
                aria-hidden="true"
              />
              <p className="mt-3 font-semibold text-gray-700">
                Aún no hay usuarios conectados
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Entra a la sala para aparecer como participante.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" aria-live="polite">
              {participants.map((participant) => {
                const participantName = getParticipantName(participant);

                return (
                  <li
                    key={participant.uid}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    {participant.photoURL ? (
                      <img
                        src={participant.photoURL}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                        aria-hidden="true"
                      >
                        {getInitials(participantName)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">
                        {participantName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {participant.isHost ? "Anfitrión" : "Participante"}
                      </p>
                    </div>

                    <span
                      className="h-2.5 w-2.5 rounded-full bg-green-500"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{`${participantName} está conectado`}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}