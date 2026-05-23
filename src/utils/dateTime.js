/**
 * Project-wide Indian Standard Time (IST) formatting.
 * Use these helpers instead of toLocaleString(undefined) or bare new Date() display.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_LOCALE = 'en-IN';

/** Parse API/DB date strings consistently (ISO, or legacy UTC-naive "YYYY-MM-DD HH:mm:ss"). */
export function parseAppDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const s = String(value).trim();
  if (!s) return null;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
  if (m) {
    const d = new Date(`${m[1]}T${m[2]}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Full date + time in IST (e.g. "21 May 2026, 4:30 pm"). */
export function formatDateTimeIST(value, options = {}) {
  const d = parseAppDate(value);
  if (!d) return '—';

  const defaultOptions = {
    timeZone: IST_TIMEZONE,
  };

  // If user provides specific components (weekday, year, etc.), don't use styles
  const hasSpecificOptions = ['weekday', 'year', 'month', 'day', 'hour', 'minute', 'second'].some(
    (key) => key in options
  );

  if (!hasSpecificOptions) {
    defaultOptions.dateStyle = 'medium';
    defaultOptions.timeStyle = 'short';
  }

  return d.toLocaleString(IST_LOCALE, {
    ...defaultOptions,
    ...options,
  });
}

/** Date only in IST. */
export function formatDateIST(value, options = {}) {
  const d = parseAppDate(value);
  if (!d) return '—';

  const defaultOptions = {
    timeZone: IST_TIMEZONE,
  };

  // If user provides specific components (weekday, year, etc.), don't use styles
  const hasSpecificOptions = ['weekday', 'year', 'month', 'day'].some((key) => key in options);

  if (!hasSpecificOptions) {
    defaultOptions.dateStyle = 'medium';
  }

  return d.toLocaleDateString(IST_LOCALE, {
    ...defaultOptions,
    ...options,
  });
}

/** Short date in IST (e.g. "21 May 2026"). */
export function formatShortDateIST(value, options = {}) {
  const d = parseAppDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(IST_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

/** Time only in IST. */
export function formatTimeIST(value, options = {}) {
  const d = parseAppDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString(IST_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

/** Relative label for recent items; absolute IST datetime after threshold. */
export function formatRelativeTimeIST(value, { absoluteAfterDays = 7 } = {}) {
  const d = parseAppDate(value);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return formatDateTimeIST(d);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < absoluteAfterDays) return `${diffDays}d ago`;
  return formatDateTimeIST(d);
}

/** YYYY-MM-DD in IST (for calendar keys / filters). */
export function toIstDateKey(value) {
  const d = parseAppDate(value);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return y && m && day ? `${y}-${m}-${day}` : '';
}

/** Month + year label in IST. */
export function formatMonthYearIST(value) {
  const d = parseAppDate(value) || new Date();
  return d.toLocaleString(IST_LOCALE, { month: 'short', year: 'numeric', timeZone: IST_TIMEZONE });
}
