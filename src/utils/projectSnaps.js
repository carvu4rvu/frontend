/** 1 cover + up to 4 gallery images (5 total). Index 0 is always cover only. */
export const MAX_GALLERY_IMAGES = 4
export const MAX_TOTAL_PROJECT_IMAGES = 1 + MAX_GALLERY_IMAGES

export function splitProjectSnaps(snaps) {
  const list = Array.isArray(snaps)
    ? snaps.filter((s) => s != null && String(s).trim() !== "")
    : snaps && String(snaps).trim()
      ? [String(snaps).trim()]
      : []
  const cover = list[0] || null
  const gallery = list
    .slice(1)
    .filter((url) => url && url !== cover)
    .slice(0, MAX_GALLERY_IMAGES)
  return { cover, gallery }
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
  const { cover, gallery } = splitProjectSnaps(snaps)
  return buildProjectSnaps(cover, gallery)
}
