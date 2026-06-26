export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export interface RoomParticipant {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  avatar?: string;
  isHost?: boolean;
  isSpeaking?: boolean;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  screenSharing?: boolean;
  socketId?: string;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderUid: string;
  senderName: string;
  senderPhotoURL?: string;
  message: string;
  createdAt?: string;
}

export type ChatStatus = "loading" | "empty" | "error" | "success";

export type ChatHistoryPayload = {
  roomId?: string;
  messages?: NewMessagePayload[];
};

export type ChatHistoryErrorPayload = {
  roomId?: string;
  message?: string;
};

export type ChatHistoryResponse = NewMessagePayload[] | ChatHistoryPayload;

export function extractHistoryMessages(payload: ChatHistoryResponse): NewMessagePayload[] {
  if (Array.isArray(payload)) return payload;

  return payload.messages || [];
}

export type ApiError = Error & {
  code?: string;
  status?: number;
};

export type PresenceUser = {
  uid?: string;
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  picture?: string;
  avatar?: string;
};

export type PresencePayload = {
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

export type NewMessagePayload = {
  id?: string;
  uid?: string;
  senderUid?: string;
  senderUsername?: string;
  username?: string;
  senderName?: string;
  senderPhotoURL?: string;
  photoURL?: string;
  picture?: string;
  avatar?: string;
  content?: string;
  message?: string;
  createdAt?: string;
};

export type UserProfileSummary = {
  uid: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
};

export function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function normalizeUserProfileResponse(
  payload: unknown,
  fallbackUid: string
): UserProfileSummary | null {
  if (!isObject(payload)) return null;

  const possiblePayloads = [
    payload,
    payload.user,
    payload.profile,
    payload.data,
  ];

  for (const item of possiblePayloads) {
    if (!isObject(item)) continue;

    const uid =
      getStringValue(item.uid) ||
      getStringValue(item.id) ||
      getStringValue(item.userId) ||
      fallbackUid;

    const username =
      getStringValue(item.username) ||
      getStringValue(item.name);

    const displayName =
      getStringValue(item.displayName) ||
      getStringValue(item.fullName) ||
      getStringValue(item.name) ||
      username;

    const photoURL =
      getStringValue(item.photoURL) ||
      getStringValue(item.photoUrl) ||
      getStringValue(item.avatarURL) ||
      getStringValue(item.avatarUrl) ||
      getStringValue(item.picture) ||
      getStringValue(item.photo);

    if (username || displayName || photoURL) {
      return {
        uid,
        username,
        displayName,
        photoURL,
      };
    }
  }

  return null;
}

export async function fetchUserProfileSummary(uid: string, token: string) {
  const response = await fetch(`${API_URL}/users/${encodeURIComponent(uid)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el perfil ${uid}`);
  }

  const payload = await response.json();

  return normalizeUserProfileResponse(payload, uid);
}

export function shouldFetchParticipantProfile(participant: RoomParticipant) {
  // El backend realtime puede enviar username como nombre completo.
  // Por eso se intenta cargar una vez el perfil real por uid para priorizar el username guardado.
  return Boolean(participant.uid);
}

export function shouldFetchMessageProfile(message: ChatMessage) {
  // Aunque el mensaje ya tenga senderUsername, puede venir como nombre completo desde Firebase Auth.
  // Se consulta el perfil por uid para mostrar el username real en el chat.
  return Boolean(message.senderUid);
}

export function mergeProfileIntoParticipant(
  participant: RoomParticipant,
  userProfile?: UserProfileSummary
): RoomParticipant {
  if (!userProfile) return participant;

  return {
    ...participant,
    // Siempre se prioriza el username del perfil, porque el backend puede mandar name/displayName.
    username: userProfile.username || participant.username || userProfile.displayName,
    displayName:
      participant.displayName && participant.displayName !== "Usuario conectado"
        ? participant.displayName
        : userProfile.displayName ||
          userProfile.username ||
          participant.displayName,
    photoURL: participant.photoURL || userProfile.photoURL,
  };
}

export function mergeProfileIntoMessage(
  message: ChatMessage,
  userProfile?: UserProfileSummary
): ChatMessage {
  if (!userProfile) return message;

  return {
    ...message,
    // En el chat debe verse el username, no el nombre completo.
    senderName:
      userProfile.username ||
      message.senderName ||
      userProfile.displayName ||
      "Usuario",
    senderPhotoURL: message.senderPhotoURL || userProfile.photoURL,
  };
}

export function mapPayloadToChatMessage(
  msg: NewMessagePayload,
  fallbackRoomId?: string
): ChatMessage | null {
  const messageText = msg.content || msg.message || "";

  if (!messageText.trim()) return null;

  return {
    id: msg.id || crypto.randomUUID(),
    roomId: fallbackRoomId,
    senderUid: msg.senderUid || msg.uid || "",
    senderName:
      msg.senderUsername ||
      msg.username ||
      msg.senderName ||
      "Usuario",
    senderPhotoURL: msg.senderPhotoURL || msg.photoURL || msg.picture || msg.avatar,
    message: messageText,
    createdAt: msg.createdAt || new Date().toISOString(),
  };
}

export function sortMessagesChronologically(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.createdAt || "").getTime();
    const dateB = new Date(b.createdAt || "").getTime();

    return dateA - dateB;
  });
}

export function getRoomErrorMessage(error: unknown) {
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

export function getParticipantName(participant: RoomParticipant) {
  return participant.username || participant.displayName || "Usuario conectado";
}

export function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

export function getParticipantGradient(index: number) {
  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-primary-500 to-purple-500",
  ];

  return gradients[index % gradients.length];
}

export function upsertParticipant(
  participants: RoomParticipant[],
  participant: RoomParticipant
) {
  const key = participant.socketId || participant.uid;

  const exists = participants.some((item) => (item.socketId || item.uid) === key);

  if (exists) {
    return participants.map((item) =>
      (item.socketId || item.uid) === key ? { ...item, ...participant } : item
    );
  }

  return [...participants, participant];
}

export function formatMessageTime(value?: string) {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getArrayFromValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (isObject(value)) {
    return Object.values(value);
  }

  return [];
}

export function getPresenceUsersFromObject(value: unknown): PresenceUser[] {
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

export function extractPresenceUsers(data: unknown): PresenceUser[] {
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

export function getPresenceAction(data: unknown) {
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

export function mapPresenceUserToParticipant(
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
    photoURL: item.photoURL || item.picture || item.avatar,
    isHost: ownerUid ? uid === ownerUid : false,
    cameraEnabled: false,
    microphoneEnabled: false,
    screenSharing: false,
    isSpeaking: false,
  };
}
