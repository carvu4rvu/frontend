import { useEffect, useMemo, useState, useRef } from "react"
import "./AcademicsProfile.css"
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Textarea,
  useToast,
  FormControl,
  FormLabel,
  IconButton,
  Collapse,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react"
import { useAuth } from "../../../context/AuthContext"
import { useProfileView } from "../../../context/ProfileViewContext"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { getFileUrl } from "../../../utils/fileUrl"
import { FaTrash, FaChevronDown, FaPlus, FaGraduationCap, FaFolderOpen, FaLock, FaUnlock } from "react-icons/fa"
import { PlacementService } from "../../../services/placement.service"
import { StyledFileInput } from "../../../components/ui/StyledFileInput"

const CURRENT_YEAR = new Date().getFullYear()

const GRADE_OPTIONS = ["O", "A+", "A", "B", "C", "P", "F"]

const gradePointsMap = {
  O: 10,
  "A+": 9,
  A: 8,
  B: 7,
  C: 6,
  P: 5,
  F: 0,
}

const gradeFromPointsMap = Object.entries(gradePointsMap).reduce(
  (acc, [grade, points]) => {
    acc[points] = grade
    return acc
  },
  {},
)

const computeSgpa = (courses) => {
  if (!Array.isArray(courses) || courses.length === 0) {
    return { sgpa: null, totalCredits: 0, earnedCredits: 0, activeBacklogs: 0 }
  }
  let totalCredits = 0
  let weighted = 0
  let earnedCredits = 0
  let activeBacklogs = 0

  courses.forEach((c) => {
    const credits = Number(c.credits) || 0
    const gp = Number(
      c.grade_points != null && c.grade_points !== ""
        ? c.grade_points
        : gradePointsMap[(c.grade || "").toString().trim().toUpperCase()],
    )
    const grade =
      c.grade && c.grade !== ""
        ? c.grade.toString().trim().toUpperCase()
        : gradeFromPointsMap[gp]
    if (!credits || Number.isNaN(gp)) return
    totalCredits += credits
    weighted += credits * gp
    if (grade !== "F") earnedCredits += credits
    if (grade === "F") activeBacklogs += 1
  })

  if (!totalCredits) {
    return { sgpa: null, totalCredits: 0, earnedCredits: 0, activeBacklogs: 0 }
  }

  const sgpa = parseFloat((weighted / totalCredits).toFixed(2))
  return { sgpa, totalCredits, earnedCredits, activeBacklogs }
}

const computeCgpaFromAllSemesters = (semesters) => {
  if (!Array.isArray(semesters) || semesters.length === 0) return null
  let allCourses = []
  semesters.forEach((s) => {
    if (Array.isArray(s.courses)) {
      allCourses = allCourses.concat(s.courses)
    }
  })
  const { sgpa } = computeSgpa(allCourses)
  return sgpa
}

const computeAcademicYear = (yearOfJoining, semester) => {
  if (!yearOfJoining || !semester) return CURRENT_YEAR
  const yoj = Number(yearOfJoining)
  const sem = Number(semester)
  if (Number.isNaN(yoj) || Number.isNaN(sem) || sem < 1) return CURRENT_YEAR
  return yoj + Math.floor((sem - 1) / 2)
}

/** True if at least one course row has code, title, or numeric credits (aligns with save payload rules). */
const hasMeaningfulCourses = (courses) => {
  if (!Array.isArray(courses) || courses.length === 0) return false
  return courses.some((c) => {
    const code = (c.course_code || "").toString().trim()
    const title = (c.course_title || "").toString().trim()
    const cr = c.credits
    const hasCredits = cr !== "" && cr != null && !Number.isNaN(Number(cr))
    return code !== "" || title !== "" || hasCredits
  })
}

