import { Check, Loader2, RotateCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { clamp } from "../utils/format";

/** The three frames offered; the first matches the archive cards. */
const SHAPES = [
  { id: "landscape", ratio: 4 / 3, label: "4:3" },
  { id: "square", ratio: 1 / 1, label: "1:1" },
  { id: "portrait", ratio: 3 / 4, label: "3:4" },
] as const;

type ShapeId = (typeof SHAPES)[number]["id"];

/** Longest side of the decoded working copy. Plenty for a 1600 px export. */
const WORK_MAX = 2400;
/** Longest side of the saved photo, so uploads stay light on phones. */
const EXPORT_MAX = 1600;
const QUALITY = 0.86;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface PhotoCropperProps {
  /** A freshly picked file, or the URL of the photo already saved. */
  source: File | string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-[10px] uppercase tracking-[0.18em] transition-colors";

function decode(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("photo could not be decoded"));
    };
    image.src = url;
  });
}

/** Keeps a scaled-down copy in memory so rotating and exporting stay cheap. */
async function toWorkingCanvas(source: File | string): Promise<HTMLCanvasElement> {
  let blob: Blob;
  if (typeof source === "string") {
    const response = await fetch(source);
    if (!response.ok) throw new Error("photo could not be loaded");
    blob = await response.blob();
  } else {
    blob = source;
  }

  const image = await decode(blob);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(1, WORK_MAX / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * A small, dependency-free crop frame: drag the photo to pan, slide to zoom,
 * pick a shape and rotate. The export is re-encoded as a compact JPEG.
 */
export function PhotoCropper({ source, onCancel, onConfirm }: PhotoCropperProps) {
  const { t } = useLanguage();
  const [bitmap, setBitmap] = useState<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [shape, setShape] = useState<ShapeId>("landscape");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Mounted afresh for every photo (see the `key` at the call site).
  useEffect(() => {
    let cancelled = false;
    void toWorkingCanvas(source)
      .then((canvas) => {
        if (!cancelled) setBitmap(canvas);
      })
      .catch((failure) => {
        console.error("[memories] photo could not be prepared", failure);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setViewport({ w: rect.width, h: rect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rotated = useMemo(() => {
    if (!bitmap || rotation % 360 === 0) return bitmap;
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.height;
    canvas.height = bitmap.width;
    const context = canvas.getContext("2d");
    if (!context) return bitmap;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    return canvas;
  }, [bitmap, rotation]);

  const previewUrl = useMemo(
    () => (rotated ? rotated.toDataURL("image/jpeg", 0.82) : null),
    [rotated],
  );

  const imageWidth = rotated?.width ?? 0;
  const imageHeight = rotated?.height ?? 0;

  const geometry = useMemo(() => {
    if (!imageWidth || !imageHeight || !viewport.w || !viewport.h) return null;
    const cover = Math.max(viewport.w / imageWidth, viewport.h / imageHeight);
    const width = imageWidth * cover * zoom;
    const height = imageHeight * cover * zoom;
    const maxX = Math.max(0, (width - viewport.w) / 2);
    const maxY = Math.max(0, (height - viewport.h) / 2);
    const x = clamp(offset.x, -maxX, maxX);
    const y = clamp(offset.y, -maxY, maxY);
    return {
      width,
      height,
      maxX,
      maxY,
      x,
      y,
      left: (viewport.w - width) / 2 + x,
      top: (viewport.h - height) / 2 + y,
    };
  }, [imageWidth, imageHeight, viewport, zoom, offset]);

  const output = useMemo(() => {
    if (!geometry || !imageWidth) return null;
    const sourcePerPixel = imageWidth / geometry.width;
    const cropWidth = Math.min(imageWidth, viewport.w * sourcePerPixel);
    const width = Math.max(1, Math.round(Math.min(EXPORT_MAX, cropWidth)));
    const height = Math.max(1, Math.round(width * (viewport.h / viewport.w)));
    return { width, height };
  }, [geometry, imageWidth, viewport]);

  const changeZoom = (next: number) => {
    const value = clamp(next, MIN_ZOOM, MAX_ZOOM);
    setOffset((current) => ({
      x: current.x * (value / zoom),
      y: current.y * (value / zoom),
    }));
    setZoom(value);
  };

  const changeShape = (next: ShapeId) => {
    setShape(next);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!geometry) return;
    // Without this, the drag can start selecting the controls underneath.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: geometry.x,
      originY: geometry.y,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId || !geometry) return;
    setOffset({
      x: clamp(current.originX + event.clientX - current.startX, -geometry.maxX, geometry.maxX),
      y: clamp(current.originY + event.clientY - current.startY, -geometry.maxY, geometry.maxY),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  const confirm = async () => {
    if (!rotated || !geometry || busy || !output) return;
    setBusy(true);
    try {
      const sourcePerPixel = imageWidth / geometry.width;
      const cropWidth = Math.min(imageWidth, viewport.w * sourcePerPixel);
      const cropHeight = Math.min(imageHeight, viewport.h * sourcePerPixel);
      const sx = clamp(-geometry.left * sourcePerPixel, 0, imageWidth - cropWidth);
      const sy = clamp(-geometry.top * sourcePerPixel, 0, imageHeight - cropHeight);

      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      // Pale base keeps transparent PNGs from turning black when flattened.
      context.fillStyle = "#f2efe6";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingQuality = "high";
      context.drawImage(
        rotated,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const encode = (quality: number) =>
        new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

      let blob = await encode(QUALITY);
      if (!blob) throw new Error("photo could not be encoded");
      // A small, already-compressed pick must not grow just by passing through.
      if (typeof source !== "string" && blob.size > source.size) {
        const lighter = await encode(0.7);
        if (lighter && lighter.size < blob.size) blob = lighter;
      }

      const baseName =
        typeof source === "string" ? "memory" : source.name.replace(/\.[^./\\]+$/, "") || "memory";
      onConfirm(
        new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() }),
      );
    } catch (failure) {
      console.error("[memories] crop failed", failure);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const shapeRatio = SHAPES.find((item) => item.id === shape)?.ratio ?? 4 / 3;

  return (
    <div className="select-none border border-line/80 bg-pale">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ aspectRatio: String(shapeRatio) }}
        className="relative w-full touch-none select-none overflow-hidden bg-scrim/90"
      >
        {previewUrl && geometry ? (
          <img
            src={previewUrl}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: geometry.left,
              top: geometry.top,
              width: geometry.width,
              height: geometry.height,
              maxWidth: "none",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-mist/80">
            {failed ? (
              <span className="label px-4 text-center text-[9px] normal-case tracking-[0.08em]">
                {t.memories.cropError}
              </span>
            ) : (
              <>
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                <span className="label text-[9px]">{t.memories.preparing}</span>
              </>
            )}
          </div>
        )}

        {/* Viewfinder ticks and a quiet third grid, over the crop frame. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
          <span className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
          <span className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
          <span className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
          <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-mist/80" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-mist/80" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-mist/80" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-mist/80" />
        </span>
      </div>

      <div className="space-y-3 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label shrink-0 text-[9px]">{t.memories.zoom}</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label={t.memories.zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="h-11 min-w-0 flex-1 accent-navy"
          />
          <button
            type="button"
            onClick={() => setRotation((current) => (current + 90) % 360)}
            aria-label={t.memories.rotate}
            className="inline-flex h-9 w-9 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
          >
            <RotateCw size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
              setRotation(0);
            }}
            className="inline-flex min-h-9 items-center border border-line px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-navy/70 transition-colors hover:border-navy/40 hover:text-ink"
          >
            {t.memories.resetCrop}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SHAPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeShape(item.id)}
              aria-pressed={shape === item.id}
              aria-label={`${t.memories.shape} ${item.label}`}
              className={`inline-flex min-h-9 items-center border px-3 font-mono text-[9px] tracking-[0.14em] transition-colors ${
                shape === item.id
                  ? "border-navy bg-navy text-mist"
                  : "border-line text-navy/70 hover:border-navy/40 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="label ml-auto text-[9px] normal-case tracking-[0.08em]">
            {output ? `${output.width} × ${output.height} · JPEG` : ""}
          </span>
        </div>

        <p className="label text-[9px] normal-case leading-relaxed tracking-[0.06em]">
          {t.memories.cropHint}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy || !geometry || !output}
            className={`${actionClass} flex-1 border-navy/70 font-mono text-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {busy ? (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            ) : (
              <Check size={12} strokeWidth={1.5} aria-hidden="true" />
            )}
            {t.memories.usePhoto}
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t.memories.cancel}
            className={`${actionClass} border-line px-3 text-navy/70 hover:border-navy/40 hover:text-ink`}
          >
            <X size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
