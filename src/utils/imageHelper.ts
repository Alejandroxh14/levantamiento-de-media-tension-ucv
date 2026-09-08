/**
 * Image processing utilities for field data capture.
 * Compresses camera and file uploads to crisp, lightweight JPEGs
 * so that multiple high-resolution photos can be saved reliably
 * without exceeding browser storage quotas.
 */

export interface ProcessedPhoto {
  id: string;
  nombre: string;
  dataUrl: string;
  size: number;
  timestamp: number;
  descripcion?: string;
}

export function processAndCompressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<ProcessedPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error leyendo el archivo de imagen'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          if (targetWidth / maxWidth > targetHeight / maxHeight) {
            targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
            targetWidth = maxWidth;
          } else {
            targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
            targetHeight = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original dataUrl if canvas context is unavailable
          resolve({
            id: `foto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            nombre: file.name,
            dataUrl: e.target?.result as string,
            size: file.size,
            timestamp: Date.now(),
          });
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as JPEG with specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate size of base64
        const stringLength = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = Math.round((stringLength * 3) / 4);

        resolve({
          id: `foto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          nombre: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          dataUrl: compressedDataUrl,
          size: sizeInBytes,
          timestamp: Date.now(),
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
