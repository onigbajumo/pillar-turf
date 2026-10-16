import "server-only";
import { v2 as cloudinary } from "cloudinary";

export function cloudinaryReady() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Signature for a direct browser upload, so large photos and videos never pass through our server. */
export function signUpload(subfolder: string) {
  configure();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = [process.env.CLOUDINARY_FOLDER || "pillars-turf", subfolder].filter(Boolean).join("/");
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET!);
  return { timestamp, folder, signature, apiKey: process.env.CLOUDINARY_API_KEY!, cloudName: process.env.CLOUDINARY_CLOUD_NAME! };
}

/** Best-effort delete of media that is no longer referenced. */
export async function destroyMedia(m: { publicId?: string | null; type?: string | null } | null | undefined) {
  if (!m?.publicId || !cloudinaryReady()) return;
  configure();
  try {
    await cloudinary.uploader.destroy(m.publicId, { resource_type: m.type === "video" ? "video" : "image" });
  } catch (e) {
    console.warn("Cloudinary delete failed", m.publicId, e);
  }
}
