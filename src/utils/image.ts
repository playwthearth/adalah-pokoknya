/** Photos attached to a letter stay a comfortable size for a page, not a phone. */
export const MAX_IMAGE_EDGE = 1600;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const QUALITY = 0.82;
/** Pale base, so a transparent PNG does not turn black when flattened. */
const PAPER = "#f2efe6";

/**
 * Downscales a picked photo to a compact JPEG. Camera files are often several
 * thousand pixels wide and many megabytes; a letter only needs a page-sized
 * print. If the browser cannot decode the file, the original is returned and
 * the size check upstream still applies.
 */
export async function compressImage(file: File, maxEdge = MAX_IMAGE_EDGE): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return file;

      context.fillStyle = PAPER;
      context.fillRect(0, 0, width, height);
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", QUALITY),
      );
      if (!blob) return file;
      // A small, already-compressed pick must not grow just by passing through.
      if (blob.size >= file.size) return file;

      return new File([blob], "letter.jpg", { type: "image/jpeg" });
    } finally {
      bitmap.close();
    }
  } catch (failure) {
    console.warn("[letters] photo could not be re-encoded", failure);
    return file;
  }
}

/** Storage extension for an uploaded photo, derived from what the browser says it is. */
export function photoExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^(jpe?g|png|webp|gif|heic|heif)$/.test(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const fromType = file.type.split("/")[1]?.toLowerCase() ?? "jpg";
  return fromType === "jpeg" ? "jpg" : fromType;
}
