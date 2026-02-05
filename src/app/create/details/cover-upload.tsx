"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  name: string; // form field name: "cover_image_url"
  initialUrl?: string;
};

const ASPECT = 3 / 2;
const OUT_W = 1200;
const OUT_H = 800;
const JPEG_QUALITY = 0.82;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

async function canvasCropResize(imageSrc: string, crop: Area): Promise<Blob> {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, OUT_W, OUT_H);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export default function CoverUpload({ name, initialUrl }: Props) {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [url, setUrl] = useState<string>(initialUrl || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // crop state
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_a: Area, b: Area) => {
    setPixels(b);
  }, []);

  async function onPick(file: File | null) {
    setErr("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErr("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Max file size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function onUsePhoto() {
    if (!pixels) return;
    setBusy(true);
    setErr("");

    try {
      const blob = await canvasCropResize(src, pixels);
      const path = `covers/${crypto.randomUUID()}.jpg`;

      const { error: upErr } = await supabase.storage.from("covers").upload(path, blob, {
        upsert: false,
        contentType: "image/jpeg",
        cacheControl: "3600",
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("No public URL returned");

      setUrl(data.publicUrl);
      setOpen(false);
      setSrc("");
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="c-stack" style={{ gap: "var(--space-2)" }}>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="c-mediaPreview">
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : null}

      <div className="c-actions">
        <label className="c-btnSecondary" style={{ cursor: busy ? "not-allowed" : "pointer" }}>
          {busy ? "Uploading…" : url ? "Change cover" : "Upload cover"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={busy}
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />
        </label>

        {url ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setUrl("")}
            className="c-btnLink c-btnDanger"
          >
            Remove
          </button>
        ) : null}
      </div>

      {err ? <div className="c-error">{err}</div> : null}

      {open ? (
        <div className="c-modalOverlay">
          <div className="c-modal">
            <div className="c-modalBody">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition
              />
            </div>

            <div className="c-modalFooter">
              <button
                type="button"
                className="c-btnGhost"
                onClick={() => {
                  setOpen(false);
                  setSrc("");
                }}
              >
                Cancel
              </button>

              <button type="button" className="c-btnPrimary" onClick={onUsePhoto} disabled={busy}>
                {busy ? "Uploading…" : "Use cover"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
