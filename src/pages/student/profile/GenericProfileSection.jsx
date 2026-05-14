import { Box, Button, HStack, VStack, Spinner, Center, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Badge, Flex, useToast, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate, useBlocker, useBeforeUnload } from "react-router-dom"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { useAuth } from "../../../context/AuthContext"
import { useProfileView } from "../../../context/ProfileViewContext"
import { usePlacementTrackPolicy } from "../../../context/PlacementTrackPolicyContext"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import { toSnakeCase } from "../../../utils/stringUtils"
import { getProfileErrorMessage, parseApiError, mapIndexedFieldErrors } from "../../../utils/profileErrorHelper"
import { BottomErrorBanner } from "../../../components/student/BottomErrorBanner"
import { AdminSectionLockControl } from "../../../components/student/AdminSectionLockControl"

const TRACK_SECTION_KEYS = []
/** Sections that return an array from the API - use [] as initial/fallback so form shows instead of spinner. */
const ARRAY_SECTION_KEYS = ["academics", "projects", "internships", "trainings", "certifications", "publications", "extra-curricular", "other-experiences", "family", "summer_immersion", "summer_internship"]
const FILE_UPLOAD_SECTIONS = ["education", "academics", "certifications", "internships", "summer-internship", "summer_internship", "summer-immersion", "summer_immersion", "trainings", "publications", "extra-curricular", "other-experiences"]

