import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "@/shared/components/ui/toast";

export function useMedia(
  localStreamRef: React.MutableRefObject<MediaStream | null>,
  getPeerConnections: () => Map<string, RTCPeerConnection>,
  isMicOn: boolean,
  isCameraOn: boolean,
  setIsCameraOn?: (on: boolean) => void
) {
  const wasCameraOnRef = useRef(false);
  const stoppingProgrammaticallyRef = useRef(false);
  const [mediaPerms, setMediaPerms] = useState<{
    audio: "prompt" | "granted" | "denied" | "unavailable" | "error";
    video: "prompt" | "granted" | "denied" | "unavailable" | "error";
  }>({ audio: "prompt", video: "prompt" });

  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [localAudioTrackId, setLocalAudioTrackId] = useState<string>("");
  const [localVideoTrackId, setLocalVideoTrackId] = useState<string>("");
  const [mediaInitStatus, setMediaInitStatus] = useState<"idle" | "initializing" | "ready" | "error">("idle");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

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
        const constraints = kind === "audio"
          ? { audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true }
          : { video: { 
              deviceId: selectedVideoId ? { exact: selectedVideoId } : undefined,
              width: { ideal: 1280 }, 
              height: { ideal: 720 }, 
              frameRate: { ideal: 30 }, 
              facingMode: "user" 
            } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Detect actual device ID in use
        const tracks = stream.getTracks();
        if (tracks.length > 0) {
          const actualId = tracks[0].getSettings().deviceId;
          if (actualId) {
            if (kind === "audio") setSelectedAudioId(actualId);
            else setSelectedVideoId(actualId);
          }
          if (kind === "audio") setLocalAudioTrackId(tracks[0].id);
          else setLocalVideoTrackId(tracks[0].id);
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
          } else if (err.name === "NotReadableError") {
            setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
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

  const retryMedia = useCallback(async (kind: "audio" | "video", specificDeviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaPerms((prev) => ({ ...prev, [kind]: "unavailable" }));
      return;
    }

    const devId = specificDeviceId || (kind === "audio" ? selectedAudioId : selectedVideoId);
    const constraints = kind === "audio"
      ? { audio: devId ? { deviceId: { exact: devId } } : true }
      : { video: { 
          deviceId: devId ? { exact: devId } : undefined,
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          frameRate: { ideal: 30 } 
        } };

    const oldTracks = localStreamRef.current?.getTracks().filter((t) => t.kind === kind) ?? [];
    oldTracks.forEach((t) => {
      t.stop();
      localStreamRef.current?.removeTrack(t);
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const tracks = stream.getTracks();
      if (tracks.length > 0) {
        const actualId = tracks[0].getSettings().deviceId;
        if (actualId) {
          if (kind === "audio") setSelectedAudioId(actualId);
          else setSelectedVideoId(actualId);
        }
        if (kind === "audio") setLocalAudioTrackId(tracks[0].id);
        else setLocalVideoTrackId(tracks[0].id);
      }

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
        } else if (err.name === "NotReadableError") {
          setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
        } else {
          setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
        }
      } else {
        setMediaPerms((prev) => ({ ...prev, [kind]: "error" }));
      }
    }
  }, [isMicOn, isCameraOn, selectedAudioId, selectedVideoId]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const peerConnections = getPeerConnections();
    peerConnections.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
        if (sender) {
          if (sender.track !== track) {
            console.log(`[WebRTC] Reemplazando track de ${track.kind} en PeerConnection existente`);
            sender.replaceTrack(track).catch((err) =>
              console.warn(`[WebRTC] Error al reemplazar track de ${track.kind} en WebRTC:`, err)
            );
          }
        } else {
          console.log(`[WebRTC] Agregando nuevo track de ${track.kind} a PeerConnection existente`);
          pc.addTrack(track, stream);
        }
      });
    });
  }, [localAudioTrackId, localVideoTrackId, getPeerConnections]);

  const stopScreenCapture = useCallback(async () => {
    const stream = screenStreamRef.current;
    if (stream) {
      console.log("[useMedia] Deteniendo captura de pantalla:", stream.id);
      stoppingProgrammaticallyRef.current = true;
      stream.getTracks().forEach((track) => track.stop());
      stoppingProgrammaticallyRef.current = false;

      // Remover pistas de pantalla de localStreamRef
      const screenTracks = localStreamRef.current?.getVideoTracks() ?? [];
      screenTracks.forEach((t) => {
        localStreamRef.current?.removeTrack(t);
      });

      screenStreamRef.current = null;
      setScreenStream(null);

      // Restaurar el flujo original de la cámara si estaba encendida originalmente
      if (wasCameraOnRef.current) {
        try {
          await retryMedia("video");
          if (setIsCameraOn) {
            setIsCameraOn(true);
          }
        } catch (err) {
          console.warn("No se pudo restaurar la cámara:", err);
        }
        wasCameraOnRef.current = false;
      }
    }
  }, [retryMedia, setIsCameraOn]);

  const startScreenCapture = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showToast.error("Compartir pantalla no es compatible con este navegador.");
      throw new Error("Screen capture not supported");
    }
    try {
      console.log("[useMedia] Solicitando captura de pantalla/ventana/pestaña...");

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      console.log("[useMedia] Captura de pantalla obtenida con éxito:", stream.id);

      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) {
        throw new Error("No video track found in screen stream");
      }

      // Guardar el estado actual de la cámara antes de apagarla para compartir pantalla
      wasCameraOnRef.current = isCameraOn;

      // Detener y remover pistas de video locales anteriores
      const oldTracks = localStreamRef.current?.getVideoTracks() ?? [];
      oldTracks.forEach((t) => {
        t.stop();
        localStreamRef.current?.removeTrack(t);
      });

      // Agregar pista de pantalla al localStreamRef
      if (localStreamRef.current) {
        localStreamRef.current.addTrack(screenTrack);
      } else {
        localStreamRef.current = stream;
      }

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setLocalVideoTrackId(screenTrack.id);

      // Apagar la cámara DESPUÉS de que el screen share está listo
      if (isCameraOn && setIsCameraOn) {
        setIsCameraOn(false);
      }

      // Escuchar cuando el usuario deje de compartir desde la barra flotante nativa del navegador
      screenTrack.onended = () => {
        if (stoppingProgrammaticallyRef.current) return;
        showToast.info("Dejaste de compartir pantalla.");
        stopScreenCapture();
      };

      return stream;
    } catch (err) {
      console.error("[useMedia] Error al capturar pantalla:", err);
      wasCameraOnRef.current = false;
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          showToast.error("Permiso para compartir pantalla denegado.");
        } else if (err.name === "AbortError") {
          // Usuario canceló el selector — no mostrar error
        } else if (err.name === "NotReadableError") {
          showToast.error("No se pudo acceder a la pantalla. Verifica que no esté siendo usada por otra aplicación.");
        } else if (err.name === "NotSupportedError" || err.name === "OverconstrainedError") {
          showToast.error("La pantalla seleccionada no es compatible con los requisitos de la sala.");
        } else {
          showToast.error("Ocurrió un error inesperado al compartir pantalla. Intenta de nuevo.");
        }
      } else {
        showToast.error("Ocurrió un error inesperado al compartir pantalla. Intenta de nuevo.");
      }
      throw err;
    }
  }, [retryMedia, stopScreenCapture, isCameraOn, setIsCameraOn]);

  return { 
    localStreamRef, 
    mediaPerms, 
    mediaInitStatus, 
    retryMedia,
    selectedAudioId,
    setSelectedAudioId,
    selectedVideoId,
    setSelectedVideoId,
    localAudioTrackId,
    localVideoTrackId,
    screenStream,
    isScreenSharing: !!screenStream,
    startScreenCapture,
    stopScreenCapture
  };
}
