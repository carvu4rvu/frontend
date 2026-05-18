/** Parse "1,2,3" or "1 2 3" into array of integers */
export const parseIntList = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(/[\s,]+/).map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n));
};

/**
 * Client-side filters for Add Students / eligibility preview.
 * Option checkboxes apply only when explicitly enabled (applyOptionsWhenChecked: true).
 */
export function passesPlacementStudentFilters(student, filters) {
  const {
    searchQuery = '',
    selectedSchoolIds = [],
    selectedProgramIds = [],
    selectedSpecializationIds = [],
    selectedMajorIds = [],
    minCGPA = '',
    maxCGPA = '',
    maxActiveBacklogs = '',
    maxBacklogHistory = '',
    maxTotalOffers = '',
    joiningYears = '',
    graduationYears = '',
    maxExistingCtcLpa = '',
    minNewCtcLpa = '',
    minCtcMultiplier = '',
    selectedGenders = [],
    selectedYears = [],
    selectedSemesters = [],
    selectedSections = [],
    min10thPercent = '',
    min12thPercent = '',
    minDiplomaPercent = '',
    applyOptionsWhenChecked = true,
    excludeAlreadyPlaced = false,
    countOffcampusOffers = false,
    excludeAdminHold = true,
    excludePlacementViolations = true,
    excludeDisciplinaryRecords = true,
    allowAlreadyPlaced = true,
  } = filters;

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    const hay = `${student.name || ''} ${student.usn || ''} ${student.email || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (selectedSchoolIds.length > 0) {
    const sid = student.school_id != null ? Number(student.school_id) : null;
    if (sid == null || !selectedSchoolIds.map(Number).includes(sid)) return false;
  }
  if (selectedProgramIds.length > 0) {
    const pid = student.program_id != null ? Number(student.program_id) : null;
    if (pid == null || !selectedProgramIds.map(Number).includes(pid)) return false;
  }
  if (selectedSpecializationIds.length > 0) {
    const spid = student.specialization_id != null ? Number(student.specialization_id) : null;
    if (spid == null || !selectedSpecializationIds.map(Number).includes(spid)) return false;
  }
  if (selectedMajorIds.length > 0) {
    const mid = student.major_id != null ? Number(student.major_id) : null;
    if (mid == null || !selectedMajorIds.map(Number).includes(mid)) return false;
  }

  // Gender filter
  if (selectedGenders.length > 0) {
    const gender = (student.gender || '').toLowerCase();
    if (!selectedGenders.map((g) => g.toLowerCase()).includes(gender)) return false;
  }

  // Current Year filter
  if (selectedYears.length > 0) {
    const year = student.current_year != null ? Number(student.current_year) : null;
    if (year == null || !selectedYears.map(Number).includes(year)) return false;
  }

  // Current Semester filter
  if (selectedSemesters.length > 0) {
    const sem = student.current_semester != null ? Number(student.current_semester) : null;
    if (sem == null || !selectedSemesters.map(Number).includes(sem)) return false;
  }

  // Section filter
  if (selectedSections.length > 0) {
    const section = (student.section || '').toUpperCase();
    if (!selectedSections.map((s) => s.toUpperCase()).includes(section)) return false;
  }

  const studentCGPA = parseFloat(student.latest_sgpa ?? student.cgpa);
  if (minCGPA !== '' && (Number.isNaN(studentCGPA) || studentCGPA < parseFloat(minCGPA))) return false;
  if (maxCGPA !== '' && (Number.isNaN(studentCGPA) || studentCGPA > parseFloat(maxCGPA))) return false;

  // Education marks filters
  if (min10thPercent !== '' && (student.percent_10th == null || student.percent_10th < parseFloat(min10thPercent))) return false;
  if (min12thPercent !== '' && (student.percent_12th == null || student.percent_12th < parseFloat(min12thPercent))) return false;
  if (minDiplomaPercent !== '' && (student.percent_diploma == null || student.percent_diploma < parseFloat(minDiplomaPercent))) return false;

  const studentLiveBL = parseInt(student.live_backlogs || 0, 10);
  if (maxActiveBacklogs !== '' && studentLiveBL > parseInt(maxActiveBacklogs, 10)) return false;

  const studentBacklogHist = parseInt(student.total_backlog_history ?? student.closed_backlogs ?? 0, 10);
  if (maxBacklogHistory !== '' && studentBacklogHist > parseInt(maxBacklogHistory, 10)) return false;

  const jyList = parseIntList(joiningYears);
  const studentJY = student.year_of_joining ? parseInt(student.year_of_joining, 10) : null;
  if (jyList.length > 0 && (studentJY == null || !jyList.includes(studentJY))) return false;

  const gyList = parseIntList(graduationYears);
  const studentGY = student.graduation_year ? parseInt(student.graduation_year, 10) : null;
  if (gyList.length > 0 && (studentGY == null || !gyList.includes(studentGY))) return false;

  const studentOffers = parseInt(student.offers_count || 0, 10);
  const offCampusCount = student.is_placed_off_campus ? 1 : 0;
  const totalOffers = countOffcampusOffers ? studentOffers : Math.max(0, studentOffers - offCampusCount);
  if (maxTotalOffers !== '' && totalOffers > parseInt(maxTotalOffers, 10)) return false;

  const studentMaxCtc = parseFloat(student.max_ctc_lpa || 0);
  if (maxExistingCtcLpa !== '' && studentMaxCtc > parseFloat(maxExistingCtcLpa)) return false;

  if (minNewCtcLpa !== '' && studentMaxCtc > 0) {
    const mult = parseFloat(minCtcMultiplier);
    const minRequired = studentMaxCtc * (Number.isNaN(mult) ? 1 : mult);
    if (parseFloat(minNewCtcLpa) < minRequired) return false;
  }

  if (applyOptionsWhenChecked) {
    if (excludeAlreadyPlaced && student.is_placed) return false;
    // Exclusions for Admin Hold, Placement Violations, and Disciplinary Records 
    // are now handled by the backend for better accuracy across large datasets.
  } else if (!allowAlreadyPlaced && student.is_placed) {
    return false;
  }

  return true;
}
