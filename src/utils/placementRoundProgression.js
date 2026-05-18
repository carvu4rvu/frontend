/**
 * Placement round progression — derive display status with downstream NOT QUALIFIED.
 * Keep in sync with backend/utils/placementRoundProgression.js
 */

function getComplianceCategory(process) {
  if (process?.compliance?.primary_category) return process.compliance.primary_category;
  if (process?.malpractice === true) return 'malpractice';
  if ((process?.disciplinary ?? 0) > 0) return 'disciplinary';
  if ((process?.placement_violations ?? 0) > 0) return 'placement_policy';
  return null;
}

function isRegistered(process) {
  return String(process?.registration_status || '').toLowerCase() === 'registered';
}

function fieldProgressIndex(field, roundFields) {
  if (field === 'registration_status') return 0;
  if (field === 'approved_status') return 1;
  const ri = roundFields.indexOf(field);
  if (ri >= 0) return 2 + ri;
  return -1;
}

function findPriorTerminal(process, roundFields, targetIndex) {
  if (targetIndex <= 0) return null;

  if (targetIndex > 0 && !isRegistered(process)) {
    return { reason: 'not_registered', atIndex: 0 };
  }

  if (targetIndex > 1) {
    const approved = process?.approved_status;
    if (approved === 'Not Qualified') return { reason: 'rejected', atIndex: 1 };
    if (approved !== 'Qualified' && approved !== 'skipped') {
      return { reason: 'not_approved', atIndex: 1 };
    }
  }

  if (targetIndex > 2) {
    const cat = getComplianceCategory(process);
    if (cat === 'disciplinary') return { reason: 'disciplinary', atIndex: 2 };
    if (cat === 'placement_policy') return { reason: 'policy', atIndex: 2 };
    if (String(process?.attendance || '').toLowerCase() === 'absent') {
      return { reason: 'absent', atIndex: 2 };
    }
  }

  for (let ri = 0; ri < roundFields.length; ri++) {
    const progIdx = 2 + ri;
    if (progIdx >= targetIndex) break;
    const f = roundFields[ri];
    if (!f) continue;
    if (process[f] === false) {
      return { reason: 'failed_round', atIndex: progIdx, field: f };
    }
  }

  return null;
}

export function getEffectiveRoundStatus(process, field, roundFields = []) {
  const roundFieldsList = Array.isArray(roundFields) ? roundFields : [];
  const idx = fieldProgressIndex(field, roundFieldsList);

  if (field === 'registration_status') {
    const v = String(process?.registration_status || '').toLowerCase();
    if (v === 'registered') return { key: 'passed', label: 'REGISTERED', cssClass: 'status-pass' };
    if (v === 'not registered') return { key: 'failed', label: 'NOT REGISTERED', cssClass: 'status-fail' };
    return { key: 'pending', label: 'PENDING', cssClass: 'status-pending' };
  }

  if (field === 'approved_status') {
    const prior = findPriorTerminal(process, roundFieldsList, idx);
    if (prior) return { key: 'not_qualified', label: 'NOT QUALIFIED', cssClass: 'status-not-qualified' };
    const v = process?.approved_status;
    if (v === 'Qualified') return { key: 'passed', label: 'QUALIFIED', cssClass: 'status-pass' };
    if (v === 'Not Qualified') return { key: 'failed', label: 'NOT QUALIFIED', cssClass: 'status-fail' };
    if (v === 'skipped') return { key: 'skipped', label: 'SKIPPED', cssClass: 'status-not-qualified' };
    return { key: 'pending', label: 'PENDING', cssClass: 'status-pending' };
  }

  if (idx < 0) {
    const raw = process?.[field];
    if (raw === true) return { key: 'passed', label: 'PASSED', cssClass: 'status-pass' };
    if (raw === false) return { key: 'failed', label: 'FAILED', cssClass: 'status-fail' };
    return { key: 'pending', label: 'PENDING', cssClass: 'status-pending' };
  }

  const prior = findPriorTerminal(process, roundFieldsList, idx);
  if (prior) {
    return { key: 'not_qualified', label: 'NOT QUALIFIED', cssClass: 'status-not-qualified' };
  }

  const raw = process?.[field];

  if (process?.malpractice === true && raw === false) {
    return { key: 'malpractice', label: 'MALPRACTICE', cssClass: 'status-malpractice' };
  }

  if (raw === true) return { key: 'passed', label: 'PASSED', cssClass: 'status-pass' };
  if (raw === false) {
    if (process?.malpractice === true) {
      return { key: 'malpractice', label: 'MALPRACTICE', cssClass: 'status-malpractice' };
    }
    return { key: 'failed', label: 'FAILED', cssClass: 'status-fail' };
  }

  return { key: 'pending', label: 'PENDING', cssClass: 'status-pending' };
}

/** Round tab visibility — include eliminated students so downstream shows NOT QUALIFIED. */
export function isVisibleOnRoundTab(process, roundIndex, roundFields) {
  if (!isRegistered(process)) return roundIndex === -2;
  if (roundIndex === -3) return isRegistered(process);
  if (roundIndex < 0) return true;
  if (process.approved_status !== 'Qualified') return roundIndex <= -3;

  for (let j = 0; j < roundIndex; j++) {
    const f = roundFields[j];
    if (f && process[f] === false) return true;
  }

  for (let j = 0; j < roundIndex; j++) {
    const f = roundFields[j];
    if (f && process[f] !== true) return false;
  }
  return true;
}

export function formatRoundStatusForExport(process, field, roundFields) {
  return getEffectiveRoundStatus(process, field, roundFields).label;
}
