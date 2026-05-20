/** 1 cover + up to 4 gallery images (5 total). Index 0 is always cover only. */
export const MAX_GALLERY_IMAGES = 4
export const MAX_TOTAL_PROJECT_IMAGES = 1 + MAX_GALLERY_IMAGES

/** Extract display URL from snap string or API object shape. */
export function resolveSnapUrl(snap) {
  if (snap == null) return null
  if (typeof snap === 'string') {
    const t = snap.trim()
    return t || null
  }
  if (typeof snap === 'object') {
    const u = snap.original_url ?? snap.url ?? snap.publicUrl ?? snap.public_url
    return u && String(u).trim() ? String(u).trim() : null
  }
  const t = String(snap).trim()
  return t || null
}

/** Normalized URL list for rendering (uses project_snaps, then cover_url). */
export function getDisplayProjectSnaps(project) {
  if (!project) return []
  const raw = project.project_snaps ?? project.projectSnaps ?? project.snaps
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const urls = list.map(resolveSnapUrl).filter(Boolean)
  if (urls.length) return urls
  const cover = resolveSnapUrl(project.cover_url ?? project.coverUrl)
  return cover ? [cover] : []
}

export function splitProjectSnaps(snaps) {
  const normalized = Array.isArray(snaps)
    ? snaps.map(resolveSnapUrl).filter(Boolean)
    : resolveSnapUrl(snaps)
      ? [resolveSnapUrl(snaps)]
      : []
  const list = normalized
  const cover = list[0] || null
  const gallery = list
    .slice(1)
    .filter((url) => url && url !== cover)
    .slice(0, MAX_GALLERY_IMAGES)
  return { cover, gallery }
}

function galleryUrlsFromAssets(assets) {
  if (!Array.isArray(assets)) return []
  return assets
    .filter((a) => String(a?.asset_role || '').toUpperCase() === 'GALLERY')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((a) => resolveSnapUrl(a.original_url ?? a))
    .filter(Boolean)
    .slice(0, MAX_GALLERY_IMAGES)
}

function coverUrlFromAssets(assets) {
  if (!Array.isArray(assets)) return null
  const cover = assets.find((a) => String(a?.asset_role || '').toUpperCase() === 'COVER')
  return cover ? resolveSnapUrl(cover.original_url ?? cover) : null
}

/** Cover image only — use for icons, mini thumbnails, and avatar slots. */
export function getProjectCoverImage(project) {
  if (!project) return null
  const coverFromAssets = coverUrlFromAssets(project.assets)
  if (coverFromAssets) return coverFromAssets

  const snaps = getDisplayProjectSnaps(project)
  const { cover } = splitProjectSnaps(snaps)
  return cover || null
}

/** @alias Mini/icon thumbnail — always the cover (slot 0), never gallery. */
export function getShowcasePreviewImage(project) {
  return getProjectCoverImage(project)
}

/** Up to 4 gallery images only (excludes cover). */
export function getShowcaseGalleryStrip(project) {
  if (!project) return []
  let gallery = galleryUrlsFromAssets(project.assets)
  if (!gallery.length) {
    const snaps = getDisplayProjectSnaps(project)
    gallery = splitProjectSnaps(snaps).gallery
  }
  const cover = getProjectCoverImage(project)
  return gallery
    .filter((url) => url && url !== cover)
    .slice(0, MAX_GALLERY_IMAGES)
}

/** First gallery image for wide hero banners; falls back to cover. */
export function getShowcaseHeroImage(project) {
  const gallery = getShowcaseGalleryStrip(project)
  return gallery[0] || getProjectCoverImage(project) || null
}

/** Build storage array: [cover, ...gallery] with cover never duplicated in gallery. */
export function buildProjectSnaps(cover, gallery) {
  const coverUrl = cover && String(cover).trim() ? String(cover).trim() : null
  const gal = (Array.isArray(gallery) ? gallery : [])
    .map((s) => (s != null ? String(s).trim() : ""))
    .filter(Boolean)
    .filter((url) => url !== coverUrl)
    .slice(0, MAX_GALLERY_IMAGES)
  if (coverUrl) return [coverUrl, ...gal]
  return gal
}

export function normalizeProjectSnaps(snaps) {
  const raw = Array.isArray(snaps) ? snaps : snaps ? [snaps] : []
  const urls = raw.map(resolveSnapUrl).filter(Boolean)
  const { cover, gallery } = splitProjectSnaps(urls)
  return buildProjectSnaps(cover, gallery)
}

/** Ordered unique URLs for image lightbox: cover, then gallery (from snaps or assets). */
export function getProjectLightboxImages(project) {
  if (!project) return []
  const seen = new Set()
  const out = []
  const push = (url) => {
    const u = typeof url === 'string' ? url.trim() : resolveSnapUrl(url)
    if (u && !seen.has(u)) {
      seen.add(u)
      out.push(u)
    }
  }

  if (Array.isArray(project.assets) && project.assets.length) {
    const cov = coverUrlFromAssets(project.assets)
    if (cov) push(cov)
    galleryUrlsFromAssets(project.assets).forEach(push)
    if (out.length) return out
  }

  const { cover, gallery } = splitProjectSnaps(getDisplayProjectSnaps(project))
  if (cover) push(cover)
  gallery.forEach(push)
  return out
}

/** Resolve index in lightbox list for a given image URL. */
export function indexInLightboxImages(images, url) {
  if (!url || !Array.isArray(images)) return 0
  const normalized = resolveSnapUrl(url) || url
  const idx = images.findIndex((u) => u === normalized || resolveSnapUrl(u) === normalized)
  return idx >= 0 ? idx : 0
}
