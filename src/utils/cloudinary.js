// Cloudinary delivery URL optimization helpers.
// Inserts f_auto,q_auto (images) or f_auto,q_auto,vc_auto (video) right after
// "/upload/" in a Cloudinary delivery URL, so the CDN serves auto-compressed,
// auto-format assets (WebP/AVIF for images, optimal codec for video).
// Non-Cloudinary URLs are returned unchanged.

const CLOUDINARY_HOST = 'res.cloudinary.com';

function insertTransform(url, transform) {
  if (!url || typeof url !== 'string' || !url.includes(CLOUDINARY_HOST)) return url;
  if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url; // already optimized
  return url.replace('/upload/', `/upload/${transform}/`);
}

export function cldImg(url) {
  return insertTransform(url, 'f_auto,q_auto');
}

export function cldVideo(url) {
  return insertTransform(url, 'f_auto,q_auto,vc_auto');
}
