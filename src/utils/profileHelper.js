/**
 * Profile completion: average of all section percentages (0–100).
 * Eligibility for opt-in placement: Batch/academy allows placement for that batch.
 */

/** Check if a string has meaningful content (not empty, not placeholder) */
const hasMeaningful = (val) => {
    const s = typeof val === 'string' ? val.trim() : '';
    return s.length >= 2 && !/^(n\/a|na|none|pending|tbd|tba|-|\.)$/i.test(s);
};

/** Check if education entry has real data */
const hasMeaningfulEducation = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((e) => {
        const inst = (e?.institute_name ?? e?.instituteName ?? '').toString().trim();
        const level = (e?.education_level ?? e?.educationLevel ?? '').toString().trim();
        const year = e?.year_of_passing ?? e?.yearOfPassing;
        const result = (e?.result ?? '').toString().trim();
        return inst.length >= 2 || level.length >= 2 || (year != null && String(year).trim() !== '') || result.length >= 1;
    });
};

/** Check if project/experience entry has real content */
const hasMeaningfulEntry = (arr, titleKey = 'title', descKey = 'one_line_description') => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((e) => {
        const title = (e?.[titleKey] ?? e?.job_role ?? e?.activity_name ?? '').toString().trim();
        const desc = (e?.[descKey] ?? e?.full_description ?? e?.description ?? '').toString().trim();
        return title.length >= 2 || desc.length >= 10;
    });
};

/** Check if resume is a real file (not placeholder) */
const hasRealResume = (val) => {
    const s = typeof val === 'string' ? val.trim() : '';
    return s.length >= 5 && !/^(n\/a|na|none|pending|tbd|tba|-|\.)$/i.test(s);
};

/** Minimum character lengths for career section fields (to count as "complete" for %) */
export const CAREER_FIELD_MIN_LENGTHS = {
  briefSummary: 20,
  careerObjective: 20,
  futureGoals: 20,
  keyExpertise: 20,
  hobbiesInterests: 20
};

/** Section IDs used across profile pages - same as Overview and GenericProfileSection */
const PROFILE_SECTION_IDS = [
  'personal', 'communication', 'career', 'education', 'academics',
  'projects', 'internships', 'trainings', 'certifications', 'publications',
  'extraCurricular', 'otherExperiences', 'parents'
];

/** Display labels for dashboard "missing sections" and overview */
export const PROFILE_SECTION_LABELS = {
  personal: 'Personal Details',
  communication: 'Contact / Communication',
  career: 'Career & Resume',
  education: 'Education',
  academics: 'Academics',
  projects: 'Projects',
  internships: 'Internships',
  trainings: 'Trainings',
  certifications: 'Certifications',
  publications: 'Publications',
  extraCurricular: 'Extra-curricular',
  otherExperiences: 'Other Experiences',
  parents: 'Family / Parents'
};

/**
 * Returns list of sections that are incomplete (completion < 100).
 * Used for dashboard "missing sections" and CTAs.
 * @param {Object} profile - Full profile (same shape as getFullProfile)
 * @returns {{ id: string, label: string }[]}
 */
export const getMissingSections = (profile) => {
  if (!profile) return [];
  const normalized = {
    ...profile,
    communication: profile.contact ?? profile.communication ?? {},
    parents: profile.parents ?? profile.family ?? []
  };
  const missing = [];
  for (const sectionId of PROFILE_SECTION_IDS) {
    const pct = calculateSectionCompletion(sectionId, normalized);
    if (pct < 100) {
      missing.push({
        id: sectionId,
        label: PROFILE_SECTION_LABELS[sectionId] || sectionId
      });
    }
  }
  return missing;
};

