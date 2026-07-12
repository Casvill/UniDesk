import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cropImage, PixelCrop } from "@/shared/utils/image";

interface AvatarCropDialogProps {
  open: boolean;
  imageUrl: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropDialog({ open, imageUrl, onConfirm, onCancel }: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setPixelCrop(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!pixelCrop) return;

    setLoading(true);
    try {
      const blob = await cropImage(imageUrl, pixelCrop);
      onConfirm(blob);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajusta tu foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-black/5">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1 / 1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Ajustar zoom"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !pixelCrop}
            className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Aplicar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
