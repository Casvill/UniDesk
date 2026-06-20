import { useCallback, useState } from "react";
import type { Socket } from "socket.io-client";
import type { ChatMessage, ChatStatus, NewMessagePayload, ChatHistoryResponse, ChatHistoryErrorPayload, RoomParticipant, UserProfileSummary } from "@/utils/room";
import { extractHistoryMessages, mapPayloadToChatMessage, sortMessagesChronologically, mergeProfileIntoMessage } from "@/utils/room";

interface FirebaseUser {
  uid: string;
  email?: string | null;
  getIdToken: () => Promise<string>;
}

export function useChat(
  userProfilesCacheRef: React.MutableRefObject<Map<string, UserProfileSummary>>
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("loading");
  const [chatHistoryError, setChatHistoryError] = useState("");
  const [message, setMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const registerChatEventHandlers = useCallback(
    (
      socket: Socket,
      roomId: string,
      isChatOpenRef: React.MutableRefObject<boolean>,
      onError?: (error: string) => void
    ) => {
      const handleChatHistory = (payload: ChatHistoryResponse) => {
        const history = extractHistoryMessages(payload)
          .map((msg) =>
            mapPayloadToChatMessage(
              msg,
              Array.isArray(payload) ? roomId : payload.roomId || roomId
            )
          )
          .filter(Boolean)
          .map((msg) => {
            const m = msg as ChatMessage;
            const cachedProfile = userProfilesCacheRef.current.get(
              m.senderUid
            );
            return mergeProfileIntoMessage(m, cachedProfile);
          }) as ChatMessage[];

        const orderedHistory = sortMessagesChronologically(history);

        setChatMessages(orderedHistory);
        setChatHistoryError("");
        setChatStatus(orderedHistory.length === 0 ? "empty" : "success");
      };

      socket.on("chat-history", handleChatHistory);
      socket.on("chat-history-success", handleChatHistory);

      socket.on("chat-history-error", (payload: ChatHistoryErrorPayload) => {
        setChatHistoryError(
          payload?.message || "No se pudo cargar el historial del chat."
        );
        setChatStatus("error");
      });

      socket.on("error", (payload: { message?: string }) => {
        const errorMessage =
          payload?.message || "Ocurrió un error en la sala.";

        onError?.(errorMessage);

        setChatStatus((prev) => {
          if (prev !== "loading") return prev;
          setChatHistoryError(errorMessage);
          return "error";
        });
      });

      socket.on("send-message-error", (payload: { message?: string }) => {
        onError?.(payload?.message || "No se pudo enviar el mensaje.");
      });

      socket.on("new-message", (msg: NewMessagePayload) => {
        const mappedMessage = mapPayloadToChatMessage(msg, roomId);

        if (!mappedMessage) return;

        const cachedProfile = userProfilesCacheRef.current.get(
          mappedMessage.senderUid
        );
        const newMessage = mergeProfileIntoMessage(mappedMessage, cachedProfile);

        setChatMessages((currentMessages) => {
          const exists = currentMessages.some(
            (item) => item.id === newMessage.id
          );
          if (exists) return currentMessages;
          return sortMessagesChronologically([...currentMessages, newMessage]);
        });

        setChatStatus("success");

        if (!isChatOpenRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      });
    },
    [userProfilesCacheRef]
  );

  const handleSendMessage = useCallback(
    (
      event: React.FormEvent,
      socket: Socket,
      isConnected: boolean,
      user: FirebaseUser | null,
      roomId: string | undefined,
      onError?: (error: string) => void
    ) => {
      event.preventDefault();

      const cleanMessage = message.trim();

      if (!cleanMessage || !user || !roomId) return;

      if (!socket || !isConnected) {
        onError?.(
          "No estás conectado a la sala en tiempo real. Intenta nuevamente."
        );
        return;
      }

      socket.emit("send-message", {
        content: cleanMessage,
      });

      setMessage("");
    },
    [message]
  );

  const handleRetryChatHistory = useCallback(
    (socket: Socket, roomId: string) => {
      setChatStatus("loading");
      setChatHistoryError("");

      socket.emit("join-room", {
        roomId,
      });
    },
    []
  );

  const getMessageUsername = useCallback(
    (
      msg: ChatMessage,
      participants: RoomParticipant[],
      user: FirebaseUser | null,
      currentUsername: string
    ): string => {
      const participant = participants.find((p) => p.uid === msg.senderUid);
      const cachedProfile = msg.senderUid
        ? userProfilesCacheRef.current.get(msg.senderUid)
        : undefined;

      if (msg.senderUid === user?.uid || msg.senderName === currentUsername) {
        return currentUsername;
      }

      return (
        cachedProfile?.username ||
        participant?.username ||
        msg.senderName ||
        "Usuario"
      );
    },
    [userProfilesCacheRef]
  );

  const getMessageAvatar = useCallback(
    (
      msg: ChatMessage,
      participants: RoomParticipant[],
      user: FirebaseUser | null,
      currentUsername: string,
      profile: { photoURL?: string } | null
    ): string | undefined => {
      const participant = participants.find((p) => p.uid === msg.senderUid);

      if (msg.senderUid === user?.uid || msg.senderName === currentUsername) {
        return profile?.photoURL;
      }

      return msg.senderPhotoURL || participant?.photoURL;
    },
    []
  );

  return {
    chatMessages,
    chatStatus,
    chatHistoryError,
    message,
    unreadCount,
    setChatMessages,
    setChatStatus,
    setChatHistoryError,
    setMessage,
    setUnreadCount,
    registerChatEventHandlers,
    handleSendMessage,
    handleRetryChatHistory,
    getMessageUsername,
    getMessageAvatar,
  };
}
