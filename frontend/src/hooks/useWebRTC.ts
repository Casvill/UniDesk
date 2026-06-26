import { useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTC(localStreamRef: React.RefObject<MediaStream | null>) {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  async function flushPendingIceCandidates(socketId: string) {
    const pending = pendingIceCandidatesRef.current.get(socketId);
    if (!pending) return;
    const pc = peerConnectionsRef.current.get(socketId);
    if (!pc) return;
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error al agregar ICE candidate pendiente:", err);
      }
    }
    pendingIceCandidatesRef.current.delete(socketId);
  }

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

    const localTracks = localStreamRef.current?.getTracks() ?? [];
    if (localTracks.length === 0) {
      console.log("[WebRTC] sin tracks locales, agregando transceivers recvonly para", socketId);
      pc.addTransceiver("audio", { direction: "recvonly" });
      pc.addTransceiver("video", { direction: "recvonly" });
    } else {
      localTracks.forEach((track) => {
        console.log("[WebRTC] agregando track local", track.kind, "a", socketId);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      const { streams, track } = event;
      console.log("[WebRTC] track remoto de", socketId, "streams:", streams.length, track.kind);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        const oldStream = next.get(socketId);
        
        const newStream = new MediaStream();
        if (oldStream) {
          oldStream.getTracks().forEach((t) => newStream.addTrack(t));
        } else if (streams && streams.length > 0) {
          streams[0].getTracks().forEach((t) => newStream.addTrack(t));
        }
        
        if (!newStream.getTracks().includes(track)) {
          newStream.addTrack(track);
        }
        
        next.set(socketId, newStream);
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
      if (pc.signalingState !== "stable") {
        console.log("[WebRTC] diferir negociación — signalingState:", pc.signalingState);
        return;
      }
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
      if (pc.connectionState === "failed") {
        closePeerConnection(socketId, socket);
      }
    };

    peerConnectionsRef.current.set(socketId, pc);
    return pc;
  }

  function registerWebRTCEventHandlers(socket: Socket, localSocketId: string) {
    socket.on("user-joined", (payload: { socketId: string; user: { uid: string } }) => {
      console.log("[WebRTC] usuario conectado:", payload.socketId, payload.user.uid);
      if (payload.socketId === localSocketId) return;
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
        await flushPendingIceCandidates(payload.from);
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
        await flushPendingIceCandidates(payload.from);
      } catch (err) {
        console.error("Error al procesar answer:", err);
      }
    });

    socket.on("receive-ice-candidate", async (payload: { from: string; candidate: unknown }) => {
      const pc = peerConnectionsRef.current.get(payload.from);
      if (!pc || !pc.remoteDescription) {
        const pending = pendingIceCandidatesRef.current;
        if (!pending.has(payload.from)) {
          pending.set(payload.from, []);
        }
        pending.get(payload.from)!.push(payload.candidate as RTCIceCandidateInit);
        return;
      }
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

    socket.on("signaling-error", (payload: { event: string; reason: string; target?: string }) => {
      console.error("[WebRTC] Error de señalización:", payload);
    });
  }

  return {
    peerConnectionsRef,
    remoteStreams,
    createPeerConnection,
    closePeerConnection,
    registerWebRTCEventHandlers,
  };
}
