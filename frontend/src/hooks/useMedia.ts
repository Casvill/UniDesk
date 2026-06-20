import { useCallback, useEffect, useRef, useState } from "react";

export function useMedia(
  localStreamRef: React.MutableRefObject<MediaStream | null>,
  getPeerConnections: () => Map<string, RTCPeerConnection>,
  isMicOn: boolean,
  isCameraOn: boolean
) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [mediaPerms, setMediaPerms] = useState<{
    audio: "prompt" | "granted" | "denied" | "unavailable" | "error";
    video: "prompt" | "granted" | "denied" | "unavailable" | "error";
  }>({ audio: "prompt", video: "prompt" });

  const [mediaInitStatus, setMediaInitStatus] = useState<"idle" | "initializing" | "ready" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    let audioDone = false;
    let videoDone = false;

    setMediaInitStatus("initializing");

    async function requestDevice(kind: "audio" | "video") {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaPerms((prev) => ({ ...prev, [kind]: "unavailable" }));
        if (kind === "audio") audioDone = true;
        else videoDone = true;
        return;
      }
      try {
        const constraints = kind === "audio" ? { audio: true } : { video: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (localStreamRef.current) {
          stream.getTracks().forEach((t) => localStreamRef.current!.addTrack(t));
        } else {
          localStreamRef.current = stream;
        }
        const shouldEnable = kind === "audio" ? isMicOn : isCameraOn;
        stream.getTracks().forEach((t) => { t.enabled = shouldEnable; });
        setMediaPerms((prev) => ({ ...prev, [kind]: "granted" }));
        if (kind === "audio") audioDone = true;
        else videoDone = true;
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            setMediaPerms((prev) => ({ ...prev, [kind]: "denied" }));
          } else if (err.name === "NotFoundError") {
            setMediaPerms((prev) => ({ ...prev, [kind]: "unavailable" }));
          } else {
            setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
          }
        } else {
          setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
        }
        if (kind === "audio") audioDone = true;
        else videoDone = true;
      }
    }

    async function init() {
      await requestDevice("audio");
      if (cancelled) return;
      await requestDevice("video");
      if (cancelled) return;
      setMediaInitStatus(audioDone && videoDone ? "ready" : "error");
    }

    init();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  const retryMedia = useCallback(async (kind: "audio" | "video") => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaPerms((prev) => ({ ...prev, [kind]: "unavailable" }));
      return;
    }

    const constraints = kind === "audio" ? { audio: true } : { video: true };

    const oldTracks = localStreamRef.current?.getTracks().filter((t) => t.kind === kind) ?? [];
    oldTracks.forEach((t) => {
      t.stop();
      localStreamRef.current?.removeTrack(t);
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (localStreamRef.current) {
        stream.getTracks().forEach((t) => localStreamRef.current!.addTrack(t));
      } else {
        localStreamRef.current = stream;
      }
      const shouldEnable = kind === "audio" ? isMicOn : isCameraOn;
      stream.getTracks().forEach((t) => { t.enabled = shouldEnable; });
      setMediaPerms((prev) => ({ ...prev, [kind]: "granted" }));
      setMediaInitStatus("ready");
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setMediaPerms((prev) => ({ ...prev, [kind]: "denied" }));
        } else if (err.name === "NotFoundError") {
          setMediaPerms((prev) => ({ ...prev, [kind]: "unavailable" }));
        } else {
          setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
        }
      } else {
        setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
      }
    }
  }, [isMicOn, isCameraOn]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const peerConnections = getPeerConnections();
    peerConnections.forEach((pc) => {
      const kinds = pc.getSenders().map((s) => s.track?.kind);
      stream.getTracks().forEach((track) => {
        if (!kinds.includes(track.kind)) {
          pc.addTrack(track, stream);
        }
      });
    });
  }, [mediaPerms, getPeerConnections]);

  return { localStreamRef, localVideoRef, mediaPerms, mediaInitStatus, retryMedia };
}