/** Shake keyframe for Save button when there are validation errors. */
const shakeKeyframes = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
`

/** When on a placement track section, gate access by batch policy; redirect to personal profile if not allowed. */
function PlacementTrackGate({ sectionKey, children }) {
  const navigate = useNavigate()
  const { policy, loading } = usePlacementTrackPolicy()
  useEffect(() => {
    if (loading || !policy) return
    const allowed = policy[sectionKey]
    if (!allowed) {
      navigate("/student/profile/personal", { replace: true })
    }
  }, [sectionKey, policy, loading, navigate])
  if (loading) return <Center h="50vh"><Spinner size="xl" color="#d4a960" /></Center>
  if (policy && !policy[sectionKey]) return null
  return children
}

/* eslint-disable-next-line no-unused-vars -- FormComponent is used in JSX as <FormComponent /> */
export const GenericProfileSection = ({ sectionKey, FormComponent }) => {
  const { user } = useAuth()
  const profileView = useProfileView()
  const viewUsn = (profileView?.viewUsn || user?.usn || "").toString().trim().toUpperCase()
  const isReadOnly = profileView?.isReadOnly === true
  const isLocked = profileView?.isSectionLocked?.(sectionKey) === true
  const canEdit = profileView?.isAdminView === true || (!isReadOnly && !isLocked)
  const isOwnProfile = viewUsn && user?.usn && viewUsn === (user.usn || "").toString().trim().toUpperCase()
  const { fetchProfileSection, invalidateProfile } = useStudentDataCache()
  const usn = viewUsn || user?.usn
  const toast = useToast()

  const [data, setData] = useState(() => {
    if (sectionKey === "education") return { education_history: [], education_gaps: [] }
    if (ARRAY_SECTION_KEYS.includes(sectionKey)) return []
    if (sectionKey === "career") return {} // career is object; avoid null so form always renders
    return null
  })
  const [personalMeta, setPersonalMeta] = useState(() => null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingFiles, setPendingFiles] = useState({})
  const [lastFieldErrors, setLastFieldErrors] = useState(null)
  const [saveErrorBanner, setSaveErrorBanner] = useState({ show: false, title: "", description: "" })
  const [shakeTrigger, setShakeTrigger] = useState(0)

  const initialDataRef = useRef(null)
  const hasAutoEnteredEditRef = useRef(false)
  const loadInProgressRef = useRef(false)
  const userHasEditedRef = useRef(false)
  /** Ref holding latest section data so handleSave always sends current edits (avoids stale closure). */
  const latestDataRef = useRef(null)

  // When admin views a student profile, default to edit mode so all fields (e.g. Organisation Details) are editable without clicking Add/Edit
  useEffect(() => {
    if (hasAutoEnteredEditRef.current) return
    if (profileView?.isAdminView && canEdit && !isLocked) {
      hasAutoEnteredEditRef.current = true
      setIsEditing(true)
    }
  }, [profileView?.isAdminView, canEdit, isLocked])

  const hasPendingFiles = useMemo(() => {
    if (!FILE_UPLOAD_SECTIONS.includes(sectionKey) || !pendingFiles) return false
    return Object.keys(pendingFiles).length > 0
  }, [sectionKey, pendingFiles])

  const hasUnsavedChanges = useMemo(() => {
    if (!initialDataRef.current || !data) return false
    const dataChanged = JSON.stringify(initialDataRef.current) !== JSON.stringify(data)
    return dataChanged || hasPendingFiles
  }, [data, hasPendingFiles])

  // For academics: every semester entry must have Semester, Academic Year, SGPA, and Result Marksheet.
  // Current-semester entry does not require marksheet unless student is in final year (Sem 8) or after graduation.
  const hasValidAcademicsEntry = useMemo(() => {
    if (sectionKey !== "academics" || !data) return true
    const arr = Array.isArray(data) ? data : []
    if (arr.length === 0) return true // Empty is valid (no data or clearing)
    const currentSem = personalMeta?.currentSemester ?? personalMeta?.current_semester
    const yoj = personalMeta?.yearOfJoining ?? personalMeta?.year_of_joining
    const currentYear = new Date().getFullYear()
    const canUploadCurrentSem = (Number(currentSem) >= 8) || (yoj != null && yoj !== "" && currentYear >= Number(yoj) + 4)
    return arr.every((item) => {
      if (!item || typeof item !== "object") return false
      const sem = item.semester
      const year = item.academicYear ?? item.academic_year
      const sgpa = item.sgpa ?? item.result_in_sgpa
      const links = item.resultUploadLink ?? item.provisional_result_upload_links
      const hasMarksheet = Array.isArray(links)
        ? links.some(l => l && String(l).trim() !== "")
        : (typeof links === "string" && links.trim() !== "")
      const isCurrentSemester = sem != null && String(sem).trim() !== "" && Number(sem) === Number(currentSem)
      const marksheetNotRequired = isCurrentSemester && !canUploadCurrentSem
      return (
        sem !== undefined && sem !== null && String(sem).trim() !== "" &&
        year !== undefined && year !== null && String(year).trim() !== "" &&
        sgpa !== undefined && sgpa !== null && String(sgpa).trim() !== "" &&
        (hasMarksheet || marksheetNotRequired)
      )
    })
  }, [sectionKey, data, personalMeta])

  // For education: each non-empty entry must have Level, Institute, Board, City, Year, Result Type, Result Value, Subjects, and marksheet.
  // Completely empty entries are allowed (they are filtered out on save).
  const hasValidEducationEntry = useMemo(() => {
    if (sectionKey !== "education" || !data) return true
    const arr = Array.isArray(data?.education_history) ? data.education_history : []
    if (arr.length === 0) return true
    return arr.every((item, index) => {
      if (!item || typeof item !== "object") return false
      const level = String(item.educationLevel ?? item.education_level ?? "").trim()
      const institute = String(item.instituteName ?? item.institute_name ?? "").trim()
      const board = String(item.board ?? "").trim()
      const city = String(item.city ?? "").trim()
      const yearVal = item.yearOfPassing ?? item.year_of_passing
      const yearOk = yearVal !== undefined && yearVal !== null && String(yearVal).trim() !== ""
      const resultType = String(item.resultType ?? item.result_type ?? "").trim()
      const resultVal = item.result ?? item.result_value
      const resultOk = resultVal !== undefined && resultVal !== null && String(resultVal).trim() !== ""
      const subjects = String(item.subjects ?? "").trim()
      const fileFromPending = pendingFiles && (pendingFiles[`history-${String(index)}`] ?? pendingFiles[`history-${index}`])
      const hasFile = !!(item.marksheet_file || item.proofFile || fileFromPending)
      // Treat completely empty row as valid (will be filtered on save)
      const isEmpty = level === "" && institute === "" && board === "" && city === "" && !yearOk && resultType === "" && !resultOk && subjects === "" && !hasFile
      if (isEmpty) return true
      return (
        level !== "" && institute !== "" && board !== "" && city !== "" &&
        yearOk && resultType !== "" && resultOk && subjects !== "" && hasFile
      )
    })
  }, [sectionKey, data, pendingFiles])

  // Build list of missing education fields per entry (for error message). Skip completely empty entries. Reserved for future use.
  const _getEducationValidationErrors = useCallback(() => {
    if (sectionKey !== "education" || !data) return []
    const arr = Array.isArray(data?.education_history) ? data.education_history : []
    const errors = []
    arr.forEach((item, index) => {
      if (!item || typeof item !== "object") return
      const level = String(item.educationLevel ?? item.education_level ?? "").trim()
      const institute = String(item.instituteName ?? item.institute_name ?? "").trim()
      const board = String(item.board ?? "").trim()
      const city = String(item.city ?? "").trim()
      const yearVal = item.yearOfPassing ?? item.year_of_passing
      const yearOk = yearVal !== undefined && yearVal !== null && String(yearVal).trim() !== ""
      const resultType = String(item.resultType ?? item.result_type ?? "").trim()
      const resultVal = item.result ?? item.result_value
      const resultOk = resultVal !== undefined && resultVal !== null && String(resultVal).trim() !== ""
      const subjects = String(item.subjects ?? "").trim()
      const fileFromPending = pendingFiles && (pendingFiles[`history-${String(index)}`] ?? pendingFiles[`history-${index}`])
      const hasFile = !!(item.marksheet_file || item.proofFile || fileFromPending)
      const isEmpty = level === "" && institute === "" && board === "" && city === "" && !yearOk && resultType === "" && !resultOk && subjects === "" && !hasFile
      if (isEmpty) return
      const entryNum = index + 1
      const missing = []
      if (!level) missing.push("Education Level")
      if (!institute) missing.push("Institute Name")
      if (!board) missing.push("Board")
      if (!city) missing.push("City")
      if (!yearOk) missing.push("Year of Passing")
      if (!resultType) missing.push("Result Type")
      if (!resultOk) missing.push("Result Value")
      if (!subjects) missing.push("Subjects")
      if (!hasFile) missing.push("Marksheet/Certificate file")
      if (missing.length) {
        const hint = level || institute ? ` (${[level, institute].filter(Boolean).join(" – ")})` : ""
        errors.push(`Entry ${entryNum}${hint}: ${missing.join(", ")}`)
      }
    })
    return errors
  }, [sectionKey, data, pendingFiles])

  // Helpers: reasonable text = at least 2 chars, must contain at least one letter (reject pure digits/garbage).
  const isReasonableText = (val, minLen = 2) => {
    const s = (val ?? "").toString().trim()
    if (s.length < minLen) return false
    return /[a-zA-Z]/.test(s) && !/^\d+$/.test(s)
  }
  /** Normalize date to YYYY-MM-DD for validation. Accepts Date, YYYY-MM-DD, ISO with T, or MM/DD/YYYY. */
  const normalizeDateForValidation = (val) => {
    if (val == null || val === "") return ""
    if (typeof val === "object" && val instanceof Date && !Number.isNaN(val.getTime())) {
      const y = val.getFullYear()
      const m = val.getMonth() + 1
      const d = val.getDate()
      if (y >= 1900 && y <= 2100) return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      return ""
    }
    const raw = String(val).trim()
    const fromIso = raw.split("T")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromIso)) return fromIso
    const mmddyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mmddyyyy) {
      const [, mm, dd, yyyy] = mmddyyyy
      const m = parseInt(mm, 10)
      const d = parseInt(dd, 10)
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return yyyy + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0")
      }
    }
    const parsed = new Date(val)
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear()
      const m = parsed.getMonth() + 1
      const d = parsed.getDate()
      if (y >= 1900 && y <= 2100) return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    }
    return ""
  }
  const isValidInternshipDate = (val, allowFuture = false) => {
    if (val == null || val === "") return true
    const s = normalizeDateForValidation(val)
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
    const y = parseInt(s.slice(0, 4), 10)
    if (y < 1900 || y > 2100) return false
    const [yr, mo, day] = [s.slice(0, 4), s.slice(5, 7), s.slice(8, 10)].map(Number)
    const startDate = new Date(yr, mo - 1, day)
    // Reject impossible calendar dates (e.g. 2023-02-30) — Date rolls over, so ensure components match
    if (startDate.getFullYear() !== yr || startDate.getMonth() !== mo - 1 || startDate.getDate() !== day) return false
    if (!allowFuture) {
      // Compare calendar dates in local timezone so past dates like 2000-11-22 are not wrongly rejected
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      if (startDate.getTime() > todayStart.getTime()) return false
    }
    return true
  }

  // For internships: each entry must have organization, job role, proof document (saved or pending), start_date, end_date; end_date >= start_date.
  const hasValidInternshipsEntry = useMemo(() => {
    if (sectionKey !== "internships" || !data) return true
    const arr = Array.isArray(data) ? data : []
    if (arr.length === 0) return true
    return arr.every((item, i) => {
      if (!item || typeof item !== "object") return false
      const org = (item.organization ?? "").toString().trim()
      const role = (item.jobRole ?? item.job_role ?? "").toString().trim()
      if (!isReasonableText(org) || !isReasonableText(role)) return false
      const hasProof = !!(item.proof_document || item.proofDocument || (pendingFiles && (pendingFiles[String(i)] ?? pendingFiles[i])))
      if (!hasProof) return false
      const startDate = normalizeDateForValidation(item.startDate ?? item.start_date ?? "")
      const endDate = normalizeDateForValidation(item.endDate ?? item.end_date ?? "")
      if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return false
      if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return false
      if (!isValidInternshipDate(startDate, false)) return false
      if (!isValidInternshipDate(endDate, true)) return false
      if (new Date(endDate) < new Date(startDate)) return false
      const stipend = (item.stipend ?? "").toString().trim()
      if (stipend !== "") {
        const n = parseFloat(stipend)
        if (Number.isNaN(n) || n < 0 || n > 500000) return false
      }
      const dur = (item.durationMonths ?? item.duration_months ?? "").toString().trim()
      if (dur !== "") {
        const d = parseInt(dur, 10)
        if (Number.isNaN(d) || d < 1 || d > 99) return false
      }
      const location = (item.location ?? "").toString().trim()
      if (location.length > 0 && !isReasonableText(location, 1)) return false
      const mentor = (item.mentorName ?? item.mentor_name ?? "").toString().trim()
      if (mentor.length > 0 && (/\d/.test(mentor) || !isReasonableText(mentor, 1))) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isValidInternshipDate is a stable helper
  }, [sectionKey, data, pendingFiles])

  // Client-side internship field errors (same key shape as API: internships[i].field) for showing below fields.
  const getInternshipValidationErrors = useCallback(() => {
    if (sectionKey !== "internships" || !data) return {}
    const arr = Array.isArray(data) ? data : []
    const flat = {}
    arr.forEach((item, i) => {
      if (!item || typeof item !== "object") return
      const key = (f) => `internships[${i}].${f}`
      const org = (item.organization ?? "").toString().trim()
      const role = (item.jobRole ?? item.job_role ?? "").toString().trim()
      if (!org) flat[key("organization")] = "Organization is required."
      else if (!isReasonableText(org)) flat[key("organization")] = "Enter a valid organization name (at least 2 characters, include letters)."
      if (!role) flat[key("job_role")] = "Job role is required."
      else if (!isReasonableText(role)) flat[key("job_role")] = "Enter a valid job role (at least 2 characters, include letters)."
      const hasProof = !!(item.proof_document || item.proofDocument || (pendingFiles && (pendingFiles[String(i)] ?? pendingFiles[i])))
      if (org && role && !hasProof) flat[key("proof_document")] = "Kindly upload a proof of internship."
      const startDate = normalizeDateForValidation(item.startDate ?? item.start_date ?? "")
      const endDate = normalizeDateForValidation(item.endDate ?? item.end_date ?? "")
      if (!startDate) flat[key("start_date")] = "Start date is required."
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) flat[key("start_date")] = "Please select a valid start date (YYYY-MM-DD)."
      if (!endDate) flat[key("end_date")] = "End date is required."
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) flat[key("end_date")] = "Please select a valid end date (YYYY-MM-DD)."
      else if (!isValidInternshipDate(endDate, true)) flat[key("end_date")] = "End date must be between 1900 and 2100."
      if (startDate && endDate && isValidInternshipDate(startDate, false) && isValidInternshipDate(endDate, true)) {
        if (new Date(endDate) < new Date(startDate)) flat[key("end_date")] = "End date cannot be earlier than start date."
      }
      const stipend = (item.stipend ?? "").toString().trim()
      if (stipend !== "") {
        const n = parseFloat(stipend)
        if (Number.isNaN(n) || n < 0) flat[key("stipend")] = "Enter a valid stipend (0 or positive number)."
        else if (n > 500000) flat[key("stipend")] = "Stipend cannot exceed 5 lakh (5,00,000)."
      }
      const dur = (item.durationMonths ?? item.duration_months ?? "").toString().trim()
      if (dur !== "") {
        const d = parseInt(dur, 10)
        if (Number.isNaN(d) || d < 1 || d > 99) flat[key("duration_months")] = "Duration must be between 1 and 99 months."
      }
      const location = (item.location ?? "").toString().trim()
      if (location.length > 0 && !isReasonableText(location, 1)) flat[key("location")] = "Enter a valid location (include letters)."
      const mentor = (item.mentorName ?? item.mentor_name ?? "").toString().trim()
      if (mentor.length > 0) {
        if (/\d/.test(mentor)) flat[key("mentor_name")] = "Mentor name cannot contain numbers."
        else if (!isReasonableText(mentor, 1)) flat[key("mentor_name")] = "Enter a valid mentor name (include letters)."
      }
    })
    return flat
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isValidInternshipDate is a stable helper
  }, [sectionKey, data, pendingFiles])

  // Client-side training field errors (same key shape as API: trainings[i].field) for showing below fields.
  const getTrainingValidationErrors = useCallback(() => {
    if (sectionKey !== "trainings" || !data) return {}
    const arr = Array.isArray(data) ? data : []
    const flat = {}
    arr.forEach((item, i) => {
      if (!item || typeof item !== "object") return
      const key = (f) => `trainings[${i}].${f}`
      const title = (item.title ?? "").toString().trim()
      const institution = (item.institution ?? "").toString().trim()
      if (!title) flat[key("title")] = "Training/workshop title is required."
      if (!institution) flat[key("institution")] = "Institution/organization is required."
      const hasProof = !!(item.proof_document || item.proofDocument || (pendingFiles && (pendingFiles[String(i)] ?? pendingFiles[i])))
      if (title && institution && !hasProof) flat[key("proof_document")] = "Kindly upload a proof document."
      const startDate = normalizeDateForValidation(item.startDate ?? item.start_date ?? "")
      const endDate = normalizeDateForValidation(item.endDate ?? item.end_date ?? "")
      if (!startDate) flat[key("start_date")] = "Start date is required."
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) flat[key("start_date")] = "Please select a valid start date (YYYY-MM-DD)."
      if (!endDate) flat[key("end_date")] = "End date is required."
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) flat[key("end_date")] = "Please select a valid end date (YYYY-MM-DD)."
      else if (!isValidInternshipDate(endDate, true)) flat[key("end_date")] = "End date must be between 1900 and 2100."
      if (startDate && endDate && isValidInternshipDate(startDate, false) && isValidInternshipDate(endDate, true)) {
        if (new Date(endDate) < new Date(startDate)) flat[key("end_date")] = "End date cannot be earlier than start date."
      }
    })
    return flat
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isValidInternshipDate is a stable helper
  }, [sectionKey, data, pendingFiles])

  // Education gaps are now stored separately (student_education_gaps).

  // For trainings: each entry must have title, institution, proof (saved or pending), start_date, end_date; end_date >= start_date.
  const hasValidTrainingsEntry = useMemo(() => {
    if (sectionKey !== "trainings" || !data) return true
    const arr = Array.isArray(data) ? data : []
    if (arr.length === 0) return true
    return arr.every((item, index) => {
      if (!item || typeof item !== "object") return false
      const title = (item.title ?? "").toString().trim()
      const institution = (item.institution ?? "").toString().trim()
      const hasProof = !!(item.proof_document || item.proofDocument || (pendingFiles && pendingFiles[String(index)]))
      const startDate = normalizeDateForValidation(item.startDate ?? item.start_date ?? "")
      const endDate = normalizeDateForValidation(item.endDate ?? item.end_date ?? "")
      if (!title || !institution || !hasProof) return false
      if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return false
      if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return false
      if (!isValidInternshipDate(startDate, false) || !isValidInternshipDate(endDate, true)) return false
      if (new Date(endDate) < new Date(startDate)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isValidInternshipDate is a stable helper
  }, [sectionKey, data, pendingFiles])

  // Summer Immersion / Summer Internship: form is "empty" when 0 entries or every entry has no organization and no job role → disable Save
  const hasEmptySummerForm = useMemo(() => {
    if (sectionKey !== "summer_immersion" && sectionKey !== "summer_internship") return false
    const arr = Array.isArray(data) ? data : []
    if (arr.length === 0) return true
    const allEmpty = arr.every((item) => {
      if (!item || typeof item !== "object") return true
      const org = (item.organization ?? "").toString().trim()
      const role = (item.job_role ?? item.jobRole ?? "").toString().trim()
      return org === "" && role === ""
    })
    return allEmpty
  }, [sectionKey, data])

  // Education: enable Save when there are unsaved changes and all entries are valid (level, institute, board, city, year, result type/value, subjects, marksheet)
  // Internships & Trainings: allow Save click so validation runs on submit and field errors show below fields
  // Summer Immersion / Summer Internship: disable Save when form is entirely empty (0 entries or all entries empty)
  const isSaveDisabled =
    !hasUnsavedChanges ||
    (sectionKey === "education" && !hasValidEducationEntry) ||
    (sectionKey === "academics" && !hasValidAcademicsEntry) ||
    hasEmptySummerForm

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && 
      currentLocation.pathname !== nextLocation.pathname && 
      isEditing
  );

  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [hasUnsavedChanges]
    )
  );

  const fieldErrorsByRow = useMemo(() => {
    if (!lastFieldErrors) return null
    const prefixMap = {
      education: "education",
      academics: "academics",
      publications: "publications",
      certifications: "certifications",
      "extra-curricular": "extraCurricular",
      "other-experiences": "otherExperiences",
      internships: "internships",
      trainings: "trainings",
      family: "parents",
      "summer-immersion": "summer_immersion",
      summer_immersion: "summer_immersion",
      "summer-internship": "summer_internship",
      summer_internship: "summer_internship"
    }
    const prefix = prefixMap[sectionKey]
    if (!prefix) return lastFieldErrors
    return mapIndexedFieldErrors(lastFieldErrors, prefix)
  }, [lastFieldErrors, sectionKey])

  const loadSection = useCallback(async () => {
    if (!viewUsn) return
    if (loadInProgressRef.current) return
    loadInProgressRef.current = true
    setLoadError(null)
    setLoading(true)
    const startedAt = Date.now()
    const MIN_LOADING_MS = 200
    try {
      let result
      if (isOwnProfile) {
        invalidateProfile(sectionKey)
        result = await fetchProfileSection(viewUsn, sectionKey, true)
      } else {
        if (sectionKey === 'academics') {
          const [acadData, personalData] = await Promise.all([
            StudentProfileService.getSection(viewUsn, sectionKey),
            StudentProfileService.getSection(viewUsn, 'personal')
          ])
          result = { data: Array.isArray(acadData) ? acadData : (acadData?.data || []), personalMeta: personalData || {} }
        } else {
          result = await StudentProfileService.getSection(viewUsn, sectionKey)
        }
      }
      if (userHasEditedRef.current) return
      userHasEditedRef.current = false

      if (sectionKey === 'academics' && result?.data !== undefined) {
        const rawAcademics = result.data || []
        const meta = result.personalMeta || {}
        setData(rawAcademics)
        initialDataRef.current = rawAcademics
        latestDataRef.current = rawAcademics
        setPersonalMeta(meta)
      } else {
        const fallback = ARRAY_SECTION_KEYS.includes(sectionKey) ? [] : (sectionKey === 'family' ? [] : {})
        let d = (result != null && result !== true) ? result : fallback
        if (sectionKey === "career" && (d == null || Array.isArray(d))) d = (Array.isArray(d) && d[0]) ? d[0] : {}
        setData(d)
        initialDataRef.current = d
        latestDataRef.current = d
      }
    } catch (error) {
      const msg = getProfileErrorMessage(error)
      if (sectionKey === 'summer_immersion' || sectionKey === 'summer_internship') {
        console.error('[Summer Immersion] Load error:', { sectionKey, message: msg, error: error?.message });
      }
      setLoadError(msg)
      toast({
        title: "Error loading data",
        description: msg,
        status: "error",
        duration: 5000,
        isClosable: true
      })
      const fallback = ARRAY_SECTION_KEYS.includes(sectionKey) ? [] : (sectionKey === "family" ? [] : {})
      const fallbackData = sectionKey === "career" ? {} : fallback
      setData(fallbackData)
      initialDataRef.current = fallbackData
      latestDataRef.current = fallbackData
    } finally {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      setTimeout(() => {
        setLoading(false)
        loadInProgressRef.current = false
      }, remaining)
    }
  }, [viewUsn, isOwnProfile, sectionKey, invalidateProfile, fetchProfileSection, toast])

  useEffect(() => {
    if (!viewUsn) return
    loadSection()
  }, [viewUsn, loadSection])

  const handleUpdate = (newData) => {
    userHasEditedRef.current = true
    latestDataRef.current = newData
    setData(newData)
    // Clear stale validation errors when user edits so fixing a field removes the error immediately
    if (lastFieldErrors && Object.keys(lastFieldErrors).length > 0) setLastFieldErrors(null)
  }

  const handleFileSelect = useCallback(async (index, file) => {
    if (sectionKey === "academics" && usn && Array.isArray(data)) {
      try {
        const result = await StudentProfileService.uploadFile(usn, file, { folder: "academics" })
        const url = result?.url || result?.path
        if (url) {
          setData((prev) => {
            const next = [...prev]
            const target = next[index]
            if (target) {
              next[index] = { ...target, provisional_result_upload_links: [url], resultUploadLink: [url] }
            }
            return next
          })
          toast({
            title: "File uploaded",
            description: "Click Save Changes to save to your profile.",
            status: "success",
            duration: 3000,
            isClosable: true
          })
        } else {
          toast({
            title: "Upload Failed",
            description: "Server did not return a file URL. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true
          })
        }
      } catch (e) {
        const msg = e?.message || "Could not upload file."
        toast({
          title: "Upload Failed",
          description: msg,
          status: "error",
          duration: 6000,
          isClosable: true
        })
        throw e
      }
      return
    }
    setPendingFiles((prev) => ({
      ...prev,
      [sectionKey === "education" ? `history-${index}` : index]: file
    }))
  }, [sectionKey, usn, toast, data])

  const handleSave = async () => {
      if (!canEdit) return
      console.log('[GenericProfileSection.handleSave] START', { sectionKey, hasUnsavedChanges });
      if (!hasUnsavedChanges) {
        console.log('[GenericProfileSection.handleSave] SKIP - no unsaved changes');
        return
      }
      
      setSaving(true)
      try {
          // Academics: every semester entry must have Semester, Academic Year, SGPA, and Result Marksheet (empty array is valid)
          if (sectionKey === "academics") {
              const arr = Array.isArray(data) ? data : []
              const hasValid = arr.length === 0 || arr.every((item) => {
                  if (!item || typeof item !== "object") return false
                  const sem = item.semester
                  const year = item.academicYear ?? item.academic_year
                  const sgpa = (item.sgpa ?? item.result_in_sgpa)?.toString().trim()
                  const links = item.resultUploadLink ?? item.provisional_result_upload_links
                  const hasMarksheet = Array.isArray(links)
                      ? links.some(l => l && String(l).trim() !== "")
                      : (links != null && String(links).trim() !== "")
                  
                  return (
                      sem != null && String(sem).trim() !== "" &&
                      year != null && String(year).trim() !== "" &&
                      sgpa != null && sgpa !== "" &&
                      hasMarksheet
                  )
              })
              if (!hasValid) {
                  setSaveErrorBanner({ show: true, title: "Error saving data", description: "Please enter all required fields including SGPA and Marksheet for each semester." })
                  setSaving(false)
                  return
              }
          }

          // Education: validate required fields before save
          if (sectionKey === "education" && !hasValidEducationEntry) {
              setSaveErrorBanner({
                show: true,
                title: "Error saving data",
                description: "Please correct the errors below."
              })
              return
          }

          // Education gaps are validated and saved as a separate list now.

          // Internships: validate on submit; show field-wise errors and banner (no toast — use Alert like contact page)
          if (sectionKey === "internships" && !hasValidInternshipsEntry) {
              setLastFieldErrors(getInternshipValidationErrors())
              setShakeTrigger((t) => t + 1)
              setSaveErrorBanner({
                show: true,
                title: "Error saving data",
                description: "Please correct the errors below."
              })
              return
          }

          // Trainings: validate on submit; show field-wise errors below fields
          if (sectionKey === "trainings" && !hasValidTrainingsEntry) {
              console.log('[GenericProfileSection.handleSave] trainings VALIDATION FAILED', { hasValidTrainingsEntry, errors: getTrainingValidationErrors() });
              setLastFieldErrors(getTrainingValidationErrors())
              setShakeTrigger((t) => t + 1)
              setSaveErrorBanner({
                show: true,
                title: "Error saving data",
                description: "Please correct the errors below."
              })
              return
          }

          // Use latest data ref for array sections so we always send current edits (avoids stale closure on Save)
          const sourceData = ARRAY_SECTION_KEYS.includes(sectionKey) ? (latestDataRef.current ?? data) : data
          let payload = sourceData

          // Handle file uploads for different sections
          if (sectionKey === "education" && usn && data && typeof data === "object" && !Array.isArray(data)) {
              const historyArr = Array.isArray(data.education_history) ? data.education_history : []
              const updatedHistory = [...historyArr]
              const entries = Object.entries(pendingFiles || {}).filter(([k]) => String(k).startsWith('history-'))

              for (const [key, file] of entries) {
                  const index = Number(String(key).replace('history-', ''))
                  const target = updatedHistory[index]
                  if (!target || !file) continue
                  try {
                      const result = await StudentProfileService.uploadFile(usn, file, { folder: "education" })
                      const url = result?.url || result?.path
                      if (url) updatedHistory[index] = { ...target, marksheet_file: url }
                  } catch (e) {
                      const msg = e?.message || "Error uploading one of the files. Please try again."
                      toast({ title: "Upload Failed", description: msg, status: "error", duration: 5000, isClosable: true })
                      return false
                  }
              }

              payload = { ...data, education_history: updatedHistory }
              setData(payload)
          } else if (sectionKey === "academics" && usn && Array.isArray(data)) {
              const updatedItems = [...data]
              const entries = Object.entries(pendingFiles || {})

              for (const [key, file] of entries) {
                  const index = Number(key)
                  const target = updatedItems[index]
                  if (!target || !file) continue

                  try {
                      const result = await StudentProfileService.uploadFile(usn, file, { folder: "academics" })
                      const url = result?.url || result?.path
                      if (url) updatedItems[index] = { ...target, provisional_result_upload_links: [url], resultUploadLink: [url] }
                  } catch (e) {
                      const msg = e?.message || "Error uploading one of the files. Please try again."
                      toast({ title: "Upload Failed", description: msg, status: "error", duration: 5000, isClosable: true })
                      return false
                  }
              }

              payload = updatedItems
              setData(updatedItems)
          } else if (sectionKey === "certifications" && usn && Array.isArray(data)) {
              // Handle certifications file uploads
              const updatedItems = [...data]
              const entries = Object.entries(pendingFiles || {})
              
              for (const [key, file] of entries) {
                  const index = Number(key)
                  const target = updatedItems[index]
                  if (!target || !file) continue

                  try {
                      const result = await StudentProfileService.uploadFile(usn, file, { folder: "certifications" })
                      const url = result?.url || result?.path
                      if (url) {
                          updatedItems[index] = { ...target, proof_document: url, proofDocument: url }
                      }
                  } catch {
                      toast({
                          title: "Upload Failed",
                          description: `Error uploading file for certification ${index + 1}. Please try again.`,
                          status: "error",
                          duration: 5000,
                          isClosable: true
                      })
                      return false
                  }
              }

              payload = updatedItems
              setData(updatedItems)
          } else if ((sectionKey === "internships" || sectionKey === "summer-internship" || sectionKey === "summer_internship" ||
                      sectionKey === "summer-immersion" || sectionKey === "summer_immersion" ||
                      sectionKey === "trainings" || sectionKey === "publications" || sectionKey === "extra-curricular" || 
                      sectionKey === "other-experiences") && usn) {
              // Handle file uploads for various sections (payload is already latest data for array sections)
              const sectionArrayKey = {
                "internships": "internships", "summer-internship": "summerInternship", "summer_internship": "summerInternship",
                "summer-immersion": "summerImmersion", "summer_immersion": "summerImmersion",
                "trainings": "trainings", "publications": "publications", "extra-curricular": "extraCurricular", "other-experiences": "otherExperiences"
              }[sectionKey]
              const dataArray = Array.isArray(payload) ? payload : (sectionArrayKey && payload?.[sectionArrayKey] ? payload[sectionArrayKey] : [])
              const updatedItems = [...dataArray]
              const entries = Object.entries(pendingFiles || {})
              
              const folderMap = {
                  "internships": "internships",
                  "summer-internship": "summer-internship",
                  "summer_internship": "summer-internship",
                  "summer-immersion": "summer-immersion",
                  "summer_immersion": "summer-immersion",
                  "trainings": "trainings",
                  "publications": "publications",
                  "extra-curricular": "extra-curricular",
                  "other-experiences": "other-experiences"
              }
              const folder = folderMap[sectionKey] || "uploads"
              
              for (const [key, file] of entries) {
                  const index = Number(key)
                  const target = updatedItems[index]
                  if (!target || !file) continue

                  try {
                      const result = await StudentProfileService.uploadFile(usn, file, { folder })
                      const url = result?.url || result?.path
                      if (url) {
                          // Different sections use different field names
                          if (sectionKey === "publications") {
                              updatedItems[index] = { ...target, evidence_document: url, evidenceDocument: url }
                          } else {
                              updatedItems[index] = { ...target, proof_document: url, proofDocument: url }
                          }
                      }
                  } catch (e) {
                      const msg = e?.message || (typeof e === 'string' ? e : 'Upload failed')
                      toast({
                          title: "Upload Failed",
                          description: msg,
                          status: "error",
                          duration: 6000,
                          isClosable: true,
                          position: "top"
                      })
                      return false
                  }
              }

              payload = Array.isArray(payload) ? updatedItems : (sectionArrayKey ? { ...payload, [sectionArrayKey]: updatedItems } : updatedItems)
              latestDataRef.current = payload
              setData(payload)
          }

          // For academics array: remove undefined entries so toSnakeCase never sees undefined
          if (sectionKey === "academics" && Array.isArray(payload)) {
              payload = payload.filter((item) => item != null && typeof item === "object")
          }

          // For education: filter out completely empty entries in both lists (history + gaps)
          if (sectionKey === "education" && payload && typeof payload === "object" && !Array.isArray(payload)) {
              const hist = Array.isArray(payload.education_history) ? payload.education_history : []
              const gaps = Array.isArray(payload.education_gaps) ? payload.education_gaps : []
              const filteredHist = hist.filter((item) => {
                  if (!item || typeof item !== "object") return false
                  const level = (item.educationLevel ?? item.education_level ?? "").toString().trim()
                  const institute = (item.instituteName ?? item.institute_name ?? "").toString().trim()
                  const hasAny = level !== "" || institute !== "" || (item.board && String(item.board).trim() !== "") ||
                    (item.city && String(item.city).trim() !== "") || (item.yearOfPassing ?? item.year_of_passing) != null ||
                    (item.resultType ?? item.result_type) !== "" || (item.result ?? "").toString().trim() !== "" ||
                    (item.subjects ?? "").toString().trim() !== "" || (item.marksheet_file ?? item.proofFile ?? "").toString().trim() !== ""
                  return hasAny
              })
              const filteredGaps = gaps.filter((item) => {
                  if (!item || typeof item !== "object") return false
                  const start = (item.gap_start_date ?? item.gapStartDate ?? "").toString().trim()
                  const end = (item.gap_end_date ?? item.gapEndDate ?? "").toString().trim()
                  const reason = (item.gap_reason ?? item.gapReason ?? "").toString().trim()
                  const remarks = (item.remarks ?? "").toString().trim()
                  return start !== "" || end !== "" || reason !== "" || remarks !== ""
              })
              payload = { ...payload, education_history: filteredHist, education_gaps: filteredGaps }
          }

          // For summer immersion / summer internship: validate required fields and start/end dates; block save on any error
          if ((sectionKey === "summer_immersion" || sectionKey === "summer-internship" || sectionKey === "summer_internship") && Array.isArray(payload)) {
              const key = (i, f) => sectionKey === "summer_immersion" ? `summer_immersion[${i}].${f}` : `summer_internship[${i}].${f}`
              const fe = {}
              payload.forEach((item, i) => {
                  if (!item || typeof item !== "object") return
                  const jobRole = (item.job_role ?? item.jobRole ?? "").toString().trim()
                  const org = (item.organization ?? (item.Organization ?? "")).toString().trim()
                  if (org === "") fe[key(i, "organization")] = "Organization is required."
                  if (jobRole === "") fe[key(i, "job_role")] = "Job role is required."
                  const startDate = normalizeDateForValidation(item.start_date ?? item.startDate ?? "")
                  const endDate = normalizeDateForValidation(item.end_date ?? item.endDate ?? "")
                  if (startDate) {
                      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) fe[key(i, "start_date")] = "Enter a valid start date (YYYY-MM-DD)."
                      else if (!isValidInternshipDate(startDate, false)) fe[key(i, "start_date")] = "Start date must be between 1900 and today (not in the future)."
                  }
                  if (endDate) {
                      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) fe[key(i, "end_date")] = "Enter a valid end date (YYYY-MM-DD)."
                      else if (!isValidInternshipDate(endDate, true)) fe[key(i, "end_date")] = "End date must be between 1900 and 2100."
                  }
                  const hasStartError = !!fe[key(i, "start_date")]
                  const hasEndFormatError = !!fe[key(i, "end_date")]
                  if (!hasStartError && !hasEndFormatError && startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && isValidInternshipDate(startDate, false) && isValidInternshipDate(endDate, true)) {
                      if (new Date(endDate) < new Date(startDate)) fe[key(i, "end_date")] = "End date cannot be earlier than start date."
                  }
              })
              const beforeCount = payload.length
              payload = payload.filter((item) => {
                  if (!item || typeof item !== "object") return false
                  const jobRole = (item.job_role ?? item.jobRole ?? "").toString().trim()
                  const org = (item.organization ?? (item.Organization ?? "")).toString().trim()
                  if (jobRole === "" || org === "") return false
                  const startDate = normalizeDateForValidation(item.start_date ?? item.startDate ?? "")
                  const endDate = normalizeDateForValidation(item.end_date ?? item.endDate ?? "")
                  if (startDate && !isValidInternshipDate(startDate, false)) return false
                  if (endDate && !isValidInternshipDate(endDate, true)) return false
                  if (startDate && endDate && new Date(endDate) < new Date(startDate)) return false
                  return true
              })
              if (Object.keys(fe).length > 0) {
                  setLastFieldErrors(fe)
                  setShakeTrigger((t) => t + 1)
                  setSaveErrorBanner({
                    show: true,
                    title: "Validation error",
                    description: "Please fix the errors highlighted below."
                  })
                  setSaving(false)
                  return false
              }
              if (beforeCount > 0 && payload.length === 0) {
                  setSaveErrorBanner({
                    show: true,
                    title: "Validation error",
                    description: "Please fill Organization and Job Role for at least one entry."
                  })
                  setSaving(false)
                  return false
              }
          }

          // For publications: filter out rows missing required fields; ensure author_count >= 1
          if (sectionKey === "publications" && Array.isArray(payload)) {
              payload = payload
                  .filter((item) => {
                      if (!item || typeof item !== "object") return false
                      const title = (item.title ?? "").toString().trim()
                      const pubType = (item.publication_type ?? item.publicationType ?? "").toString().trim()
                      return title !== "" && pubType !== ""
                  })
                  .map((item) => {
                      const ac = item.author_count ?? item.authorCount
                      const authorCount = (ac != null && ac !== "" && parseInt(String(ac), 10) >= 1)
                          ? parseInt(String(ac), 10) : 1
                      return { ...item, author_count: authorCount, authorCount: authorCount }
                  })
          }

          // Summer Immersion / Summer Internship: ensure each item has organization, job_role, and YYYY-MM-DD dates
          if ((sectionKey === "summer_immersion" || sectionKey === "summer_internship") && Array.isArray(payload)) {
            payload = payload.map((item) => {
              if (!item || typeof item !== "object") return item
              const org = (item.organization ?? item.Organization ?? "").toString().trim()
              const role = (item.job_role ?? item.jobRole ?? "").toString().trim()
              const startNorm = normalizeDateForValidation(item.start_date ?? item.startDate ?? "")
              const endNorm = normalizeDateForValidation(item.end_date ?? item.endDate ?? "")
              return {
                ...item,
                organization: org || (item.organization ?? item.Organization ?? ""),
                job_role: role || (item.job_role ?? item.jobRole ?? ""),
                jobRole: role || (item.jobRole ?? item.job_role ?? ""),
                ...(startNorm && { start_date: startNorm, startDate: startNorm }),
                ...(endNorm && { end_date: endNorm, endDate: endNorm })
              }
            })
          }

          // Convert payload to snake_case for backend
          const snakeCasePayload = toSnakeCase(payload)

          // Education: backend now accepts { education_history: [...], education_gaps: [...] }
          // (It still accepts legacy { education: [...] } for history-only.)
          const apiPayload = snakeCasePayload

          console.log('[GenericProfileSection.handleSave] BEFORE API', { sectionKey, apiPayload });
          await StudentProfileService.saveSection(viewUsn, sectionKey, apiPayload)
          console.log('[GenericProfileSection.handleSave] API SUCCESS - setting isEditing(false), Add/Edit button will show')
          initialDataRef.current = payload
          userHasEditedRef.current = false
          // Exit edit mode immediately so button shows Add/Edit even if refresh fails
          setIsEditing(false)
          setLastFieldErrors(null)
          setSaveErrorBanner({ show: false, title: "", description: "" })
          if (sectionKey === "education" || sectionKey === "academics" || sectionKey === "certifications" ||
              sectionKey === "internships" || sectionKey === "summer-internship" || sectionKey === "summer_internship" ||
              sectionKey === "summer-immersion" || sectionKey === "summer_immersion" ||
              sectionKey === "trainings" || sectionKey === "publications" || sectionKey === "extra-curricular" ||
              sectionKey === "other-experiences") {
            setPendingFiles({})
          }
          const fresh = await fetchProfileSection(viewUsn, sectionKey, true)
          if (sectionKey === 'academics' && fresh?.data !== undefined) {
            const academicsData = fresh.data || []
            setData(academicsData)
            setPersonalMeta(fresh.personalMeta || {})
            initialDataRef.current = academicsData
            latestDataRef.current = academicsData
          } else if (sectionKey === 'career') {
            const normalized = (fresh != null && !Array.isArray(fresh)) ? fresh : (Array.isArray(fresh) && fresh[0]) ? fresh[0] : (initialDataRef.current && typeof initialDataRef.current === 'object' && !Array.isArray(initialDataRef.current) ? initialDataRef.current : {})
            setData(normalized)
            initialDataRef.current = normalized
            latestDataRef.current = normalized
          } else if (fresh) {
            setData(fresh)
            initialDataRef.current = fresh
            latestDataRef.current = fresh
          }
          toast({
              title: "Changes saved successfully",
              description: "Refreshing profile...",
              status: "success",
              duration: 2000,
              isClosable: true
          })
          
          // Force immediate refresh to ensure data sync
          setTimeout(() => {
            window.location.reload()
          }, 500)
          
          return true
      } catch (error) {
          const parsed = parseApiError(error)
          console.error('[GenericProfileSection.handleSave] CAUGHT ERROR', { sectionKey, error: error?.message, parsed, fieldErrors: parsed.fieldErrors });
          const isServerError = parsed.status >= 500
          if (isServerError) {
            setLastFieldErrors(null)
          }
          if (sectionKey === 'summer_immersion' || sectionKey === 'summer_internship') {
            const sorted = parsed.fieldErrors ? Object.keys(parsed.fieldErrors).sort().reduce((a, k) => ({ ...a, [k]: parsed.fieldErrors[k] }), {}) : {};
            console.error('[Summer Immersion] Validation errors (a-z):', JSON.stringify(sorted, null, 2));
          }
          const message = isServerError
            ? (parsed.message || "Server error. Please try again later.")
            : (parsed.message || "Something went wrong. Please try again.")
          const useBottomBanner = ["education", "academics", "family", "internships", "trainings", "certifications", "publications", "extra-curricular", "other-experiences", "career", "summer_immersion", "summer_internship"].includes(sectionKey)
          if (!isServerError && parsed.fieldErrors && Object.keys(parsed.fieldErrors).length > 0) {
            setLastFieldErrors(parsed.fieldErrors)
            setShakeTrigger((t) => t + 1)
            const shortDescription = "Please fix the errors highlighted below."
            if (useBottomBanner) {
              setSaveErrorBanner({ show: true, title: "Validation error", description: shortDescription })
            } else {
              toast({
                title: "Validation errors found",
                description: shortDescription,
                status: "error",
                duration: 6000,
                isClosable: true,
                position: "top"
              })
            }
          } else {
            setLastFieldErrors(null)
            if (useBottomBanner) {
              setSaveErrorBanner({ show: true, title: isServerError ? "Server error" : "Error saving data", description: message })
            } else {
              toast({
                title: "Couldn't save",
                description: message,
                status: "error",
                duration: 6000,
                isClosable: true,
                position: "top"
              })
            }
          }
          return false
      } finally {
          setSaving(false)
      }
  }

  const hasDataToShow = data !== null && data !== undefined
  const showLoading = loading && !hasDataToShow
  if (loadError) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md" flexDirection={{ base: "column", md: "row" }} alignItems="stretch">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Could not load section</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" alignSelf="center" onClick={() => { setLoadError(null); loadSection(); }}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }
  if (showLoading || !hasDataToShow) {
      return (
        <Center h="50vh">
          <Spinner size="xl" color="#d4a960" />
        </Center>
      )
  }

  const mainContent = (
      <Box maxW="5xl" mx="auto" position="relative" pt={8}>
        {isLocked && (
          <Alert status="info" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>View only</AlertTitle>
              <AlertDescription>This section is locked by the administrator. You cannot edit it.</AlertDescription>
            </Box>
          </Alert>
        )}
        {sectionKey === "academics" && (canEdit && isEditing) && (
          <Alert status="warning" mb={6} borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              Marksheets cannot be edited once uploaded, so please upload carefully. Editing is only allowed if backlogs are present.
            </AlertDescription>
          </Alert>
        )}
        {["internships", "trainings", "certifications", "publications", "extra-curricular", "other-experiences", "career", "summer_immersion", "summer_internship"].includes(sectionKey) && lastFieldErrors && Object.keys(lastFieldErrors).length > 0 && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Validation errors found</AlertTitle>
              <AlertDescription>Please fix the errors highlighted below before saving.</AlertDescription>
            </Box>
          </Alert>
        )}
        <FormComponent 
          data={data} 
          onUpdate={handleUpdate} 
          isEditing={canEdit && isEditing} 
          fieldErrors={fieldErrorsByRow}
          {...(sectionKey === "education" || sectionKey === "academics" || sectionKey === "certifications" ||
              sectionKey === "internships" || sectionKey === "summer-internship" || sectionKey === "summer_internship" ||
              sectionKey === "summer-immersion" || sectionKey === "summer_immersion" ||
              sectionKey === "trainings" || sectionKey === "publications" || sectionKey === "extra-curricular" || 
              sectionKey === "other-experiences"
            ? { onFileSelect: handleFileSelect }
            : {})}
          {...(sectionKey === "academics" ? { personalDetails: personalMeta } : {})}
        />
        
        <HStack justifyContent="flex-end" mt={8} pb={10} spacing={3}>
            <AdminSectionLockControl sectionKey={sectionKey} />
            {canEdit && (
            <>
            {!isEditing ? (
                    <Button 
                        bg="#d4a960" 
                        color="#20343c" 
                        _hover={{ bg: "#c39850" }} 
                        size="lg"
                        onClick={() => setIsEditing(true)}
                    >
                        Add/Edit
                    </Button>
                ) : (
                    <>
                        <Button 
                            key={lastFieldErrors && Object.keys(lastFieldErrors).length > 0 ? `save-btn-${shakeTrigger}` : "save-btn"}
                            bg="#d4a960" 
                            color="#20343c" 
                            _hover={{ bg: "#c39850" }} 
                            size="lg"
                            isLoading={saving}
                            loadingText="Saving..."
                            onClick={handleSave}
                            isDisabled={isSaveDisabled}
                            sx={lastFieldErrors && Object.keys(lastFieldErrors).length > 0 ? { animation: `${shakeKeyframes} 0.5s ease-in-out` } : undefined}
                            title={
                              !hasUnsavedChanges
                                ? "No changes to save."
                                : hasEmptySummerForm
                                  ? "Fill empty fields"
                                  : sectionKey === "education" && !hasValidEducationEntry
                                  ? "Fill all required fields (Level, Institute, Board, City, Year of Passing, Result Type, Result Value, Subjects, Marksheet) for each entry to save."
                                  : sectionKey === "academics" && !hasValidAcademicsEntry
                                      ? "Enter SGPA and upload Result Marksheet for every semester to save."
                                      : sectionKey === "internships" && !hasValidInternshipsEntry
                                              ? "Fill Organization, Job Role and upload proof for each entry. Click Save to see errors below."
                                              : sectionKey === "trainings" && !hasValidTrainingsEntry
                                                  ? "Fill Title, Institution and upload proof for each training. Click Save to see errors below."
                                                  : undefined
                            }
                        >
                            Save Changes
                        </Button>
                        <Button 
                            ml={4}
                            variant="outline"
                            colorScheme="red"
                            size="lg"
                            onClick={() => {
                                userHasEditedRef.current = false;
                                const resetData = initialDataRef.current ?? (ARRAY_SECTION_KEYS.includes(sectionKey) ? [] : (sectionKey === "career" ? {} : null));
                                latestDataRef.current = resetData;
                                setData(resetData);
                                setPendingFiles({});
                                setLastFieldErrors(null);
                                setSaveErrorBanner({ show: false, title: "", description: "" });
                                setIsEditing(false);
                            }}
                            isDisabled={saving}
                        >
                            Cancel
                        </Button>
                    </>
                )
            }
            </>
            )}
        </HStack>

        {blocker.state === "blocked" && (
            <Modal isOpen={true} onClose={() => blocker.reset()} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Unsaved Changes</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>
                            You have unsaved changes. Do you want to save them before leaving?
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => blocker.reset()}>
                            Cancel
                        </Button>
                        <Button 
                            colorScheme="red" 
                            variant="outline" 
                            mr={3} 
                            onClick={() => blocker.proceed()}
                        >
                            Discard Changes
                        </Button>
                        <Button 
                            bg="#d4a960" 
                            color="#20343c"
                            _hover={{ bg: "#c39850" }}
                            isDisabled={isSaveDisabled}
                            title={isSaveDisabled ? "Complete required fields to save before leaving." : undefined}
                            onClick={async () => {
                                const success = await handleSave()
                                if (success) {
                                    blocker.proceed()
                                }
                            }}
                            isLoading={saving}
                        >
                            Save & Leave
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        )}
      </Box>
  )

  const wrappedContent = TRACK_SECTION_KEYS.includes(sectionKey)
    ? <PlacementTrackGate sectionKey={sectionKey}>{mainContent}</PlacementTrackGate>
    : mainContent

  // Internships: use only top Alert + field errors below fields (like contact page), no fixed bottom banner
  const showBottomBanner = ["education", "academics", "family", "internships", "trainings", "certifications", "publications", "extra-curricular", "other-experiences", "summer_immersion", "summer_internship"].includes(sectionKey) && saveErrorBanner.show
  return (
    <>
      <Box pb={showBottomBanner ? "72px" : 0}>{wrappedContent}</Box>
      {showBottomBanner && (
        <BottomErrorBanner
          title={saveErrorBanner.title || "Error saving data"}
          description={saveErrorBanner.description || "Please correct the errors below."}
          onClose={() => setSaveErrorBanner({ show: false, title: "", description: "" })}
          autoCloseSeconds={5}
        />
      )}
    </>
  )
}

export default GenericProfileSection
