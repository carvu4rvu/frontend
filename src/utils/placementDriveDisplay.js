/** Shared CTC / status helpers for placement drive tables */

export function calculateTotalCTC(c) {
  if (!c || typeof c !== 'object') return null;
  const max = parseFloat(c.max ?? c.max_lpa ?? 0) || 0;
  const variablePercent = parseFloat(c.variable ?? 0) || 0;
  const stock = parseFloat(c.stock ?? 0) || 0;
  if (max <= 0) return null;
  if (variablePercent === 0 && stock === 0) return max;
  const variableAmount = (max * variablePercent) / 100;
  return Number((max + variableAmount + stock).toFixed(2));
}

export function getDisplayCTCValue(ctcStructure) {
  if (!ctcStructure || typeof ctcStructure !== 'object') return null;
  const calculated = calculateTotalCTC(ctcStructure);
  const stored = ctcStructure.final ?? ctcStructure.package ?? ctcStructure.total;
  return calculated != null ? calculated : (stored != null && stored !== '' ? stored : null);
}

export function getStatusColor(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'scheduled' || s === 'upcoming' || s === 'open') return 'blue';
  if (s === 'ongoing') return 'yellow';
  if (s === 'completed' || s === 'closed') return 'green';
  if (s === 'cancelled' || s === 'failed') return 'red';
  if (s === 'postponed') return 'orange';
  return 'gray';
}

export function registeredCount(drive) {
  return drive?.registered_count ?? drive?.number_of_registrations ?? 0;
}

/** Derive placement_status from registration / drive dates when not set manually. */
export function derivePlacementStatusFromDates(lastDateToReg, eventDatetime) {
  const now = new Date();
  let regEnd = lastDateToReg ? new Date(lastDateToReg) : null;
  const eventStart = eventDatetime ? new Date(eventDatetime) : null;
  if (regEnd && !isNaN(regEnd.getTime())) {
    const str = String(lastDateToReg).trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str) || (str.length <= 10 && str.indexOf('T') === -1);
    if (dateOnly) regEnd.setHours(23, 59, 59, 999);
  }
  if (!eventStart || isNaN(eventStart.getTime())) return 'scheduled';
  if (!regEnd || isNaN(regEnd.getTime())) return now < eventStart ? 'scheduled' : 'completed';
  if (now <= regEnd) return 'scheduled';
  if (now < eventStart) return 'ongoing';
  return 'completed';
}

const MANUAL_STATUSES = new Set(['cancelled', 'postponed', 'failed']);

/** Normalized lowercase placement status for filtering (matches admin Events.jsx). */
export function normalizePlacementStatus(drive) {
  const raw = String(drive?.placement_status || '').trim();
  const s = raw.toLowerCase();
  if (MANUAL_STATUSES.has(s)) return s;
  if (s === 'scheduled' || s === 'open' || s === 'ongoing' || s === 'completed' || s === 'closed') {
    return s;
  }
  return derivePlacementStatusFromDates(drive?.last_date_to_registration, drive?.event_datetime);
}

export function isHiddenFromCompanyDrives(drive) {
  const s = normalizePlacementStatus(drive);
  return s === 'cancelled' || s === 'postponed' || s === 'failed';
}

export function matchesDriveSection(drive, section) {
  const s = normalizePlacementStatus(drive);
  if (section === 'upcoming') return s === 'scheduled' || s === 'open';
  if (section === 'ongoing') return s === 'ongoing';
  if (section === 'completed') return s === 'completed' || s === 'closed';
  return false;
}
