import { getFileUrl } from './fileUrl';
import { resolveSnapUrl } from './projectSnaps';

export const VARIANT_ORDER = ['THUMB', 'SMALL', 'MEDIUM', 'LARGE', 'HD'];

export const VARIANT_WIDTHS = {
  THUMB: 150,
  SMALL: 400,
  MEDIUM: 800,
  LARGE: 1200,
  HD: 1920,
};

/** Every profile eventually reaches HD; profiles only choose the first paint size. */
const FULL_LADDER = ['THUMB', 'SMALL', 'MEDIUM', 'LARGE', 'HD'];

export const IMAGE_PROFILES = {
  icon: { initial: 'THUMB', ladder: FULL_LADDER },
  feedCard: { initial: 'THUMB', ladder: FULL_LADDER },
  galleryTile: { initial: 'THUMB', ladder: FULL_LADDER },
  featuredHero: { initial: 'SMALL', ladder: FULL_LADDER },
  detail: { initial: 'SMALL', ladder: FULL_LADDER },
  /** Lightbox: low-res first, then step up to full original (HD). */
  lightbox: { initial: 'THUMB', ladder: FULL_LADDER },
};

const RENDER_QUALITIES = {
  THUMB: 80,
  SMALL: 82,
  MEDIUM: 85,
  LARGE: 88,
  HD: 90,
};

const RENDER_HEIGHTS = {
  THUMB: 150,
  SMALL: 300,
  MEDIUM: 600,
  LARGE: 900,
  HD: 1080,
};

function toSupabaseRenderUrl(originalUrl, variantType) {
  if (!originalUrl || typeof originalUrl !== 'string') return null;
  const trimmed = originalUrl.trim();
  if (!trimmed.includes('/storage/v1/object/public/')) return null;
  const base = trimmed.replace('/object/public/', '/render/image/public/');
  const width = VARIANT_WIDTHS[variantType];
  const height = RENDER_HEIGHTS[variantType];
  const quality = RENDER_QUALITIES[variantType];
  const params = new URLSearchParams();
  if (width != null) params.set('width', String(width));
  if (height != null) params.set('height', String(height));
  if (quality != null) params.set('quality', String(quality));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** DB-backed or Supabase-render fallback map for one original URL. */
export function buildVariantMap(originalUrl, project) {
  const key = resolveSnapUrl(originalUrl) || (typeof originalUrl === 'string' ? originalUrl.trim() : null);
  if (!key) return {};

  const fromApi = project?.snap_variants?.[key] || project?.snap_variants?.[originalUrl];
  const map = {};

  if (fromApi && typeof fromApi === 'object') {
    VARIANT_ORDER.forEach((type) => {
      const entry = fromApi[type];
      const url = entry?.url ?? entry?.variant_url ?? (typeof entry === 'string' ? entry : null);
      if (url) {
        map[type] = {
          url,
          width: entry?.width ?? VARIANT_WIDTHS[type],
        };
      }
    });
  }

  VARIANT_ORDER.forEach((type) => {
    if (map[type]) return;
    const renderUrl = toSupabaseRenderUrl(key, type);
    if (renderUrl) {
      map[type] = { url: renderUrl, width: VARIANT_WIDTHS[type] };
    }
  });

  return map;
}

export function getVariantSrc(originalUrl, variantType, project) {
  const key = resolveSnapUrl(originalUrl) || (typeof originalUrl === 'string' ? originalUrl.trim() : null);
  // HD = full file URL (public object), not Supabase render transform — prevents black/blank lightbox
  if (variantType === 'HD' && key) {
    return getFileUrl(key);
  }

  const map = buildVariantMap(originalUrl, project);
  const entry = map[variantType];
  if (entry?.url) return getFileUrl(entry.url);
  return getFileUrl(originalUrl);
}

/** Direct URL for lightbox / full-screen (always the stored original). */
export function getLightboxImageSrc(originalUrl) {
  const key = resolveSnapUrl(originalUrl) || (typeof originalUrl === 'string' ? originalUrl.trim() : null);
  return key ? getFileUrl(key) : null;
}

export function variantWidthFor(type, project, originalUrl) {
  const map = buildVariantMap(originalUrl, project);
  return map[type]?.width ?? VARIANT_WIDTHS[type] ?? 0;
}

export function isFinalVariant(variantType) {
  return variantType === 'HD';
}

export function getProfileInitial(profile) {
  const spec = IMAGE_PROFILES[profile] || IMAGE_PROFILES.feedCard;
  return spec.initial || spec.ladder[0] || 'THUMB';
}

export function getProfileLadder(profile) {
  const spec = IMAGE_PROFILES[profile] || IMAGE_PROFILES.feedCard;
  return spec.ladder || FULL_LADDER;
}

/** @deprecated All profiles now end at HD — kept for compatibility. */
export function getProfileMax() {
  return 'HD';
}

/** Next step toward HD (no early stop by display size). */
export function nextVariantInLadder(currentType, profile) {
  const ladder = getProfileLadder(profile);
  const idx = VARIANT_ORDER.indexOf(currentType);
  const start = idx < 0 ? 0 : idx + 1;

  for (let i = start; i < VARIANT_ORDER.length; i += 1) {
    const type = VARIANT_ORDER[i];
    if (ladder.includes(type)) return type;
  }
  return null;
}

export function isNetworkGoodForUpgrade() {
  if (typeof navigator === 'undefined') return true;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return true;
  if (conn.saveData) return false;
  const t = conn.effectiveType;
  if (t === 'slow-2g' || t === '2g') return false;
  return true;
}

export function isMemorySufficient() {
  if (typeof navigator === 'undefined') return true;
  const mem = navigator.deviceMemory;
  if (mem == null) return true;
  return mem >= 2;
}
