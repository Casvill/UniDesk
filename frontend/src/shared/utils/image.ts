const MAX_AVATAR_SIZE_MB = 2;
const MAX_AVATAR_DIMENSION = 400;
const JPEG_QUALITY = 0.8;

export class AvatarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarError";
  }
}

export function validateImage(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new AvatarError("Solo se permiten archivos de imagen.");
  }

  const maxBytes = MAX_AVATAR_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new AvatarError(`La imagen no debe superar los ${MAX_AVATAR_SIZE_MB} MB.`);
  }
}

export async function processAvatar(file: File): Promise<Blob> {
  validateImage(file);
  return resizeAndCompress(file);
}

export function fileToObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(url: string): void {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export async function resizeAndCompress(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > MAX_AVATAR_DIMENSION || height > MAX_AVATAR_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_AVATAR_DIMENSION);
          width = MAX_AVATAR_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_AVATAR_DIMENSION);
          height = MAX_AVATAR_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new AvatarError("No se pudo procesar la imagen."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new AvatarError("No se pudo comprimir la imagen."));
          }
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new AvatarError("No se pudo leer la imagen."));
    };

    img.src = objectUrl;
  });
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropImage(imageSrc: string, pixelCrop: PixelCrop): Promise<Blob> {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new AvatarError("No se pudo recortar la imagen."));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new AvatarError("No se pudo generar la imagen recortada."));
          }
        },
        "image/jpeg",
        0.95,
      );
    };

    image.onerror = () => reject(new AvatarError("No se pudo cargar la imagen para recortar."));
    image.src = imageSrc;
  });
}
