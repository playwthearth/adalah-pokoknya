import { Check, Loader2, RotateCw, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLanguage } from "../hooks/useLanguage";
import { clamp } from "../utils/format";

/** Pixel ratio of each frame; `null` is the free box. */
const PRESETS = [
  { id: "free", ratio: null },
  { id: "landscape", ratio: 4 / 3, label: "4:3" },
  { id: "square", ratio: 1, label: "1:1" },
  { id: "portrait", ratio: 3 / 4, label: "3:4" },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

/** Longest side of the decoded working copy. Plenty for a 1600 px export. */
const WORK_MAX = 2400;
/** Longest side of the saved photo, so uploads stay light on phones. */
const EXPORT_MAX = 1600;
const QUALITY = 0.86;
/** Smallest crop box, in screen pixels, that still leaves room for handles. */
const MIN_BOX_PX = 48;
/** How far one arrow key moves or resizes the box. */
const NUDGE_PX = 8;

interface PhotoCropperProps {
  /** A freshly picked file, or the URL of the photo already saved. */
  source: File | string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

/** The crop box, as fractions of the rotated photo's width and height. */
interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

type ResizeHandle = "n" | "s" | "e" | "w" | "nw" | "ne" | "se" | "sw";
type DragHandle = ResizeHandle | "move";

interface Drag {
  pointerId: number;
  handle: DragHandle;
  startX: number;
  startY: number;
  /** The box as it was when the drag began, so deltas stay absolute. */
  box: Crop;
  width: number;
  height: number;
}

const HANDLES: { id: ResizeHandle; spot: string; cursor: string; bar: string }[] = [
  { id: "n", spot: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ns-resize", bar: "h-1 w-5" },
  { id: "s", spot: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "cursor-ns-resize", bar: "h-1 w-5" },
  { id: "e", spot: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize", bar: "h-5 w-1" },
  { id: "w", spot: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize", bar: "h-5 w-1" },
  { id: "nw", spot: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-nwse-resize", bar: "h-2.5 w-2.5" },
  { id: "ne", spot: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "cursor-nesw-resize", bar: "h-2.5 w-2.5" },
  { id: "se", spot: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "cursor-nwse-resize", bar: "h-2.5 w-2.5" },
  { id: "sw", spot: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "cursor-nesw-resize", bar: "h-2.5 w-2.5" },
];

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-[10px] uppercase tracking-[0.18em] transition-colors";

function presetRatio(id: PresetId): number | null {
  return PRESETS.find((item) => item.id === id)?.ratio ?? null;
}

/** The largest box of `ratio` that fits, centred on `center` where possible. */
function fitBox(
  ratio: number | null,
  imageWidth: number,
  imageHeight: number,
  center: { x: number; y: number } = { x: 0.5, y: 0.5 },
): Crop {
  if (!imageWidth || !imageHeight) return { x: 0, y: 0, w: 1, h: 1 };
  let w = 1;
  let h = 1;
  if (ratio !== null) {
    if (imageWidth / imageHeight > ratio) {
      // A wide photo: the height runs out first.
      w = (ratio * imageHeight) / imageWidth;
    } else {
      h = imageWidth / ratio / imageHeight;
    }
  }
  return {
    x: clamp(center.x - w / 2, 0, 1 - w),
    y: clamp(center.y - h / 2, 0, 1 - h),
    w,
    h,
  };
}

/**
 * Moves one edge or corner of the box. Widths and heights are fractions of the
 * photo, so `normRatio` (a pixel ratio expressed in those fractions) is what
 * keeps a preset frame honest on a photo that is not square.
 */
function resizeBox(
  box: Crop,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  normRatio: number | null,
  minW: number,
  minH: number,
): Crop {
  const left = box.x;
  const top = box.y;
  const right = box.x + box.w;
  const bottom = box.y + box.h;
  const hasW = handle.includes("w");
  const hasE = handle.includes("e");
  const hasN = handle.includes("n");
  const hasS = handle.includes("s");
  const horizontal = hasW || hasE;
  const vertical = hasN || hasS;

  let l = hasW ? left + dx : left;
  let r = hasE ? right + dx : right;
  let t = hasN ? top + dy : top;
  let b = hasS ? bottom + dy : bottom;
  if (r < l) [l, r] = [r, l];
  if (b < t) [t, b] = [b, t];

  let w = Math.max(minW, r - l);
  let h = Math.max(minH, b - t);
  const centerX = left + box.w / 2;
  const centerY = top + box.h / 2;

  if (normRatio !== null) {
    if (horizontal && !vertical) {
      h = w / normRatio;
      const room = 2 * Math.min(centerY, 1 - centerY);
      if (h > room) {
        h = room;
        w = h * normRatio;
      }
    } else if (vertical && !horizontal) {
      w = h * normRatio;
      const room = 2 * Math.min(centerX, 1 - centerX);
      if (w > room) {
        w = room;
        h = w / normRatio;
      }
    } else {
      // Corners scale the whole box, by whichever axis the pointer moved most.
      const scaleX = w / box.w;
      const scaleY = h / box.h;
      const scale = Math.abs(scaleX - 1) >= Math.abs(scaleY - 1) ? scaleX : scaleY;
      w = Math.max(minW, box.w * scale);
      h = w / normRatio;
      const roomW = hasW ? right : 1 - left;
      const roomH = hasN ? bottom : 1 - top;
      if (w > roomW) {
        w = roomW;
        h = w / normRatio;
      }
      if (h > roomH) {
        h = roomH;
        w = h * normRatio;
      }
    }
    // A frame must not be smaller than its handles can manage.
    if (w < minW) {
      w = Math.min(minW, 1);
      h = w / normRatio;
    }
    if (h < minH) {
      h = Math.min(minH, 1);
      w = h * normRatio;
    }
  }

  if (w > 1) {
    w = 1;
    if (normRatio !== null) h = Math.min(1, w / normRatio);
  }
  if (h > 1) {
    h = 1;
    if (normRatio !== null) w = Math.min(1, h * normRatio);
  }

  // The edge or corner opposite the handle stays put.
  let x: number;
  if (hasW) x = r - w;
  else if (hasE) x = l;
  else x = centerX - w / 2;

  let y: number;
  if (hasN) y = b - h;
  else if (hasS) y = t;
  else y = centerY - h / 2;

  return { x: clamp(x, 0, 1 - w), y: clamp(y, 0, 1 - h), w, h };
}

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
 * A dependency-free crop frame: the photo is fitted to the stage, and a box on
 * top of it can be moved and resized freely (or held to a preset ratio).
 * Drag with a pointer, or use the arrow keys; Shift and an arrow resize.
 */
export function PhotoCropper({ source, onCancel, onConfirm }: PhotoCropperProps) {
  const { t } = useLanguage();
  const [bitmap, setBitmap] = useState<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState<PresetId>("landscape");
  const [rotation, setRotation] = useState(0);
  /** Null means "fit the current preset", so a new photo or a rotation resets. */
  const [box, setBox] = useState<Crop | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  // Measured as soon as the stage is attached: waiting for the observer alone
  // leaves the crop box blank whenever its first callback is throttled.
  const attachStage = useCallback((node: HTMLDivElement | null) => {
    stageRef.current = node;
    if (!node) return;
    const w = node.clientWidth;
    const h = node.clientHeight;
    setViewport((current) => (current.w === w && current.h === h ? current : { w, h }));
  }, []);

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
    const measure = () => {
      const node = stageRef.current;
      if (!node) return;
      const w = node.clientWidth;
      const h = node.clientHeight;
      setViewport((current) => (current.w === w && current.h === h ? current : { w, h }));
    };
    // The observer handles layout changes; the resize listener covers turning
    // the phone, where a throttled observer callback would leave a stale frame.
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    const node = stageRef.current;
    if (node) observer.observe(node);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
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
  const aspect = presetRatio(preset);

  const crop = useMemo(
    () => box ?? fitBox(aspect, imageWidth, imageHeight),
    [box, aspect, imageWidth, imageHeight],
  );

  /** Preset ratios are pixel ratios; the box is measured in fractions. */
  const normRatio = aspect === null ? null : (aspect * imageHeight) / imageWidth;

  const geometry = useMemo(() => {
    if (!imageWidth || !imageHeight || !viewport.w || !viewport.h) return null;
    const scale = Math.min(viewport.w / imageWidth, viewport.h / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    return { width, height, left: (viewport.w - width) / 2, top: (viewport.h - height) / 2 };
  }, [imageWidth, imageHeight, viewport]);

  const output = useMemo(() => {
    if (!imageWidth || !imageHeight) return null;
    const sw = crop.w * imageWidth;
    const sh = crop.h * imageHeight;
    const scale = Math.min(1, EXPORT_MAX / Math.max(sw, sh));
    return {
      sw,
      sh,
      width: Math.max(1, Math.round(sw * scale)),
      height: Math.max(1, Math.round(sh * scale)),
    };
  }, [crop, imageWidth, imageHeight]);

  const choosePreset = (next: PresetId) => {
    setPreset(next);
    const ratio = presetRatio(next);
    if (ratio === null || !imageWidth || !imageHeight) return;
    // Keep the box where it is, then grow it to the largest frame that fits.
    setBox(fitBox(ratio, imageWidth, imageHeight, { x: crop.x + crop.w / 2, y: crop.y + crop.h / 2 }));
  };

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, handle: DragHandle) => {
    if (!geometry || !event.isPrimary) return;
    // Without this, a drag can start selecting the controls underneath.
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      box: crop,
      width: geometry.width,
      height: geometry.height,
    };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = (event.clientX - current.startX) / current.width;
    const dy = (event.clientY - current.startY) / current.height;
    if (current.handle === "move") {
      setBox({
        ...current.box,
        x: clamp(current.box.x + dx, 0, 1 - current.box.w),
        y: clamp(current.box.y + dy, 0, 1 - current.box.h),
      });
      return;
    }
    setBox(
      resizeBox(
        current.box,
        current.handle,
        dx,
        dy,
        normRatio,
        Math.min(1, MIN_BOX_PX / current.width),
        Math.min(1, MIN_BOX_PX / current.height),
      ),
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  const onCropKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const stepX = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    const stepY = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if ((!stepX && !stepY) || !geometry) return;
    event.preventDefault();
    const minW = Math.min(1, MIN_BOX_PX / geometry.width);
    const minH = Math.min(1, MIN_BOX_PX / geometry.height);
    const dx = (stepX * NUDGE_PX) / geometry.width;
    const dy = (stepY * NUDGE_PX) / geometry.height;

    if (event.shiftKey) {
      // Always the bottom-right handle: a negative step then shrinks the box
      // from the top-left corner instead of growing it from the bottom-right.
      setBox(resizeBox(crop, "se", dx, dy, normRatio, minW, minH));
      return;
    }
    setBox({
      ...crop,
      x: clamp(crop.x + dx, 0, 1 - crop.w),
      y: clamp(crop.y + dy, 0, 1 - crop.h),
    });
  };

  const confirm = async () => {
    if (!rotated || !geometry || busy || !output) return;
    setBusy(true);
    try {
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
        crop.x * imageWidth,
        crop.y * imageHeight,
        output.sw,
        output.sh,
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

  return (
    <div className="select-none border border-line/80 bg-pale">
      <div
        ref={attachStage}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ height: "clamp(200px, 42vh, 320px)" }}
        className="relative w-full touch-none overflow-hidden bg-scrim/90"
      >
        {previewUrl && geometry ? (
          <>
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
            <div
              role="group"
              tabIndex={0}
              aria-label={t.memories.cropArea}
              aria-describedby="crop-help"
              onPointerDown={(event) => beginDrag(event, "move")}
              onKeyDown={onCropKeyDown}
              style={{
                left: geometry.left + crop.x * geometry.width,
                top: geometry.top + crop.y * geometry.height,
                width: crop.w * geometry.width,
                height: crop.h * geometry.height,
                boxShadow: "0 0 0 9999px rgb(15 27 43 / 0.58)",
              }}
              className="absolute touch-none cursor-move border border-mist/90 outline-none focus-visible:border-2 focus-visible:border-cyan"
            >
              {HANDLES.map((handle) => (
                <span
                  key={handle.id}
                  aria-hidden="true"
                  onPointerDown={(event) => beginDrag(event, handle.id)}
                  className={`absolute flex h-10 w-10 touch-none items-center justify-center ${handle.spot} ${handle.cursor}`}
                >
                  <span className={`border border-mist/90 bg-navy/70 ${handle.bar}`} />
                </span>
              ))}
            </div>
          </>
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
      </div>

      <div className="space-y-3 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choosePreset(item.id)}
              aria-pressed={preset === item.id}
              aria-label={`${t.memories.shape} ${item.ratio === null ? t.memories.freeCrop : item.label}`}
              className={`inline-flex min-h-9 items-center border px-3 font-mono text-[9px] tracking-[0.14em] transition-colors ${
                preset === item.id
                  ? "border-navy bg-navy text-mist"
                  : "border-line text-navy/70 hover:border-navy/40 hover:text-ink"
              }`}
            >
              {item.ratio === null ? t.memories.freeCrop : item.label}
            </button>
          ))}
          <span className="label ml-auto text-[9px] normal-case tracking-[0.08em]">
            {output ? `${output.width} × ${output.height} · JPEG` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRotation((current) => (current + 90) % 360);
              setBox(null);
            }}
            aria-label={t.memories.rotate}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
          >
            <RotateCw size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRotation(0);
              setBox(null);
            }}
            className="inline-flex min-h-9 items-center border border-line px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-navy/70 transition-colors hover:border-navy/40 hover:text-ink"
          >
            {t.memories.resetCrop}
          </button>
        </div>

        <p
          id="crop-help"
          className="label text-[9px] normal-case leading-relaxed tracking-[0.06em]"
        >
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
