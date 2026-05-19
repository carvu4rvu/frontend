import { getFileUrl } from './fileUrl';

/**
 * Resolve a stored company logo value to a browser-loadable URL.
 * - data: URLs (uploaded via Companies UI) are returned as-is
 * - http(s) and storage paths go through getFileUrl (signed URLs for private buckets)
 */
export function resolveCompanyLogoUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return trimmed;
  return getFileUrl(trimmed) || trimmed;
}

/**
 * Raw logo field from a company row, nested drive.company, or company id lookup map.
 * @param {object} record - Company row or placement drive
 * @param {Map<number, string>|null} companyById - Optional id → company_logo_link map
 */
export function getCompanyLogoRaw(record, companyById = null) {
  if (!record) return null;

  const nested = record.company?.company_logo_link ?? record.company?.logo;
  if (nested) return nested;

  const companyId = record.company_id != null ? Number(record.company_id) : null;
  if (companyId != null && companyById?.get?.(companyId)) {
    return companyById.get(companyId);
  }

  return record.company_logo_link ?? record.logo ?? null;
}

/** Build Map<companyId, logoRaw> from companies list API rows */
export function buildCompanyLogoById(companies) {
  const map = new Map();
  (companies || []).forEach((c) => {
    const id = c?.id != null ? Number(c.id) : null;
    const raw = c?.company_logo_link ?? c?.logo;
    if (id != null && raw) map.set(id, raw);
  });
  return map;
}
