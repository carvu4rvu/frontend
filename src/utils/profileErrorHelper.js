/** Error codes that indicate the section should be read-only. */
export const READ_ONLY_ERROR_CODES = [
  'STUDENT_OPT_IN_ELIGIBILITY',
];

/**
 * Returns true if the error indicates the page should switch to read-only mode.
 * @param {unknown} error - Caught error
 * @returns {boolean}
 */
export function isReadOnlyError(error) {
  const parsed = parseApiError(error);
  return parsed.errorCode != null && READ_ONLY_ERROR_CODES.includes(parsed.errorCode);
}

/**
 * Normalizes API/network errors into user-friendly messages for profile subpages.
 * Do not rewrite backend messages; show them verbatim.
 * @param {unknown} error - Caught error (Error, axios error, or unknown)
 * @returns {string} User-friendly message
 */
export function getProfileErrorMessage(error) {
  const parsed = parseApiError(error);
  return parsed.message;
}

/**
 * Parses API error into structured format for form binding.
 * Handles consistent backend format: { success, errorCode, message, fieldErrors }
 *
 * @param {unknown} error - Caught error (fetch/axios style: error.response?.data)
 * @returns {{
 *   message: string;
 *   status?: number;
 *   errorCode?: string;
 *   fieldErrors?: Record<string, string>;
 * }}
 */
export function parseApiError(error) {
  const fallback = "Something went wrong. Please try again.";
  if (!error) return { message: fallback };

  const status = error?.response?.status;
  const data = error?.response?.data;
  const msg = typeof error?.message === "string" ? error.message.trim() : "";

  // Backend structured format
  const apiMessage = data?.message ?? data?.error;
  const apiMessageStr = typeof apiMessage === "string" ? apiMessage.trim() : "";
  const fieldErrors = data?.fieldErrors && typeof data.fieldErrors === "object" ? data.fieldErrors : undefined;

  const message =
    apiMessageStr ||
    (msg &&
      (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")
        ? "Network error. Check your connection and try again."
        : msg)) ||
    (status === 401 ? "Please log in again to continue." : null) ||
    (status === 403 ? "You don't have permission to perform this action." : null) ||
    (status === 404 ? "The requested resource was not found." : null) ||
    (status >= 500 ? "Server is temporarily unavailable. Please try again later." : null) ||
    fallback;

  return {
    message,
    status,
    errorCode: data?.errorCode,
    fieldErrors: fieldErrors && Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

/**
 * Maps backend fieldErrors to form field names (handles camelCase/snake_case).
 * Backend may return snake_case (e.g. phone_number); form may use camelCase (phoneNumber).
 * Do not rewrite messages; use backend message verbatim.
 *
 * @param {Record<string, string>} fieldErrors - From parseApiError
 * @param {Record<string, string>} [aliasMap] - Optional: { frontendField: backendField }
 * @returns {Record<string, string>} fieldErrors keyed by form field names
 */
export function mapFieldErrorsToForm(fieldErrors, aliasMap = {}) {
  if (!fieldErrors || typeof fieldErrors !== "object") return {};

  const result = {};
  const camelCase = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

  for (const [key, value] of Object.entries(fieldErrors)) {
    if (!value || typeof value !== "string") continue;
    // Prefer alias if provided
    const formKey =
      Object.entries(aliasMap).find(([, backend]) => backend === key)?.[0] ?? camelCase(key);
    result[formKey] = value;
  }
  return result;
}

/**
 * Parses indexed backend keys like "education[0].education_level" or "academics[1].result_in_sgpa"
 * into { index, field }. Returns null if key does not match pattern.
 * @param {string} key - Backend fieldErrors key
 * @param {string} prefix - Section prefix (e.g. "education", "academics", "publications")
 * @returns {{ index: number; field: string } | null}
 */
export function parseIndexedFieldKey(key, prefix) {
  if (!key || typeof key !== "string") return null;
  const re = new RegExp(`^${prefix}\\[(\\d+)\\]\\.(.+)$`);
  const m = key.match(re);
  if (!m) return null;
  return { index: parseInt(m[1], 10), field: m[2] };
}

/**
 * Maps backend indexed fieldErrors to per-row errors: { [index]: { [field]: message } }
 * Use for education, academics, publications, etc.
 * @param {Record<string, string>} fieldErrors - From parseApiError
 * @param {string} prefix - Section prefix (e.g. "education", "academics")
 * @returns {Record<number, Record<string, string>>}
 */
export function mapIndexedFieldErrors(fieldErrors, prefix) {
  if (!fieldErrors || typeof fieldErrors !== "object") return {};

  const byIndex = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (!value || typeof value !== "string") continue;
    const parsed = parseIndexedFieldKey(key, prefix);
    if (!parsed) continue;
    if (!byIndex[parsed.index]) byIndex[parsed.index] = {};
    byIndex[parsed.index][parsed.field] = value;
  }
  return byIndex;
}

/** Human-readable labels for section/item types in error messages */
const SECTION_ITEM_LABELS = {
  education: 'Education entry',
  academics: 'Semester',
  certifications: 'Certification',
  internships: 'Internship',
  trainings: 'Training',
  publications: 'Publication',
  'extra-curricular': 'Activity',
  'other-experiences': 'Experience',
  family: 'Family member',
  parents: 'Family member',
  summer_immersion: 'Summer immersion entry',
  summer_internship: 'Summer internship entry',
};

/**
 * Build a user-friendly description from fieldErrors for indexed sections.
 * e.g. "Certification 1: Title and Organization are required. Certification 2: This certification already exists."
 */
export function formatFieldErrorsSummary(fieldErrors, sectionKey) {
  if (!fieldErrors || typeof fieldErrors !== "object" || Object.keys(fieldErrors).length === 0) return null;
  const prefixMap = {
    education: "education", academics: "academics", publications: "publications",
    certifications: "certifications", "extra-curricular": "extraCurricular",
    "other-experiences": "otherExperiences", internships: "internships",
    trainings: "trainings", family: "parents",
    summer_immersion: "summer_immersion", summer_internship: "summer_internship",
  };
  const prefix = prefixMap[sectionKey];
  if (!prefix) return null;
  const byIndex = mapIndexedFieldErrors(fieldErrors, prefix);
  const parts = [];
  for (const [idx, errs] of Object.entries(byIndex)) {
    const itemLabel = SECTION_ITEM_LABELS[sectionKey] || "Item";
    const num = parseInt(idx, 10) + 1;
    const msgs = Object.values(errs).filter(Boolean).map((m) => String(m).trim()).filter(Boolean);
    if (msgs.length > 0) {
      const joined = msgs.map((m) => (m.endsWith(".") ? m : m + ".")).join(" ");
      parts.push(`${itemLabel} ${num}: ${joined}`);
    }
  }
  return parts.length > 0 ? parts.join(" ") : null;
}
