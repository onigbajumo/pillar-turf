import type { Media as MediaT } from "@/lib/league";

/** Cloudinary delivery URL with automatic format/quality and a width cap. */
export function optimised(url: string, width = 900) {
  return url.includes("/upload/") ? url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`) : url;
}

export function Media({ media, alt, width }: { media: MediaT; alt: string; width?: number }) {
  if (!media) return null;
  if (media.type === "video") return <video controls preload="metadata" playsInline src={media.url} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={optimised(media.url, width)} alt={alt} loading="lazy" />;
}