/**
 * Overall profile completion = weighted average of all sections.
 * Mandatory sections carry more weight. Growth sections (projects, internships, etc.)
 * carry less weight so they don't block 95% completion for students who don't have them.
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const normalized = {
    ...profile,
    communication: profile.contact ?? profile.communication ?? {},
    parents: profile.parents ?? profile.family ?? []
  };

  // Define weights for each section (Total weight = 100)
  // ONLY the 5 core sections contribute to the 100% completion.
  // Growth sections (Projects, Internships, etc.) do NOT add weight as per user request.
  const weights = {
    personal: 20,
    communication: 20,
    career: 20,
    education: 20,
    academics: 20,
    // All others are 0 weight
    parents: 0,
    projects: 0,
    internships: 0,
    trainings: 0,
    certifications: 0,
    extraCurricular: 0,
    publications: 0,
    otherExperiences: 0
  };

  let weightedSum = 0;
  for (const sectionId of PROFILE_SECTION_IDS) {
    const pct = calculateSectionCompletion(sectionId, normalized);
    const weight = weights[sectionId] || 0;
    weightedSum += (pct / 100) * weight;
  }

  // With these weights, total possible is > 100, which is fine, we clamp it.
  // This allows students to reach 95% without having every single optional section.
  return Math.round(Math.max(0, Math.min(100, weightedSum)));
};

  /**
   * Helper to calculate completion percentage for a specific section
   * @param {string} sectionName - Name of the section
   * @param {Object} data - The data for the section (or profile object containing it)
   * @returns {number} - Completion percentage (0-100)
   */
  export const calculateSectionCompletion = (sectionName, data) => {
    if (!data) return 0;

    // Normalize data: { sectionName: x } or { contact: x } for communication, { parents: x } for family, etc.
    let sectionData = data[sectionName];
    if (sectionData == null && sectionName === 'communication') sectionData = data.contact;
    if (sectionData == null && (sectionName === 'parents' || sectionName === 'family')) sectionData = data.parents;
    if (sectionData == null && sectionName === 'academics') sectionData = data.academics;
    if (sectionData == null && (sectionName === 'otherExperiences' || sectionName === 'other')) sectionData = data.otherExperiences ?? data.other;
    if (sectionData == null) sectionData = data;

    // Career: weighted by the 5 form fields + resume_file
    if (sectionName === 'career') {
      const d = sectionData || {};
      const fields = [
        { key: 'briefSummary', snake: 'brief_summary', min: CAREER_FIELD_MIN_LENGTHS.briefSummary },
        { key: 'careerObjective', snake: 'career_objective', min: CAREER_FIELD_MIN_LENGTHS.careerObjective },
        { key: 'futureGoals', snake: 'future_goals', min: CAREER_FIELD_MIN_LENGTHS.futureGoals },
        { key: 'keyExpertise', snake: 'key_expertise', min: CAREER_FIELD_MIN_LENGTHS.keyExpertise },
        { key: 'hobbiesInterests', snake: 'hobbies_interests', min: CAREER_FIELD_MIN_LENGTHS.hobbiesInterests }
      ];
      let passed = 0;
      fields.forEach(({ key, snake, min }) => {
        const val = (d[key] ?? d[snake] ?? '').toString().trim();
        if (val.length >= min) passed++;
      });
      
      // Also check for resume_file (can be in career object or top level)
      const resume = (d.resume_file ?? data.resume_file ?? '').toString().trim();
      if (hasRealResume(resume)) passed++;

      const total = fields.length + 1; // 5 fields + resume
      return total > 0 ? Math.round((passed / total) * 100) : 0;
    }

    // Array sections (growth portfolio): 0% if empty, 100% if at least one meaningful entry
    const arraySectionConfig = {
      projects: ['title', 'one_line_description'],
      internships: ['job_role', 'description'],
      trainings: ['title', 'description'],
      certifications: ['title', 'organization'],
      publications: ['title', 'description'],
      extraCurricular: ['activity_name', 'description'],
      otherExperiences: ['title', 'description'],
      other: ['title', 'description'] // alias for otherExperiences
    };
    if (arraySectionConfig[sectionName]) {
      const [titleKey, descKey] = arraySectionConfig[sectionName];
      const arr = Array.isArray(sectionData) ? sectionData : [];
      if (arr.length === 0) return 0;
      const hasEntry = sectionName === 'certifications'
        ? arr.some((c) => hasMeaningful(String(c?.title ?? c?.organization ?? '')))
        : hasMeaningfulEntry(arr, titleKey, descKey);
      return hasEntry ? 100 : 0;
    }

    if (!sectionData) return 0;

    // Define checks for each section (keys must match API/form: camelCase + snake_case)
    const sectionChecks = {
      personal: [
        { key: 'fullName', check: (d) => !!(d.fullName || d.full_name) },
        { key: 'usn', check: (d) => !!d.usn },
        { key: 'gender', check: (d) => !!d.gender },
        { key: 'dob', check: (d) => !!(d.dateOfBirth || d.date_of_birth) },
        { key: 'blood', check: (d) => !!(d.bloodGroup || d.blood_group) }
      ],
      communication: [
        // API contact has collegeEmail, personalEmail, phoneNumber
        { key: 'pEmail', check: (d) => !!(d.personal_email || d.personalEmail) },
        { key: 'phone', check: (d) => !!(d.phoneNumber || d.phone_number) }
      ],
      contact: [
        // Same as communication
        { key: 'pEmail', check: (d) => !!(d.personal_email || d.personalEmail) },
        { key: 'phone', check: (d) => !!(d.phoneNumber || d.phone_number) }
      ],
      education: null, // Handled by custom weighted logic
      parents: [
        { key: 'hasName', check: (d) => {
          const arr = Array.isArray(d) ? d : (d?.parents || []);
          return arr.some((p) => !!(p?.name || p?.full_name));
        }}
      ],
      family: [
        { key: 'hasName', check: (d) => {
          const arr = Array.isArray(d) ? d : (d?.parents || []);
          return arr.some((p) => !!(p?.name || p?.full_name));
        }}
      ]
    };

    // Education: at least 2 complete entries required (e.g. 10th + 12th, or 10th + diploma, or any 2).
    // 50% weight for marksheet, 50% for key fields.
    const MIN_EDUCATION_ENTRIES = 2;
    if (sectionName === 'education') {
      // Handle both flat array and nested object { education_history: [] }
      const arr = Array.isArray(sectionData) 
        ? sectionData 
        : (Array.isArray(sectionData?.education_history) ? sectionData.education_history : []);
        
      if (arr.length === 0) return 0;
      const withMarksheet = (e) => !!(e?.marksheet_file || e?.proofFile || e?.marksheetFile || e?.proof_file);
      const withKeyFields = (e) =>
        !!(e?.education_level || e?.educationLevel) &&
        !!(e?.institute_name || e?.instituteName) &&
        (e?.year_of_passing != null || e?.yearOfPassing != null) &&
        String(e?.result ?? '').trim() !== '';

      const imageScore = (arr.filter(withMarksheet).length / arr.length) * 50;
      const fieldsScore = (arr.filter(withKeyFields).length / arr.length) * 50;
      const baseScore = Math.round(imageScore + fieldsScore);

      const completeCount = arr.filter((e) => withKeyFields(e)).length;
      if (completeCount >= MIN_EDUCATION_ENTRIES) return baseScore;
      
      // If they have 1 complete entry (common for some direct entry students), they get a high score
      if (completeCount === 1) return Math.round(baseScore * 0.9);
      
      return Math.round(baseScore * 0.5);
    }

    // Academics: 50% marksheets, 50% other fields. Based on current semester - count expected vs uploaded.
    if (sectionName === 'academics') {
      const arr = Array.isArray(sectionData) ? sectionData : [];
      const personal = data?.personal || {};
      const rawCurrent = personal?.currentSemester ?? personal?.current_semester ?? data?.currentSemester ?? data?.current_semester;
      const currentSemester = rawCurrent != null && rawCurrent !== '' ? parseInt(rawCurrent, 10) : NaN;

      const hasMarksheet = (e) => {
        const links = e?.provisional_result_upload_links ?? e?.resultUploadLink ?? e?.marksheet_file;
        if (Array.isArray(links) && links.length > 0) return true;
        if (typeof links === 'string' && links.trim()) return true;
        return false;
      };
      const hasKeyFields = (e) =>
        (e?.semester != null && e?.semester !== '') &&
        (e?.academic_year != null || (e?.academicYear != null && e?.academicYear !== '')) &&
        (e?.result_in_sgpa != null || (e?.sgpa != null && String(e?.sgpa).trim() !== ''));

      // If we know current semester, expected = semesters 1 to (currentSem - 1)
      if (!Number.isNaN(currentSemester) && currentSemester >= 1) {
        const expectedCount = currentSemester - 1; // e.g. sem 6 → expect 5 uploads
        if (expectedCount <= 0) return 100; // sem 1: nothing to upload yet

        let uploadedCount = 0;
        let fieldsCompleteCount = 0;
        for (let sem = 1; sem <= expectedCount; sem++) {
          const item = arr.find((x) => {
            const v = x?.semester;
            if (v == null || v === '') return false;
            return parseInt(v, 10) === sem;
          });
          if (item && hasMarksheet(item)) uploadedCount++;
          if (item && hasKeyFields(item)) fieldsCompleteCount++;
        }
        const imageScore = (uploadedCount / expectedCount) * 50;
        const fieldsScore = (fieldsCompleteCount / expectedCount) * 50;
        return Math.round(imageScore + fieldsScore);
      }

      // Fallback: no current sem - use ratio of filled entries (like before)
      if (arr.length === 0) return 0;
      const withMarksheet = arr.filter(hasMarksheet);
      const withKeyFields = arr.filter(hasKeyFields);
      const imageScore = (withMarksheet.length / arr.length) * 50;
      const fieldsScore = (withKeyFields.length / arr.length) * 50;
      return Math.round(imageScore + fieldsScore);
    }

    const checks = sectionChecks[sectionName] || sectionChecks['contact']; // Fallback or empty?
    if (!checks) return 0; // Or return 100 if no checks defined? 0 is safer.

    let passed = 0;
    checks.forEach(item => {
        if (item.check(sectionData)) passed++;
    });

    return Math.round((passed / checks.length) * 100);
  };
