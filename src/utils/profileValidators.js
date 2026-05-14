/**
 * Shared profile validation helpers (frontend).
 * Mirrors backend rules for dual-layer validation.
 * Use to disable submit when invalid and show inline errors.
 */

/** Regex: valid email */
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Regex: date YYYY-MM-DD */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Regex: 10 digits only (India) */
const PHONE_10_DIGITS = /^[0-9]{10}$/;

/** Regex: country code +[1-4 digits] */
const COUNTRY_CODE_REGEX = /^\+[0-9]{1,4}$/;

const EDUCATION_LEVELS = ['10TH', '12TH', 'DIPLOMA', 'GRADUATION', 'POST_GRADUATION', 'OTHER', 'EDUCATION_GAP'];
const RESULT_TYPES = ['PERCENTAGE', 'CGPA'];
const VISIBILITY_VALUES = ['PRIVATE', 'PUBLIC'];

const currentYear = new Date().getFullYear();

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [message]
 * @property {string} [field]
 */

/**
 * Validates email format.
 * @param {string} value
 * @param {{ required?: boolean }} [opts]
 * @returns {ValidationResult}
 */
export function validateEmail(value, opts = {}) {
  const { required = false } = opts;
  if (!value || typeof value !== 'string') {
    return required ? { valid: false, message: 'Email is required.' } : { valid: true };
  }
  const trimmed = value.trim();
  if (!trimmed && required) return { valid: false, message: 'Email is required.' };
  if (!trimmed) return { valid: true };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, message: 'Please enter a valid email address.' };
  return { valid: true };
}

/**
 * Validates phone number (10 digits).
 */
export function validatePhoneNumber(value, opts = {}) {
  const { required = false } = opts;
  if (value === null || value === undefined || value === '') {
    return required ? { valid: false, message: 'Phone number is required.' } : { valid: true };
  }
  const str = String(value).trim().replace(/\D/g, '');
  if (!str && required) return { valid: false, message: 'Phone number is required.' };
  if (!str) return { valid: true };
  if (!PHONE_10_DIGITS.test(str)) {
    return { valid: false, message: 'Please enter a valid phone number (10 digits).' };
  }
  return { valid: true };
}

/**
 * Validates country code.
 */
export function validateCountryCode(value) {
  if (value === null || value === undefined || value === '') return { valid: true };
  const str = String(value).trim();
  if (!str) return { valid: true };
  const normalized = str.startsWith('+') ? str : `+${str}`;
  if (!COUNTRY_CODE_REGEX.test(normalized)) {
    return { valid: false, message: 'Please enter a valid country code (e.g. +91).' };
  }
  return { valid: true };
}

/**
 * Validates date string YYYY-MM-DD.
 */
export function validateDate(value, opts = {}) {
  const { allowEmpty = true, allowFuture = false } = opts;
  if (value === null || value === undefined || value === '') {
    return allowEmpty ? { valid: true } : { valid: false, message: 'Date is required.' };
  }
  const str = String(value).trim().split('T')[0];
  if (!DATE_REGEX.test(str)) {
    return { valid: false, message: 'Please enter a valid date (YYYY-MM-DD).' };
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return { valid: false, message: 'Please enter a valid date.' };
  if (!allowFuture && date > new Date()) {
    return { valid: false, message: 'Date cannot be in the future.' };
  }
  return { valid: true };
}

/**
 * Validates date range: end >= start.
 */
export function validateDateRange(start, end) {
  if (!start || !end) return { valid: true };
  const s = String(start).trim().split('T')[0];
  const e = String(end).trim().split('T')[0];
  if (!DATE_REGEX.test(s) || !DATE_REGEX.test(e)) return { valid: true };
  if (new Date(e) < new Date(s)) {
    return { valid: false, message: 'End date cannot be earlier than start date.' };
  }
  return { valid: true };
}

/**
 * Validates year.
 */
export function validateYear(value, opts = {}) {
  const { min = 1900, max = currentYear, allowEmpty = true } = opts;
  if (value === null || value === undefined || value === '') {
    return allowEmpty ? { valid: true } : { valid: false, message: 'Year is required.' };
  }
  const n = parseInt(String(value), 10);
  if (Number.isNaN(n)) return { valid: false, message: 'Please enter a valid year.' };
  if (n < min || n > max) return { valid: false, message: `Year must be between ${min} and ${max}.` };
  return { valid: true };
}

/**
 * Validates semester (1-12).
 */
export function validateSemester(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: 'Semester is required.' };
  }
  const n = parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 1 || n > 12) {
    return { valid: false, message: 'Semester must be between 1 and 12.' };
  }
  return { valid: true };
}

/**
 * Validates SGPA (0-10).
 */
export function validateSgpa(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: 'SGPA is required.' };
  }
  const n = parseFloat(String(value));
  if (Number.isNaN(n) || n < 0 || n > 10) {
    return { valid: false, message: 'SGPA must be between 0 and 10.' };
  }
  return { valid: true };
}

/**
 * Validates percentage (0-100).
 */
export function validatePercentage(value) {
  if (value === null || value === undefined || value === '') return { valid: true };
  const n = parseFloat(String(value));
  if (Number.isNaN(n) || n < 0 || n > 100) {
    return { valid: false, message: 'Percentage must be between 0 and 100.' };
  }
  return { valid: true };
}

/**
 * Validates required string.
 */
export function validateRequired(value, fieldName, minLen = 1) {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: `${fieldName} is required.` };
  }
  if (value.trim().length < minLen) {
    return { valid: false, message: `${fieldName} must be at least ${minLen} character(s).` };
  }
  return { valid: true };
}

/**
 * Validates URL format.
 */
export function validateUrl(value) {
  if (value === null || value === undefined || value === '') return { valid: true };
  const str = String(value).trim();
  if (!str) return { valid: true };
  try {
    new URL(str);
    return { valid: true };
  } catch {
    return { valid: false, message: 'Please enter a valid URL.' };
  }
}

/**
 * Validates full name (min 2 chars).
 */
export function validateFullName(value) {
  return validateRequired(value, 'Full name', 2);
}
