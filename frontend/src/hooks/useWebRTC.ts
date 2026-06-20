import { useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTC(localStreamRef: React.RefObject<MediaStream | null>) {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketIdByUidRef = useRef<Map<string, string>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  function closePeerConnection(socketId: string, socket: Socket | null, notifyPeer = true) {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
    if (notifyPeer && socket) {
      socket.emit("peer-closed", { to: socketId });
    }
  }

  function createPeerConnection(socketId: string, socket: Socket): RTCPeerConnection {
    console.log("[WebRTC] crear conexión peer para", socketId);
    const pc = new RTCPeerConnection(RTC_CONFIG);

    localStreamRef.current?.getTracks().forEach((track) => {
      console.log("[WebRTC] agregando track local", track.kind, "a", socketId);
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = ({ streams }) => {
      console.log("[WebRTC] track remoto de", socketId, "streams:", streams.length, streams[0]?.getTracks().map(t => t.kind));
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(socketId, streams[0]);
        return next;
      });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("[WebRTC] ICE candidate de", socketId);
        socket.emit("send-ice-candidate", {
          to: socketId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log("[WebRTC] negociación necesaria para", socketId);
      try {
        await pc.setLocalDescription(await pc.createOffer());
        console.log("[WebRTC] enviando offer a", socketId);
        socket.emit("send-offer", {
          to: socketId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error("Error al crear offer:", err);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] estado de conexión para", socketId, ":", pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        closePeerConnection(socketId, socket);
      }
    };

    peerConnectionsRef.current.set(socketId, pc);
    return pc;
  }

  function registerWebRTCEventHandlers(socket: Socket, currentUserUid: string) {
    socket.on("user-joined", (payload: { socketId: string; user: { uid: string } }) => {
      console.log("[WebRTC] usuario conectado:", payload.socketId, payload.user.uid);
      socketIdByUidRef.current.set(payload.user.uid, payload.socketId);
      if (payload.user.uid === currentUserUid) return;
      if (peerConnectionsRef.current.has(payload.socketId)) return;
      createPeerConnection(payload.socketId, socket);
    });

    socket.on("user-left", (payload: { socketId: string }) => {
      closePeerConnection(payload.socketId, socket);
    });

    socket.on("receive-offer", async (payload: { from: string; sdp: unknown }) => {
      console.log("[WebRTC] offer recibido de", payload.from);
      let pc = peerConnectionsRef.current.get(payload.from);
      if (!pc) {
        pc = createPeerConnection(payload.from, socket);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("send-answer", {
          to: payload.from,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error("Error al procesar offer:", err);
      }
    });

    socket.on("receive-answer", async (payload: { from: string; sdp: unknown }) => {
      console.log("[WebRTC] answer recibido de", payload.from);
      const pc = peerConnectionsRef.current.get(payload.from);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit));
      } catch (err) {
        console.error("Error al procesar answer:", err);
      }
    });

    socket.on("receive-ice-candidate", async (payload: { from: string; candidate: unknown }) => {
      const pc = peerConnectionsRef.current.get(payload.from);
      if (!pc || !pc.remoteDescription) return;
      console.log("[WebRTC] ICE candidate recibido de", payload.from);
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate as RTCIceCandidateInit));
      } catch (err) {
        console.error("Error al agregar ICE candidate:", err);
      }
    });

    socket.on("peer-disconnected", (payload: { socketId: string }) => {
      console.log("[WebRTC] peer desconectado:", payload.socketId);
      closePeerConnection(payload.socketId, null, false);
    });
  }

  return {
    peerConnectionsRef,
    socketIdByUidRef,
    remoteStreams,
    createPeerConnection,
    closePeerConnection,
    registerWebRTCEventHandlers,
  };
}