export const AcademicsProfile = () => {
  const { user } = useAuth()
  const profileView = useProfileView()
  const viewUsn = (profileView?.viewUsn || user?.usn || "").toString().trim().toUpperCase()
  const isReadOnly = profileView?.isReadOnly === true
  const isLocked = profileView?.isSectionLocked?.("academics") === true
  const canEdit = profileView?.isAdminView === true || (!isReadOnly && !isLocked)
  const usn = viewUsn || user?.usn
  const { invalidateProfile, clearCache } = useStudentDataCache()
  const toast = useToast()

  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [personalMeta, setPersonalMeta] = useState(null)
  const [selectedSemesterId, setSelectedSemesterId] = useState(null)
  const [formAcademicYear, setFormAcademicYear] = useState("")
  const [formSemester, setFormSemester] = useState("")
  const [formCourses, setFormCourses] = useState([])
  const [hasActiveForm, setHasActiveForm] = useState(false)
  const [marksheetFile, setMarksheetFile] = useState(null)
  const [expandedSemesterId, setExpandedSemesterId] = useState(null)
  const [updatingLockSemester, setUpdatingLockSemester] = useState(null)
  const [requestReason, setRequestReason] = useState("")
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [unlockModalSemester, setUnlockModalSemester] = useState(null)
  const [pendingUnlockSemesters, setPendingUnlockSemesters] = useState(new Set())
  const { isOpen: isUnlockModalOpen, onOpen: onUnlockModalOpen, onClose: onUnlockModalClose } = useDisclosure()
  
  // Custom delete confirmation alert
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure()
  const [semesterToDelete, setSemesterToDelete] = useState(null)
  const cancelRef = useRef()

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = CURRENT_YEAR; y >= CURRENT_YEAR - 6; y -= 1) {
      years.push(y)
    }
    return years
  }, [])

  useEffect(() => {
    if (!usn) return
    ;(async () => {
      try {
        const data = await StudentProfileService.getSection(usn, "personal")
        setPersonalMeta(data || {})
      } catch {
        setPersonalMeta(null)
      }
    })()
  }, [usn])

  const loadSemesters = async () => {
    if (!usn) return
    setLoading(true)
    try {
      const data = await StudentProfileService.getAcademicSemesters(usn)
      let list = Array.isArray(data?.semesters) ? data.semesters : (Array.isArray(data) ? data : [])
      
      // Clean "broken" or "orphan" data:
      // 1. Remove entries with missing semester or year
      // 2. Remove entries with no courses
      // 3. Handle duplicate semester numbers (keep the one with most courses or latest ID)
      const semMap = new Map()
      list.forEach(s => {
        const semNum = Number(s.semester)
        if (Number.isNaN(semNum) || !s.academic_year) return // Broken record

        if (!hasMeaningfulCourses(s.courses)) return // Orphan: semester summary without course-wise rows

        if (!semMap.has(semNum)) {
          semMap.set(semNum, s)
        } else {
          const existing = semMap.get(semNum)
          const existingLen = Array.isArray(existing.courses) ? existing.courses.length : 0
          const currentLen = Array.isArray(s.courses) ? s.courses.length : 0
          if (currentLen > existingLen) {
            semMap.set(semNum, s)
          } else if (currentLen === existingLen && Number(s.id) > Number(existing.id)) {
            semMap.set(semNum, s)
          }
        }
      })
      list = Array.from(semMap.values()).sort((a, b) => Number(a.semester) - Number(b.semester))

      setSemesters(list)
      // Do not auto-create or auto-select a semester form;
      // if there was an active selection, keep it in sync, otherwise show only the list.
      if (selectedSemesterId != null && list.length > 0) {
        const match = list.find((s) => s.id === selectedSemesterId)
        if (match) {
          setFormAcademicYear(String(match.academic_year ?? ""))
          setFormSemester(String(match.semester ?? ""))
          setFormCourses(
            Array.isArray(match.courses) && match.courses.length > 0
              ? match.courses.map((c) => ({
                  course_code: c.course_code || "",
                  course_title: c.course_title || "",
                  credits: c.credits ?? "",
                  grade: c.grade || "",
                  grade_points: c.grade_points ?? "",
                }))
              : [
                  {
                    course_code: "",
                    course_title: "",
                    credits: "",
                    grade: "",
                    grade_points: "",
                  },
                ],
          )
          setHasActiveForm(true)
        } else {
          setHasActiveForm(false)
          setSelectedSemesterId(null)
        }
      }
    } catch (error) {
      toast({
        title: "Failed to load academics",
        description: error?.message || "Could not load academic performance.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSemesters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usn])

  const loadPendingUnlockRequests = async () => {
    if (!usn || profileView?.isAdminView) return
    try {
      const data = await PlacementService.getMySemesterUnlockRequests()
      const list = Array.isArray(data?.semesters) ? data.semesters : []
      setPendingUnlockSemesters(new Set(list))
    } catch {
      setPendingUnlockSemesters(new Set())
    }
  }

  useEffect(() => {
    loadPendingUnlockRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usn, profileView?.isAdminView])

  const handleSelectSemesterRow = (semesterRow) => {
    if (!semesterRow) return
    setSelectedSemesterId(semesterRow.id)
    setHasActiveForm(true)
    setExpandedSemesterId(semesterRow.id)
    setFormAcademicYear(String(semesterRow.academic_year ?? ""))
    setFormSemester(String(semesterRow.semester ?? ""))
    setFormCourses(
      Array.isArray(semesterRow.courses) && semesterRow.courses.length > 0
        ? semesterRow.courses.map((c) => ({
            course_code: c.course_code || "",
            course_title: c.course_title || "",
            credits: c.credits ?? "",
            grade: c.grade || "",
            grade_points: c.grade_points ?? "",
          }))
        : [
            {
              course_code: "",
              course_title: "",
              credits: "",
              grade: "",
              grade_points: "",
            },
          ],
    )
    setMarksheetFile(null)
  }

  const handleAddSemester = () => {
    const nextSemesterNumber =
      semesters.length === 0
        ? 1
        : Math.max(...semesters.map((s) => Number(s.semester) || 0), 0) + 1

    const currentSemMeta =
      personalMeta?.current_semester ?? personalMeta?.currentSemester
    if (currentSemMeta && nextSemesterNumber > Number(currentSemMeta)) {
      toast({
        title: "Cannot add future semester",
        description: `You can add up to your current semester (${currentSemMeta}) only.`,
        status: "warning",
        duration: 3500,
        isClosable: true,
      })
      return
    }

    const yearOfJoining =
      personalMeta?.year_of_joining ?? personalMeta?.yearOfJoining

    let defaultYear
    if (yearOfJoining) {
      defaultYear = computeAcademicYear(yearOfJoining, nextSemesterNumber)
    } else if (semesters.length > 0) {
      defaultYear = semesters[semesters.length - 1].academic_year || CURRENT_YEAR
    } else {
      defaultYear = CURRENT_YEAR
    }

    setSelectedSemesterId(null)
    setHasActiveForm(true)
    setFormAcademicYear(String(defaultYear))
    setFormSemester(String(nextSemesterNumber))
    setFormCourses([
      {
        course_code: "",
        course_title: "",
        credits: "",
        grade: "",
        grade_points: "",
      },
    ])
    setMarksheetFile(null)
    setExpandedSemesterId("draft")

    toast({
      title: "New semester ready",
      description: `Preset to Year ${defaultYear}, Semester ${nextSemesterNumber}.`,
      status: "info",
      duration: 2500,
      isClosable: true,
    })
  }

  const handleCourseChange = (index, field, value) => {
    setFormCourses((prev) => {
      const copy = [...prev]
      const current = copy[index] || {
        course_code: "",
        course_title: "",
        credits: "",
        grade: "",
        grade_points: "",
      }

      const updated = { ...current, [field]: value }

      // Auto-derive grade from grade_points when grade_points changes
      if (field === "grade_points") {
        const num = Number(value)
        if (!Number.isNaN(num) && gradeFromPointsMap[num]) {
          updated.grade = gradeFromPointsMap[num]
        }
      }

      copy[index] = updated
      return copy
    })
  }

  const handleAddCourseRow = () => {
    setFormCourses((prev) => [
      ...prev,
      {
        course_code: "",
        course_title: "",
        credits: "",
        grade: "",
        grade_points: "",
      },
    ])
  }

  const handleRemoveCourseRow = (index) => {
    setFormCourses((prev) => prev.filter((_, i) => i !== index))
  }

  const { sgpa: previewSgpa, totalCredits: previewTotalCredits, earnedCredits: previewEarnedCredits, activeBacklogs: previewActiveBacklogs } =
    useMemo(() => (hasActiveForm ? computeSgpa(formCourses) : {
      sgpa: null,
      totalCredits: 0,
      earnedCredits: 0,
      activeBacklogs: 0,
    }), [formCourses, hasActiveForm])

  const savedCgpa = useMemo(
    () => computeCgpaFromAllSemesters(semesters),
    [semesters],
  )

  const overallCgpa = useMemo(() => {
    if (!hasActiveForm) return savedCgpa
    return computeCgpaFromAllSemesters([
      ...semesters,
      {
        id: selectedSemesterId || "current",
        courses: formCourses,
      },
    ])
  }, [semesters, formCourses, selectedSemesterId, hasActiveForm, savedCgpa])

  const totalCreditsDisplay = useMemo(() => {
    let t = semesters.reduce((acc, s) => acc + (Number(s.total_credits) || 0), 0)
    if (hasActiveForm && !selectedSemesterId) t += previewTotalCredits
    return t
  }, [semesters, hasActiveForm, selectedSemesterId, previewTotalCredits])

  const earnedCreditsDisplay = useMemo(() => {
    let t = semesters.reduce((acc, s) => acc + (Number(s.earned_credits) || 0), 0)
    if (hasActiveForm && !selectedSemesterId) t += previewEarnedCredits
    return t
  }, [semesters, hasActiveForm, selectedSemesterId, previewEarnedCredits])

  const activeBacklogsDisplay = useMemo(() => {
    let t = semesters.reduce((acc, s) => acc + (Number(s.active_backlogs) || 0), 0)
    if (hasActiveForm && !selectedSemesterId) t += previewActiveBacklogs
    return t
  }, [semesters, hasActiveForm, selectedSemesterId, previewActiveBacklogs])

  const clearedBacklogsDisplay = useMemo(() => {
    return semesters.reduce((acc, s) => acc + (Number(s.cleared_backlogs) || 0), 0)
  }, [semesters])

  const displayList = useMemo(() => {
    const list = [...semesters]
    // Only show draft card when adding a new semester, not when viewing/expanding an existing one
    if (hasActiveForm && selectedSemesterId == null) {
      list.push({
        id: "draft",
        semester: formSemester,
        academic_year: formAcademicYear,
        sgpa: previewSgpa,
        total_credits: previewTotalCredits,
        earned_credits: previewEarnedCredits,
        active_backlogs: previewActiveBacklogs,
        courses: formCourses,
      })
    }
    return list
  }, [semesters, hasActiveForm, selectedSemesterId, formSemester, formAcademicYear, previewSgpa, previewTotalCredits, previewEarnedCredits, previewActiveBacklogs, formCourses])

  const handleToggleCard = (item) => {
    if (item.id === "draft") {
      if (expandedSemesterId === "draft") {
        setExpandedSemesterId(null)
        setHasActiveForm(false)
      } else {
        setExpandedSemesterId("draft")
      }
    } else {
      if (expandedSemesterId === item.id) {
        setExpandedSemesterId(null)
      } else {
        handleSelectSemesterRow(item)
      }
    }
  }

  const handleToggleSemesterLock = async (e, semNum) => {
    e.stopPropagation()
    if (!profileView?.isAdminView || !viewUsn || semNum == null || semNum < 1 || semNum > 8) return
    const field = `is_sem${Number(semNum)}_locked`
    const isLocked = profileView.editControl?.[field] === true
    setUpdatingLockSemester(semNum)
    try {
      await PlacementService.updateStudentProfileLocks(viewUsn, { [field]: !isLocked })
      await profileView.refetchEditControl?.()
      toast({
        title: isLocked ? "Semester unlocked" : "Semester locked",
        description: `Semester ${semNum} is now ${isLocked ? "editable" : "locked"} for the student.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: "Failed to update lock",
        description: err?.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setUpdatingLockSemester(null)
    }
  }

  const handleSaveSemester = async () => {
    if (!canEdit || !usn) {
      if (!usn) {
        toast({
          title: "Not logged in",
          description: "USN is required.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
      }
      return
    }

    const yearNum = Number(formAcademicYear)
    const semNum = Number(formSemester)

    if (!yearNum || Number.isNaN(yearNum)) {
      toast({
        title: "Academic year required",
        description: "Please enter a valid academic year.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }
    if (!semNum || Number.isNaN(semNum) || semNum < 1 || semNum > 8) {
      toast({
        title: "Semester required",
        description: "Semester must be between 1 and 8.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const cleanedCourses = formCourses
      .map((c) => ({
        course_code: (c.course_code || "").trim(),
        course_title: (c.course_title || "").trim(),
        credits:
          c.credits === "" || c.credits == null
            ? ""
            : Number(c.credits),
        grade: (c.grade || "").trim().toUpperCase(),
        grade_points:
          c.grade_points === "" || c.grade_points == null
            ? undefined
            : Number(c.grade_points),
      }))
      .filter(
        (c) =>
          c.course_code !== "" ||
          c.course_title !== "" ||
          (c.credits && !Number.isNaN(c.credits)),
      )

    if (cleanedCourses.length === 0) {
      toast({
        title: "Add at least one course",
        description: "Please add at least one course to save the semester.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const alreadyExists = semesters.some(
      (s) =>
        Number(s.academic_year) === yearNum &&
        Number(s.semester) === semNum,
    )
    if (!alreadyExists && !marksheetFile) {
      toast({
        title: "Marksheet required",
        description: "Please upload the semester result / marksheet image for new semesters.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      })
      return
    }

    // Frontend duplicate course check within the same semester
    const seenCodes = new Set()
    for (const c of cleanedCourses) {
      const code = c.course_code.toUpperCase()
      if (seenCodes.has(code)) {
        toast({
          title: "Duplicate course",
          description: `Course code ${code} is repeated in this semester. Please keep each course unique.`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        })
        return
      }
      seenCodes.add(code)
    }

    setSaving(true)
    try {
      let resultFileUrl = null
      if (marksheetFile) {
        const uploadResult = await StudentProfileService.uploadFile(usn, marksheetFile, {
          folder: "academics",
        })
        resultFileUrl = uploadResult?.url || uploadResult?.path
        if (!resultFileUrl) {
          toast({
            title: "Upload failed",
            description: "Marksheet image could not be uploaded. Please try again.",
            status: "error",
            duration: 4000,
            isClosable: true,
          })
          setSaving(false)
          return
        }
      }
      const payload = {
        academic_year: yearNum,
        semester: semNum,
        courses: cleanedCourses,
      }
      if (resultFileUrl) payload.result_file = resultFileUrl
      await StudentProfileService.saveAcademicSemester(usn, payload)
      await loadSemesters()
      setMarksheetFile(null)
      setExpandedSemesterId(null)
      setHasActiveForm(false)
      setSelectedSemesterId(null)
      invalidateProfile("academics")
      clearCache("dashboard")
      toast({
        title: "Semester saved",
        description: "Academic performance updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Failed to save semester",
        description:
          error?.message || "Server error while saving academic details.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSemester = (e, semesterId) => {
    e.stopPropagation()
    if (!canEdit || !usn || !semesterId || semesterId === "draft") return
    setSemesterToDelete(semesterId)
    onDeleteAlertOpen()
  }

  const confirmDeleteSemester = async () => {
    const semesterId = semesterToDelete
    if (!canEdit || !usn || !semesterId || semesterId === "draft") {
      onDeleteAlertClose()
      return
    }

    try {
      await StudentProfileService.deleteAcademicSemester(usn, semesterId)
      toast({
        title: "Semester deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      onDeleteAlertClose()
      await loadSemesters()
      invalidateProfile("academics")
      clearCache("dashboard")
    } catch (error) {
      toast({
        title: "Failed to delete semester",
        description: error?.message || "Server error while deleting record.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSemesterToDelete(null)
    }
  }

  const openUnlockModal = (semNum) => {
    setUnlockModalSemester(semNum)
    setRequestReason("")
    onUnlockModalOpen()
  }

  const closeUnlockModal = () => {
    onUnlockModalClose()
    setUnlockModalSemester(null)
    setRequestReason("")
  }

  const handleRequestUnlock = async () => {
    const semNum = unlockModalSemester
    if (!semNum) return
    const reason = (requestReason || "").toString().trim()
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for your unlock request.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }
    setRequestSubmitting(true)
    try {
      await PlacementService.createSemesterUnlockRequest(semNum, reason)
      setPendingUnlockSemesters((prev) => new Set([...prev, semNum]))
      closeUnlockModal()
      toast({
        title: "Request submitted",
        description: "Your unlock request has been sent. Admin will review it shortly.",
        status: "success",
        duration: 4000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: "Request failed",
        description: err?.message || "Could not submit unlock request.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setRequestSubmitting(false)
    }
  }

  const isFormExpanded = (item) =>
    item.id === "draft" ? expandedSemesterId === "draft" : expandedSemesterId == item.id

  const isSavedSemester = (item) => item != null && item.id !== "draft"

  const renderViewContent = (item, { isSemesterLocked, semNum } = {}) => {
    const courses = Array.isArray(item?.courses) ? item.courses : []
    return (
      <Box className="academics-semester-body">
        <Box className="academics-semester-body-divider" />
        <VStack align="stretch" spacing={4}>
          {item?.result_file && (
            <FormControl>
              <FormLabel fontSize="10px" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                Result / Marksheet
              </FormLabel>
              <Text as="a" href={getFileUrl(item.result_file)} target="_blank" rel="noopener noreferrer" className="academics-marksheet-link">
                View marksheet
              </Text>
            </FormControl>
          )}
          <Box className="academics-courses-table-wrap">
            <Table size="sm" className="academics-courses-table">
              <Thead>
                <Tr>
                  <Th>Course Code</Th>
                  <Th>Course Title</Th>
                  <Th data-numeric>Credits</Th>
                  <Th data-numeric>Grade Points</Th>
                  <Th>Grade</Th>
                </Tr>
              </Thead>
              <Tbody>
                {courses.length === 0 ? (
                  <Tr><Td colSpan={5} color="gray.600" py={4}>No courses</Td></Tr>
                ) : (
                  courses.map((c, idx) => (
                    <Tr key={idx}>
                      <Td>{c.course_code ?? "—"}</Td>
                      <Td>{c.course_title ?? "—"}</Td>
                      <Td isNumeric>{c.credits ?? "—"}</Td>
                      <Td isNumeric>{c.grade_points ?? "—"}</Td>
                      <Td className="grade-cell">{c.grade ?? "—"}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
          <Flex className="academics-form-stats" gap={4} pt={2} align="center" justify="space-between" flexWrap="wrap">
            <HStack spacing={4}>
              <Box className="academics-form-stat">
                <Text className="academics-form-stat-label">Semester Credits</Text>
                <Text className="academics-form-stat-value">{item?.total_credits ?? 0}</Text>
              </Box>
              <Box className="academics-form-stat">
                <Text className="academics-form-stat-label">SGPA</Text>
                <Text className="academics-form-stat-value">{item?.sgpa != null ? Number(item.sgpa).toFixed(2) : "—"}</Text>
              </Box>
            </HStack>
            {isSemesterLocked && !profileView?.isAdminView && viewUsn && user?.usn && viewUsn === (user.usn || "").toString().trim().toUpperCase() && (
              pendingUnlockSemesters.has(Number(semNum)) ? (
                <Text fontSize="sm" fontWeight="medium" color="orange.600" className="academics-requested-badge">
                  Requested for unlock
                </Text>
              ) : (
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<FaUnlock />}
                  onClick={() => openUnlockModal(semNum)}
                  className="academics-unlock-btn"
                >
                  Request Unlock
                </Button>
              )
            )}
          </Flex>
        </VStack>
      </Box>
    )
  }

  const renderFormContent = () => (
    <Box className="academics-semester-body">
      <Box className="academics-semester-body-divider" />
      <VStack align="stretch" spacing={4}>
        <FormControl>
          <FormLabel fontSize="10px" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wider">
            Result / Marksheet (image)
            {!selectedSemesterId && " (required for new semester)"}
          </FormLabel>
          <StyledFileInput
            accept="image/*,.pdf"
            onChange={(e) => setMarksheetFile(e.target.files?.[0] || null)}
            acceptLabel="Image, PDF"
            mt={2}
          />
          {marksheetFile && (
            <Text fontSize="xs" color="gray.700" mt={1}>
              Selected: {marksheetFile.name}
            </Text>
          )}
        </FormControl>

        <Box className="academics-courses-table-wrap">
          <Table size="sm" className="academics-courses-table">
            <Thead>
              <Tr>
                <Th>Course Code</Th>
                <Th>Course Title</Th>
                <Th data-numeric>Credits</Th>
                <Th data-numeric>Grade Points</Th>
                <Th>Grade</Th>
                <Th w="40px" />
              </Tr>
            </Thead>
            <Tbody>
              {formCourses.map((c, index) => (
                <Tr key={index}>
                  <Td>
                    <Input
                      size="sm"
                      variant="unstyled"
                      className="academics-course-input"
                      value={c.course_code}
                      onChange={(e) =>
                        handleCourseChange(index, "course_code", e.target.value.toUpperCase())
                      }
                      placeholder="CS101"
                    />
                  </Td>
                  <Td>
                    <Input
                      size="sm"
                      variant="unstyled"
                      className="academics-course-input"
                      value={c.course_title}
                      onChange={(e) =>
                        handleCourseChange(index, "course_title", e.target.value)
                      }
                      placeholder="Course Name"
                    />
                  </Td>
                  <Td>
                    <Input
                      size="sm"
                      variant="unstyled"
                      className="academics-course-input"
                      type="number"
                      min={0}
                      value={c.credits}
                      onChange={(e) =>
                        handleCourseChange(index, "credits", e.target.value)
                      }
                      placeholder="4"
                      w="16"
                    />
                  </Td>
                  <Td>
                    <Input
                      size="sm"
                      variant="unstyled"
                      className="academics-course-input"
                      type="number"
                      min={0}
                      max={10}
                      value={c.grade_points}
                      onChange={(e) =>
                        handleCourseChange(index, "grade_points", e.target.value)
                      }
                      placeholder="10"
                      w="14"
                    />
                  </Td>
                  <Td>
                    <Text fontSize="sm" fontWeight="bold" color="indigo.600">
                      {(c.grade || "")
                        .toString()
                        .trim()
                        .toUpperCase() || (gradeFromPointsMap[Number(c.grade_points)] || "-")}
                    </Text>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Remove course"
                      icon={<FaTrash />}
                      size="xs"
                      variant="ghost"
                      color="gray.600"
                      _hover={{ color: "red.500" }}
                      onClick={() => handleRemoveCourseRow(index)}
                      isDisabled={formCourses.length <= 1}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Button
            className="academics-add-course-btn"
            size="sm"
            variant="ghost"
            w="full"
            py={3}
            leftIcon={<FaPlus />}
            onClick={handleAddCourseRow}
          >
            Add Course
          </Button>
        </Box>

        <Flex className="academics-save-row" justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack className="academics-form-stats" spacing={4}>
            <Box className="academics-form-stat">
              <Text className="academics-form-stat-label">Semester Credits</Text>
              <Text className="academics-form-stat-value">{previewTotalCredits}</Text>
            </Box>
            <Box className="academics-form-stat">
              <Text className="academics-form-stat-label">SGPA</Text>
              <Text className="academics-form-stat-value">
                {previewSgpa != null ? previewSgpa.toFixed(2) : "-"}
              </Text>
            </Box>
          </HStack>
          {canEdit && (
            <Button
              className="academics-save-btn"
              onClick={handleSaveSemester}
              isLoading={saving}
              loadingText="Saving..."
              leftIcon={<FaGraduationCap />}
              size="md"
            >
              Save Semester
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  )

  return (
    <Box className="academics-profile-page" maxW="5xl" mx="auto" pt={4} pb={20} minH="100vh">
      {/* Locked alert – only when section is locked */}
      {isLocked && (
        <Alert status="info" className="academics-locked-alert" mb={4} mx={{ base: 4, md: 6 }} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>View only</AlertTitle>
            <AlertDescription>This section is locked by the administrator. You cannot edit it.</AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Header – sticky summary stats */}
      <Box
        className="academics-profile-header"
        position="sticky"
        top={{ base: "60px", md: "72px" }}
        zIndex={40}
        mx={{ base: 4, md: 6 }}
      >
        <Heading as="h1" size="md">
          Academic Performance
        </Heading>
        <Flex className="academics-stats-row" flexWrap="wrap" gap={4} mt={4}>
          <Box className="academics-stat-item">
            <Text className="academics-stat-label">Cumulative CGPA</Text>
            <Text className="academics-stat-value academics-stat-value--cgpa">
              {overallCgpa != null ? overallCgpa.toFixed(2) : "0.00"}
            </Text>
          </Box>
          <Box className="academics-stat-divider" />
          <Box className="academics-stat-item">
            <Text className="academics-stat-label">Total Credits</Text>
            <Text className="academics-stat-value academics-stat-value--credits">
              {totalCreditsDisplay}
            </Text>
          </Box>
          <Box className="academics-stat-divider" />
          <Box className="academics-stat-item">
            <Text className="academics-stat-label">Earned Credits</Text>
            <Text className="academics-stat-value academics-stat-value--credits-earned">
              {earnedCreditsDisplay}
            </Text>
          </Box>
          <Box className="academics-stat-divider" />
          <Box className="academics-stat-item">
            <Text className="academics-stat-label">Active Backlogs</Text>
            <Text
              className={`academics-stat-value ${activeBacklogsDisplay > 0 ? "academics-stat-value--backlogs" : "academics-stat-value--backlogs-zero"}`}
            >
              {activeBacklogsDisplay}
            </Text>
          </Box>
          <Box className="academics-stat-divider" />
          <Box className="academics-stat-item">
            <Text className="academics-stat-label">Cleared Backlogs</Text>
            <Text className="academics-stat-value academics-stat-value--cleared">
              {clearedBacklogsDisplay}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Add Semester button – only when canEdit */}
      {canEdit && (
        <Flex className="academics-add-semester-wrap" maxW="5xl" mx="auto" px={{ base: 4, md: 6 }}>
          <Button
            className="academics-add-semester-btn"
            leftIcon={<FaPlus />}
            onClick={handleAddSemester}
            isDisabled={loading}
          >
            Add Semester
          </Button>
        </Flex>
      )}

      <Box as="main" maxW="5xl" mx="auto" px={{ base: 4, md: 6 }}>
        {loading ? (
          <Center className="academics-loading" py={20}>
            <Spinner size="lg" color="indigo.500" />
          </Center>
        ) : displayList.length === 0 ? (
          <Box className="academics-empty-state">
            <Box className="academics-empty-state-icon">
              <FaFolderOpen />
            </Box>
            <Heading as="h2" className="academics-empty-state-title" size="md">
              No records found
            </Heading>
            <Text className="academics-empty-state-subtitle">
              {canEdit ? "Start by adding your first semester results." : "No academic records have been added yet."}
            </Text>
            {canEdit ? (
              <Button className="academics-empty-state-btn" onClick={handleAddSemester}>
                Initialize Sem 1
              </Button>
            ) : (
              <Text className="academics-empty-state-locked">
                Contact your administrator to add academic records.
              </Text>
            )}
          </Box>
        ) : (
          <VStack className="academics-semester-list" spacing={4} align="stretch">
            {displayList.map((item) => {
              const expanded = isFormExpanded(item)
              const isDraft = item.id === "draft"
              const semNum = item.semester ?? "-"
              const year = item.academic_year ?? "-"
              const sgpaVal =
                item.sgpa != null ? Number(item.sgpa).toFixed(2) : "-"
              const totalCred = Number(item.total_credits) || 0
              const earnedCred = Number(item.earned_credits) ?? totalCred
              const activeBlg = Number(item.active_backlogs) || 0
              const clearedBlg = Number(item.cleared_backlogs) || 0
              const totalBlg = activeBlg + clearedBlg
              const earnedText = totalCred > 0 ? `Earned ${earnedCred}/${totalCred}` : "Earned —"
              const backlogText = totalBlg > 0 ? `Cleared ${clearedBlg}/${totalBlg}` : "Cleared 0/0"
              const semNumN = Number(semNum)
              const isSemesterLocked = !isDraft && semNumN >= 1 && semNumN <= 8 && profileView?.editControl?.[`is_sem${semNumN}_locked`] === true
              const showForm = canEdit && (isDraft || !isSemesterLocked)

              return (
                <Box
                  key={isDraft ? "draft" : String(item.id)}
                  className={`academics-semester-card ${expanded ? "academics-semester-card--expanded" : ""} ${isDraft ? "academics-semester-card--draft" : ""}`}
                  overflow="hidden"
                >
                  <Flex
                    className="academics-semester-card-header"
                    onClick={() => handleToggleCard(item)}
                  >
                    <Box className="academics-semester-card-header-left">
                      <Flex className="academics-semester-badge">{semNum}</Flex>
                      <Box>
                        <Heading as="h3" className="academics-semester-card-title" size="sm">
                          Semester {semNum}
                          {isDraft && " (New)"}
                        </Heading>
                        <Text className="academics-semester-card-meta">{year}</Text>
                        <HStack className="academics-semester-card-stats" spacing={3} mt={1}>
                          <Text className="earned">{earnedText}</Text>
                          <Text className="dot">·</Text>
                          <Text className={activeBlg > 0 ? "backlogs" : "backlogs-zero"}>{backlogText}</Text>
                        </HStack>
                      </Box>
                    </Box>
                    <HStack className="academics-semester-card-header-right" spacing={4}>
                      <Box className="academics-sgpa-display">
                        <Text className="academics-sgpa-label">SGPA</Text>
                        <Text className="academics-sgpa-value">{sgpaVal}</Text>
                      </Box>
                      {canEdit && !isDraft && !isSemesterLocked && (
                        <IconButton
                          aria-label="Delete semester"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={(e) => handleDeleteSemester(e, item.id)}
                          title="Delete semester record"
                        />
                      )}
                      {profileView?.isAdminView && !isDraft && semNum >= 1 && semNum <= 8 && (
                        <IconButton
                          aria-label={profileView.editControl?.[`is_sem${semNum}_locked`] ? "Locked — click to unlock" : "Unlocked — click to lock"}
                          icon={profileView.editControl?.[`is_sem${semNum}_locked`] ? <FaLock /> : <FaUnlock />}
                          size="sm"
                          colorScheme={profileView.editControl?.[`is_sem${semNum}_locked`] ? "red" : "green"}
                          variant="ghost"
                          isLoading={updatingLockSemester === semNum}
                          onClick={(e) => handleToggleSemesterLock(e, semNum)}
                          title={profileView.editControl?.[`is_sem${semNum}_locked`] ? "Locked — click to unlock" : "Unlocked — click to lock"}
                        />
                      )}
                      <Flex className="academics-chevron">
                        <FaChevronDown />
                      </Flex>
                    </HStack>
                  </Flex>

                  <Collapse in={expanded} animateOpacity>
                    {expanded && (showForm ? renderFormContent() : renderViewContent(item, { isSemesterLocked, semNum: semNumN }))}
                  </Collapse>
                </Box>
              )
            })}
          </VStack>
        )}
      </Box>

      <Modal isOpen={isUnlockModalOpen} onClose={closeUnlockModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Unlock — Semester {unlockModalSemester}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                Reason for unlock request
              </FormLabel>
              <Text fontSize="xs" color="gray.700" mb={2}>
                This semester is locked. Provide a reason for the admin to review your request.
              </Text>
              <Textarea
                placeholder="e.g. Need to correct grade entry, add missing course..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
                size="sm"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3} flexWrap="wrap">
            <Text fontSize="sm" color="gray.700" alignSelf="center" mr="auto">
              Semester {unlockModalSemester}
            </Text>
            <Button variant="ghost" onClick={closeUnlockModal}>
              Cancel
            </Button>
            <Button
              className="academics-unlock-submit-btn"
              leftIcon={<FaUnlock />}
              onClick={handleRequestUnlock}
              isLoading={requestSubmitting}
            >
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Custom Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.800">
              Delete Semester Record
            </AlertDialogHeader>

            <AlertDialogBody color="gray.600">
              Are you sure you want to delete this semester record? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={onDeleteAlertClose} variant="ghost">
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDeleteSemester} 
                bg="red.500" 
                _hover={{ bg: "red.600" }}
                leftIcon={<FaTrash />}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
