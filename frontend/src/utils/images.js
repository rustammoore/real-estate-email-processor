// Utilities for working with the images field across the app

/**
 * Normalize various backend representations of images into a clean string[]
 * Accepts:
 * - stringified JSON array
 * - array of strings
 * - array with one JSON string element
 * Returns a filtered array of non-empty strings
 */
export function normalizeImages(value) {
  try {
    if (!value) return [];

    // Already an array
    if (Array.isArray(value)) {
      if (
        value.length === 1 &&
        typeof value[0] === 'string' &&
        value[0].trim().startsWith('[')
      ) {
        const parsed = JSON.parse(value[0]);
        return Array.isArray(parsed)
          ? parsed.filter((s) => typeof s === 'string' && s.trim() !== '')
          : [];
      }
      return value.filter((s) => typeof s === 'string' && s.trim() !== '');
    }

    // String values: try parsing JSON if it looks like JSON
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
          ? parsed.filter((s) => typeof s === 'string' && s.trim() !== '')
          : [];
      }
      // Fallback: treat as a single URL string
      return trimmed ? [trimmed] : [];
    }

    return [];
  } catch (e) {
    return [];
  }
}

/** Remove empty strings and trim all URLs */
export function sanitizeImages(images) {
  return (Array.isArray(images) ? images : [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s) => s !== '');
}

/** Load a File into an HTMLImageElement */
export function loadFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = reader.result;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/** Draw an image onto a canvas resized to maxWidth/maxHeight while preserving aspect ratio */
export function drawToCanvas(image, maxWidth = 1600, maxHeight = 1600) {
  const { width, height } = image;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  const targetWidth = Math.round(width * ratio);
  const targetHeight = Math.round(height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/** Convert a canvas to Blob */
export function canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.82) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, mimeType, quality);
  });
}

/** Convert a Blob to a data URL string */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}

/** Optimize an image file client-side; returns { blob, dataUrl, width, height } */
export async function optimizeImageFile(
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.82, mimeType = 'image/jpeg' } = {}
) {
  const img = await loadFileAsImage(file);
  const canvas = drawToCanvas(img, maxWidth, maxHeight);
  const blob = await canvasToBlob(canvas, mimeType, quality);
  const dataUrl = await blobToDataUrl(blob);
  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}


