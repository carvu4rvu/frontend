/** Parse "School A - Program X, School B - Program Y" from API eligibility_display */
export function parseSchoolProgramPairsFromDisplay(display) {
  if (!display || typeof display !== 'string') return [];
  return display
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const sep = part.indexOf(' - ');
      if (sep === -1) return { school: part, program: '' };
      return { school: part.slice(0, sep).trim(), program: part.slice(sep + 3).trim() };
    });
}

/** Group pairs so each school lists its programs once: SOB → [BCOM, BBA Hons] */
export function groupEligibilityBySchool(pairs) {
  const map = new Map();
  for (const { school, program } of pairs || []) {
    const s = (school || '').trim();
    const p = (program || '').trim();
    if (!s) continue;
    if (!map.has(s)) map.set(s, []);
    const programs = map.get(s);
    if (p && !programs.some((x) => x.toLowerCase() === p.toLowerCase())) {
      programs.push(p);
    }
  }
  return [...map.entries()].map(([school, programs]) => ({ school, programs }));
}

export function getEligibilityGroupsFromDrive(drive) {
  if (!drive) return [];
  const pairs = drive.school_program_pairs;
  if (Array.isArray(pairs) && pairs.length > 0) {
    return groupEligibilityBySchool(pairs);
  }
  if (drive.eligibility_display) {
    return groupEligibilityBySchool(parseSchoolProgramPairsFromDisplay(drive.eligibility_display));
  }
  return [];
}

/** Plain text: SOB : " BCOM , BBA Hons " , SOCSE : " Bsc H " */
export function formatEligibilityGroupsPlain(groups) {
  if (!groups?.length) return '';
  return groups
    .map((g) => {
      const progs = g.programs.length ? g.programs.join(' , ') : '—';
      return `${g.school} : "${progs}"`;
    })
    .join(' , ');
}
