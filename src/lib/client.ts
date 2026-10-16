"use client";
import type { Media } from "./league";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith("/api/auth")) {
    window.location.href = "/admin/login?next=" + encodeURIComponent(window.location.pathname);
  }
  if (!res.ok) throw new ApiError(res.status, data.error || "Something went wrong. Try again.");
  return data as T;
}

const MAX_BYTES = 20 * 1024 * 1024;

/** Uploads straight from the browser to Cloudinary using a signature from our server. */
export async function uploadMedia(file: File, folder: string): Promise<NonNullable<Media>> {
  if (file.size > MAX_BYTES) throw new Error("That file is over 20 MB. Pick a smaller one.");
  if (!/^(image|video)\//.test(file.type)) throw new Error("Choose a photo or a video file.");
  const sig = await api<{ timestamp: number; folder: string; signature: string; apiKey: string; cloudName: string }>(
    "/api/admin/uploads/sign", { body: { folder } },
  );
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed. Try again.");
  return { url: data.secure_url, publicId: data.public_id, type: data.resource_type === "video" ? "video" : "image" };
}
