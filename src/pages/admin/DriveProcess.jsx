import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  useToast,
  VStack,
  Badge,
  Button,
  HStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Input,
  Container,
  InputGroup,
  InputLeftElement,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { ArrowBackIcon, SearchIcon, DownloadIcon, AddIcon } from '@chakra-ui/icons';
import { MdAssignment, MdAdd, MdViewList, MdSave, MdBusiness, MdWork, MdCalendarToday, MdPeople, MdWarning, MdCardGiftcard } from 'react-icons/md';
import JSZip from 'jszip';
import { getFileUrl } from '../../utils/fileUrl';
import { PlacementService } from '../../services/placement.service';
import AdminLayout from '../../components/AdminLayout';
import AddStudentsToDrive from '../../components/placement/AddStudentsToDrive';
import './DriveProcess.css';

/** Map round display name (from drive.process_rounds) to API field key */
const ROUND_TO_FIELD = {
  registration: 'approved_status',
  approved: 'approved_status',
  eligible: 'is_eligible',
  oa: 'oa_status',
  'online assessment': 'oa_status',
  'coding test': 'oa_status',
  gd: 'gd_status',
  'group discussion': 'gd_status',
  technical: 'technical_round_status',
  'technical round': 'technical_round_status',
  interview: 'interview_status',
  'hr round': 'hr_round_status',
  hr: 'hr_round_status',
  final: 'final_select_status',
  'final selection': 'final_select_status',
};

function getRoundField(roundName) {
  if (!roundName || typeof roundName !== 'string') return null;
  const key = String(roundName).toLowerCase().trim();
  return ROUND_TO_FIELD[key] || null;
}

/** Check if a student passed a round based on field value */
function isRoundPassed(process, field) {
  if (!field) return true;
  // For approved_status, check for 'Qualified' value
  if (field === 'approved_status') {
    return process[field] === 'Qualified';
  }
  // For boolean fields
  return process[field] === true;
}

/** Format date for display */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/** Column labels for export download */
const EXPORT_COLUMN_LABELS = {
  usn: 'USN',
  student_name: 'Name',
  college_email: 'College Email',
  personal_email: 'Personal Email',
  phone_number: 'Phone',
  school: 'School',
  program: 'Program',
  major: 'Major',
  specialization: 'Specialization',
  year_of_joining: 'Year of Joining',
  current_year: 'Current Year',
  current_semester: 'Current Semester',
  section: 'Section',
  gender: 'Gender',
  resume_file: 'Resume (path in CSV)',
  project_titles: 'Project Titles',
  education_summary: 'Education Summary',
  latest_sgpa: 'Latest SGPA',
  live_backlogs: 'Live Backlogs',
  closed_backlogs: 'Closed Backlogs',
  internships_summary: 'Internships',
  brief_summary: 'Brief Summary',
  key_expertise: 'Key Expertise',
  career_objective: 'Career Objective',
  registration_status: 'Registration Status',
  approved_status: 'Approved Status',
  is_eligible: 'Eligible',
  oa_status: 'OA Status',
  gd_status: 'GD Status',
  technical_round_status: 'Technical Round',
  interview_status: 'Interview',
  hr_round_status: 'HR Round',
  final_select_status: 'Final Selected',
  malpractice: 'Malpractice',
  remarks: 'Remarks',
};

/** Categorized columns for student data export */
const EXPORT_COLUMN_CATEGORIES = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: '👤',
    columns: ['usn', 'student_name', 'college_email', 'personal_email', 'phone_number', 'gender', 'section'],
  },
  {
    id: 'academic',
    label: 'Academic Info',
    icon: '🎓',
    columns: ['school', 'program', 'major', 'specialization', 'year_of_joining', 'current_year', 'current_semester'],
  },
  {
    id: 'performance',
    label: 'Academic Performance',
    icon: '📊',
    columns: ['education_summary', 'latest_sgpa', 'live_backlogs', 'closed_backlogs'],
  },
  {
    id: 'profile',
    label: 'Profile & Career',
    icon: '📝',
    columns: ['brief_summary', 'key_expertise', 'career_objective'],
  },
  {
    id: 'projects',
    label: 'Projects & Experience',
    icon: '💼',
    columns: ['project_titles', 'internships_summary'],
  },
  {
    id: 'documents',
    label: 'Documents (CSV column)',
    icon: '📄',
    columns: ['resume_file'],
  },
  {
    id: 'placement',
    label: 'Placement Process',
    icon: '📋',
    columns: ['registration_status', 'approved_status', 'is_eligible', 'oa_status', 'gd_status', 'technical_round_status', 'interview_status', 'hr_round_status', 'final_select_status', 'malpractice', 'remarks'],
  },
];

const DriveProcess = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [drive, setDrive] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const showAddStudents = searchParams.get('clicked_add_students') === 'true';
  const [selectedProcessIds, setSelectedProcessIds] = useState([]);
  const [editedProcesses, setEditedProcesses] = useState({});
  const [savingProcesses, setSavingProcesses] = useState(false);
  /** -1 = All Rounds, -2 = Registered, -3 = Approved, -4 = Job Offers, 0,1,2... = Round 1, 2, 3... */
  const [currentActiveRoundIndex, setCurrentActiveRoundIndex] = useState(-2);
  /** Selected students for job offers (usn list) */
  const [selectedForOffers, setSelectedForOffers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { isOpen: isDownloadOpen, onOpen: onDownloadOpen, onClose: onDownloadClose } = useDisclosure();
  const [exportColumns, setExportColumns] = useState(Object.keys(EXPORT_COLUMN_LABELS));
  const [includeResumes, setIncludeResumes] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const fetchDriveAndProcesses = async () => {
    try {
      if (!drive) setLoading(true);
      const driveData = await PlacementService.getDriveById(driveId);
      setDrive(driveData);
      if (driveData) {
        setLoadingProcesses(true);
        const processData = await PlacementService.getDriveProcesses(driveId);
        setProcesses(processData);
      }
    } catch (error) {
      const message = error?.message || 'Failed to load drive process.';
      toast({
        title: 'Error fetching drive process',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setLoadingProcesses(false);
      setSelectedProcessIds([]);
      setEditedProcesses({});
    }
  };

  useEffect(() => {
    if (driveId) fetchDriveAndProcesses();
  }, [driveId]);

  const processRounds = Array.isArray(drive?.process_rounds)
    ? drive.process_rounds
        .filter((r) => {
          const s = String(r || '').trim();
          return s !== '' && !/^aptitude$/i.test(s);
        })
        .filter((r) => getRoundField(r) != null)
    : [];
  const roundFields = processRounds.map((r) => getRoundField(r));

  /** Helper: is student registered */
  const isRegistered = (p) => String(p.registration_status || '').toLowerCase() === 'registered';

  /** For single-round view: only students who passed all previous rounds */
  const getFilteredProcesses = () => {
    let result = processes;
    
    // Registered tab (-2): all students
    // Approved tab (-3): only registered students
    // Job Offers tab (-4): students who passed the last round (i.e. passed all rounds in the process)
    if (currentActiveRoundIndex === -3) {
      result = result.filter(isRegistered);
    } else if (currentActiveRoundIndex === -4) {
      result = result.filter((p) => {
        if (!isRegistered(p)) return false;
        if (p.approved_status !== 'Qualified') return false;
        for (let i = 0; i < roundFields.length; i++) {
          const field = roundFields[i];
          if (!field || field === 'approved_status') continue;
          if (!isRoundPassed(p, field)) return false;
        }
        return true;
      });
    }
    
    // Round views (0+): must be registered + approved + passed all previous rounds
    if (currentActiveRoundIndex >= 0 && currentActiveRoundIndex < roundFields.length) {
      result = result.filter((p) => {
        if (!isRegistered(p)) return false;
        if (p.approved_status !== 'Qualified') return false;
        for (let i = 0; i < currentActiveRoundIndex; i++) {
          const field = roundFields[i];
          if (!field || field === 'approved_status') continue;
          if (!isRoundPassed(p, field)) return false;
        }
        return true;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        (p.usn || '').toLowerCase().includes(q) ||
        (p.student_name || '').toLowerCase().includes(q)
      );
    }
    
    // Apply status filter in All Rounds view
    if (currentActiveRoundIndex === -1 && statusFilter) {
      result = result.filter((p) => {
        if (statusFilter === 'malpractice') return p.malpractice === true;
        if (statusFilter === 'selected') return p.final_select_status === true;
        if (statusFilter === 'pending') {
          return roundFields.some((field) => field && p[field] == null);
        }
        if (statusFilter === 'rejected') {
          return roundFields.some((field) => field && p[field] === false);
        }
        return true;
      });
    }
    
    return result;
  };
  
  const filteredProcesses = getFilteredProcesses();

  const handleProcessSelectAll = (checked) => {
    if (checked) setSelectedProcessIds(processes.map((p) => p.id));
    else setSelectedProcessIds([]);
  };

  const handleProcessSelectRow = (id) => {
    setSelectedProcessIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProcessFieldChange = (id, field, value) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    setEditedProcesses((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const cycleCellValue = (id, field) => {
    const process = processes.find((p) => p.id === id);
    if (!process) return;
    if (field === 'is_eligible') {
      handleProcessFieldChange(id, field, !process.is_eligible);
      return;
    }
    if (field === 'malpractice') {
      handleProcessFieldChange(id, field, !process.malpractice);
      return;
    }
    if (
      [
        'oa_status',
        'gd_status',
        'technical_round_status',
        'interview_status',
        'hr_round_status',
        'final_select_status',
      ].includes(field)
    ) {
      const current = process[field];
      const next =
        current === null || current === undefined
          ? true
          : current === true
          ? false
          : null;
      handleProcessFieldChange(id, field, next);
      return;
    }
    const options =
      field === 'registration_status'
        ? ['Pending', 'Registered', 'Not Registered']
        : field === 'approved_status'
        ? ['skipped', 'Pending', 'Qualified', 'Not Qualified']
        : [];
    if (!options.length) return;
    const currentValue = process[field] || options[0];
    const index = options.indexOf(currentValue);
    const nextIndex =
      index === -1 || index === options.length - 1 ? 0 : index + 1;
    handleProcessFieldChange(id, field, options[nextIndex]);
  };

  const formatRoundStatusPill = (value, field) => {
    // Handle registration_status (string values)
    if (field === 'registration_status') {
      const v = String(value || '').toLowerCase();
      const statusClass =
        v === 'registered' ? 'status-pass' : v === 'not registered' ? 'status-fail' : 'status-pending';
      const statusText =
        v === 'registered' ? 'REGISTERED' : v === 'not registered' ? 'NOT REGISTERED' : 'PENDING';
      return (
        <span className={`status-pill ${statusClass}`}>{statusText}</span>
      );
    }
    // Handle approved_status (string values)
    if (field === 'approved_status') {
      const statusClass =
        value === 'Qualified' ? 'status-pass' : value === 'Not Qualified' ? 'status-fail' : 'status-pending';
      const statusText =
        value === 'Qualified' ? 'QUALIFIED' : value === 'Not Qualified' ? 'NOT QUALIFIED' : 'PENDING';
      return (
        <span className={`status-pill ${statusClass}`}>{statusText}</span>
      );
    }
    // Handle boolean values
    const statusClass =
      value === true ? 'status-pass' : value === false ? 'status-fail' : 'status-pending';
    const statusText =
      value === true ? 'PASSED' : value === false ? 'FAILED' : 'PENDING';
    return (
      <span className={`status-pill ${statusClass}`}>{statusText}</span>
    );
  };
  
  const formatMalpracticePill = (value) => {
    if (value === true) {
      return <span className="status-pill status-malpractice">MALPRACTICE</span>;
    }
    return <span className="status-pill status-clean">CLEAN</span>;
  };

  const setStatus = (id, status) => {
    const process = processes.find((p) => p.id === id);
    if (!process) return;
    const field = currentSingleRoundField;
    if (!field || field === 'registration_status') return; // registration uses cycleCellValue
    
    // Handle approved_status field differently (uses string values)
    if (field === 'approved_status') {
      const current = process[field];
      const newValue = status === true ? 'Qualified' : status === false ? 'Not Qualified' : 'Pending';
      if ((current === 'Qualified' && status === true) || (current === 'Not Qualified' && status === false)) {
        handleProcessFieldChange(id, field, 'Pending');
      } else {
        handleProcessFieldChange(id, field, newValue);
        if (status === false) {
          // Reset subsequent rounds
          for (let i = currentActiveRoundIndex + 1; i < roundFields.length; i++) {
            const laterField = roundFields[i];
            if (laterField && laterField !== 'approved_status') {
              handleProcessFieldChange(id, laterField, null);
            }
          }
        }
      }
      return;
    }
    
    // Handle boolean fields
    const current = process[field];
    if (current === status) {
      handleProcessFieldChange(id, field, null);
    } else {
      handleProcessFieldChange(id, field, status);
      if (status === false) {
        for (let i = currentActiveRoundIndex + 1; i < roundFields.length; i++) {
          const laterField = roundFields[i];
          if (laterField) handleProcessFieldChange(id, laterField, null);
        }
      }
    }
  };

  const handleSaveProcessChanges = async () => {
    const entries = Object.entries(editedProcesses);
    if (!entries.length) {
      toast({ title: 'No changes to save', status: 'info' });
      return;
    }
    try {
      setSavingProcesses(true);
      for (const [id, changes] of entries) {
        await PlacementService.updateProcessStatus(id, changes);
      }
      toast({ title: 'Process updates saved', status: 'success' });
      setEditedProcesses({});
      setSelectedProcessIds([]);
      await fetchDriveAndProcesses();
    } catch (error) {
      toast({ title: 'Error saving process updates', status: 'error' });
    } finally {
      setSavingProcesses(false);
    }
  };

  const handleExportColumnToggle = (col) => {
    setExportColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleSelectAllExportColumns = (checked) => {
    setExportColumns(checked ? Object.keys(EXPORT_COLUMN_LABELS) : []);
  };

  const handleCategoryToggle = (categoryId, checked) => {
    const cat = EXPORT_COLUMN_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    if (checked) {
      setExportColumns((prev) => [...new Set([...prev, ...cat.columns])]);
    } else {
      setExportColumns((prev) => prev.filter((c) => !cat.columns.includes(c)));
    }
  };

  const isCategorySelected = (categoryId) => {
    const cat = EXPORT_COLUMN_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return false;
    return cat.columns.every((col) => exportColumns.includes(col));
  };

  const isCategoryIndeterminate = (categoryId) => {
    const cat = EXPORT_COLUMN_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return false;
    const selected = cat.columns.filter((col) => exportColumns.includes(col)).length;
    return selected > 0 && selected < cat.columns.length;
  };

  const handleDownload = async () => {
    if (exportColumns.length === 0) {
      toast({ title: 'Select at least one column', status: 'warning' });
      return;
    }
    setDownloading(true);
    try {
      const { data, columns } = await PlacementService.getDriveExportData(driveId, {
        stage: 'approved',
        columns: exportColumns,
      });

      if (!data || data.length === 0) {
        toast({ title: 'No data to export', description: 'No registered students in approved stage.', status: 'info' });
        return;
      }

      const escapeCsv = (v) => {
        if (v == null) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const headers = columns.map((c) => EXPORT_COLUMN_LABELS[c] || c);
      const rows = data.map((row) => columns.map((col) => escapeCsv(row[col])).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const csvBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

      const safeName = (drive?.company_name || 'drive').replace(/[^a-zA-Z0-9_-]/g, '_');
      const csvFilename = `approved_registrations_${safeName}.csv`;

      if (includeResumes) {
        const zip = new JSZip();
        zip.file(csvFilename, csvBlob);

        const withResume = data.filter((r) => r.resume_file);
        for (let i = 0; i < withResume.length; i++) {
          const row = withResume[i];
          const url = getFileUrl(row.resume_file);
          if (!url) continue;
          try {
            const resp = await fetch(url, { credentials: 'include' });
            if (resp.ok) {
              const blob = await resp.blob();
              const ext = (row.resume_file || '').split('.').pop() || 'pdf';
              const filename = `resumes/${row.usn}_resume.${ext}`;
              zip.file(filename, blob);
            }
          } catch {
            // Skip failed resume fetch
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `approved_registrations_${safeName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast({ title: 'Download complete', description: `ZIP with CSV and ${withResume.length} resume(s)`, status: 'success' });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(csvBlob);
        link.download = csvFilename;
        link.click();
        URL.revokeObjectURL(link.href);
        toast({ title: 'Download complete', description: 'CSV exported successfully', status: 'success' });
      }
      onDownloadClose();
    } catch (error) {
      toast({ title: 'Export failed', description: error?.message || 'Could not export data', status: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Flex justify="center" align="center" h="calc(100vh - 100px)">
          <Spinner size="xl" />
        </Flex>
      </AdminLayout>
    );
  }

  if (!drive) {
    return (
      <AdminLayout>
        <Box p={5}>
          <Text>Drive not found.</Text>
          <Button mt={4} onClick={() => navigate('/placement/events')}>
            Back to Events
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  const isAllRoundsView = currentActiveRoundIndex === -1;
  const isRegisteredTab = currentActiveRoundIndex === -2;
  const isApprovedTab = currentActiveRoundIndex === -3;
  const isJobOffersTab = currentActiveRoundIndex === -4;
  const isRoundTab = currentActiveRoundIndex >= 0;
  const placementStatus = String(drive?.placement_status || '').toLowerCase();
  const isCompleted = placementStatus === 'completed' || placementStatus === 'closed';
  const isOngoing = placementStatus === 'ongoing';
  const canSetSelectionStatus = isOngoing;
  /** On Registered tab: first number = count with status "Registered"; otherwise = filtered row count */
  const displayCount = isRegisteredTab
    ? filteredProcesses.filter(isRegistered).length
    : filteredProcesses.length;
  /** Field for single-round/Registered/Approved view */
  const currentSingleRoundField =
    isRegisteredTab ? 'registration_status' :
    isApprovedTab ? 'approved_status' :
    isRoundTab && roundFields[currentActiveRoundIndex] ? roundFields[currentActiveRoundIndex] : null;
  const currentRoundName =
    currentActiveRoundIndex >= 0 && processRounds[currentActiveRoundIndex]
      ? processRounds[currentActiveRoundIndex]
      : '';
  const currentRoundTitle = isAllRoundsView
    ? 'Full Process Overview'
    : isRegisteredTab
      ? 'Registered'
      : isApprovedTab
        ? 'Approved'
        : isJobOffersTab
          ? 'Job Offers'
          : `${currentRoundName} (Round ${currentActiveRoundIndex + 1})`;
  const currentRoundDesc = isAllRoundsView
    ? 'View and edit status across all rounds. Edit malpractice and remarks for any student.'
      : isRegisteredTab
      ? `Students self-register for drives; status auto-expires to Not Registered after deadline. (${filteredProcesses.length} total)`
      : isApprovedTab
        ? `Admin approves only registered students. (${filteredProcesses.length} registered)`
        : isJobOffersTab
          ? `Select final selected students to create job offers. (${filteredProcesses.length} selected)`
          : `Only students who passed previous rounds. (${filteredProcesses.length} candidates)`;

  // Calculate stats
  const totalStudents = processes.length;
  const approvedCount = processes.filter((p) => p.approved_status === 'Qualified').length;
  const malpracticeCount = processes.filter((p) => p.malpractice === true).length;
  const selectedCount = processes.filter((p) => p.final_select_status === true).length;

  return (
    <AdminLayout>
      <Box className="drive-process-page" bg="#f0f0f0" color="gray.800" minH="100vh" py={0}>
        <Container maxW="100%" py={4} px={6}>
          <VStack align="stretch" spacing={4}>
            {/* Compact Header with Back Button and Placement Status */}
            <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/placement/events')}
                >
                  Back to Events
                </Button>
              </HStack>
              <HStack spacing={3} flexWrap="wrap">
                {drive?.placement_status && (
                  <Badge
                    colorScheme={
                      String(drive.placement_status).toLowerCase() === 'scheduled' || String(drive.placement_status).toLowerCase() === 'open'
                        ? 'blue'
                        : String(drive.placement_status).toLowerCase() === 'ongoing'
                        ? 'green'
                        : String(drive.placement_status).toLowerCase() === 'completed' || String(drive.placement_status).toLowerCase() === 'closed'
                        ? 'gray'
                        : String(drive.placement_status).toLowerCase() === 'cancelled' || String(drive.placement_status).toLowerCase() === 'failed'
                        ? 'red'
                        : String(drive.placement_status).toLowerCase() === 'postponed'
                        ? 'orange'
                        : 'purple'
                    }
                    fontSize="sm"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    textTransform="uppercase"
                    fontWeight="semibold"
                  >
                    {drive.placement_status}
                  </Badge>
                )}
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<Icon as={showAddStudents ? MdViewList : MdAdd} />}
                  onClick={() => navigate(showAddStudents ? location.pathname : `${location.pathname}?clicked_add_students=true`)}
                >
                  {showAddStudents ? 'View Process' : 'Add Students'}
                </Button>
              </HStack>
            </Flex>

            {/* Drive Details Card - Single Row (placement drive table style) */}
            <Box
              className="drive-info-card drive-details-row"
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="sm"
              overflow="hidden"
            >
              <Flex
                px={5}
                py={4}
                align="center"
                justify="space-between"
                flexWrap="wrap"
                gap={4}
              >
                {/* Company, Remarks & TPO (like placement drive table) */}
                <Box className="col-company-remarks-tpo" minW="220px" flex="0 0 auto">
                  <Flex gap={3} align="flex-start">
                    <Box
                      className="company-logo"
                      w="44px"
                      h="44px"
                      minW="44px"
                      borderRadius="lg"
                      bg="#1e293b"
                      color="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="1rem"
                    >
                      {(drive.company_name || 'C').charAt(0).toUpperCase()}
                    </Box>
                    <Flex flexDirection="column">
                      <Text className="company-name" fontSize="0.95rem" fontWeight="bold" color="gray.900" lineHeight="1.3">
                        {drive.company_name}
                      </Text>
                      <Text className="company-remarks" fontSize="0.7rem" color="gray.500" fontStyle="italic" lineHeight="1.4" mt={1} noOfLines={2}>
                        "{drive.company_remarks || ''}"
                      </Text>
                      <Text className="company-tpo" fontSize="0.65rem" fontWeight="bold" color="blue.500" textTransform="uppercase" letterSpacing="0.02em" mt={1.5}>
                        TPO: {(drive.tpo || '').toUpperCase() || '—'}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>

                {/* Stats row (Job Type, Year, Status, Reg, Approved, Selected, Malpractice) */}
                <HStack spacing={3} flexWrap="wrap" flex="1" justify="flex-end" minW="0">
                  <Box className="stat-card" bg="gray.50" px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase">Job Type</Text>
                    <Text fontSize="sm" fontWeight="bold" color="gray.800">{drive.job_type || '-'}</Text>
                  </Box>
                  <Box className="stat-card" bg="gray.50" px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase">Year</Text>
                    <Text fontSize="sm" fontWeight="bold" color="gray.800">{drive.academic_year || '-'}</Text>
                  </Box>
                  <Box className="stat-card" bg="gray.50" px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase">Status</Text>
                    <Badge colorScheme={drive.placement_status === 'Active' ? 'green' : drive.placement_status === 'Completed' ? 'blue' : 'gray'} fontSize="xs">
                      {drive.placement_status || 'Pending'}
                    </Badge>
                  </Box>
                  <Box className="stat-card" bg="blue.50" px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color="blue.600" fontWeight="bold" textTransform="uppercase">Reg</Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.700">{totalStudents}</Text>
                  </Box>
                  <Box className="stat-card" bg="green.50" px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color="green.600" fontWeight="bold" textTransform="uppercase">Approved</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.700">{approvedCount}</Text>
                  </Box>
                  <Box className="stat-card" bg="purple.50" px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color="purple.600" fontWeight="bold" textTransform="uppercase">Selected</Text>
                    <Text fontSize="sm" fontWeight="bold" color="purple.700">{selectedCount}</Text>
                  </Box>
                  <Box className="stat-card" bg={malpracticeCount > 0 ? 'red.50' : 'gray.50'} px={4} py={2} borderRadius="lg" textAlign="center" minW="72px">
                    <Text fontSize="10px" color={malpracticeCount > 0 ? 'red.600' : 'gray.500'} fontWeight="bold" textTransform="uppercase">Malpractice</Text>
                    <Text fontSize="sm" fontWeight="bold" color={malpracticeCount > 0 ? 'red.700' : 'gray.700'}>{malpracticeCount}</Text>
                  </Box>
                </HStack>
              </Flex>
            </Box>

            {showAddStudents ? (
              <Box
                bg="white"
                p={6}
                borderRadius="xl"
                shadow="sm"
                borderWidth="1px"
                borderColor="gray.200"
              >
                <AddStudentsToDrive
                  driveId={driveId}
                  embedded
                  existingUsns={processes.map((p) => p.usn)}
                  onCancel={() => navigate(location.pathname)}
                  onSuccess={() => {
                    fetchDriveAndProcesses();
                    navigate(location.pathname);
                  }}
                />
              </Box>
            ) : (
              <>
                {/* Round selector tabs */}
                <Box
                  className="round-tabs-container"
                  bg="white"
                  p={2}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.200"
                  shadow="sm"
                >
                  <Flex
                    flexWrap="wrap"
                    align="center"
                    gap={2}
                    overflowX="auto"
                    className="custom-scrollbar"
                  >
                    <button
                      type="button"
                      className={`round-tab ${currentActiveRoundIndex === -2 ? 'active' : ''}`}
                      onClick={() => setCurrentActiveRoundIndex(-2)}
                    >
                      Registered
                    </button>
                    <button
                      type="button"
                      className={`round-tab ${currentActiveRoundIndex === -3 ? 'active' : ''}`}
                      onClick={() => setCurrentActiveRoundIndex(-3)}
                    >
                      Approved
                    </button>
                    {processRounds.map((round, index) => (
                      <button
                        key={`${round}-${index}`}
                        type="button"
                        className={`round-tab ${currentActiveRoundIndex === index ? 'active' : ''}`}
                        onClick={() => setCurrentActiveRoundIndex(index)}
                      >
                        <span className="round-tab-num">{index + 1}</span>
                        {round}
                      </button>
                    ))}
                    <Box w="1px" h={6} bg="gray.200" mx={1} />
                    <button
                      type="button"
                      className={`round-tab ${currentActiveRoundIndex === -1 ? 'active' : ''}`}
                      onClick={() => setCurrentActiveRoundIndex(-1)}
                    >
                      All Rounds View
                    </button>
                    {/* Job Offers tab - visible when drive is ongoing or completed */}
                    {(isOngoing || isCompleted) && (
                      <>
                        <Box w="1px" h={6} bg="gray.200" mx={1} />
                        <button
                          type="button"
                          className={`round-tab job-offers-tab ${isJobOffersTab ? 'active' : ''}`}
                          onClick={() => {
                            setCurrentActiveRoundIndex(-4);
                            setSelectedForOffers([]);
                          }}
                        >
                          <Icon as={MdCardGiftcard} boxSize={4} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          Job Offers
                        </button>
                      </>
                    )}
                  </Flex>
                </Box>

                {/* Filters Bar */}
                <Flex
                  className="filters-bar"
                  bg="white"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                  p={3}
                  shadow="sm"
                  flexWrap="wrap"
                  align="center"
                  gap={3}
                >
                  <InputGroup maxW="280px" size="sm">
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by USN or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      bg="gray.50"
                      borderColor="gray.200"
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                    />
                  </InputGroup>
                  
                  {currentActiveRoundIndex === -1 && (
                    <Select
                      size="sm"
                      maxW="180px"
                      placeholder="All Statuses"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      bg="gray.50"
                      borderColor="gray.200"
                    >
                      <option value="malpractice">Malpractice</option>
                      <option value="selected">Final Selected</option>
                      <option value="pending">Has Pending</option>
                      <option value="rejected">Has Rejected</option>
                    </Select>
                  )}
                  
                  <Box flex="1" />
                  
                  <HStack spacing={2}>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        {currentRoundTitle}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {displayCount} of {processes.length} students
                      </Text>
                    </Box>
                    {isApprovedTab && (
                      <Button
                        colorScheme="green"
                        leftIcon={<DownloadIcon />}
                        size="sm"
                        fontWeight="bold"
                        variant="outline"
                        onClick={onDownloadOpen}
                      >
                        Download Data
                      </Button>
                    )}
                    {isJobOffersTab && (
                      <Button
                        colorScheme="green"
                        leftIcon={<AddIcon />}
                        size="sm"
                        fontWeight="bold"
                        isDisabled={selectedForOffers.length === 0}
                        onClick={() => {
                          // Build prefill data from drive
                          const ctcStruct = drive?.ctc_structure || {};
                          const stipendStruct = drive?.stipend_structure || {};
                          const rawJobType = (drive?.job_type || '').toLowerCase().trim();
                          const jobType = rawJobType === 'internship cum full time'
                            ? 'internship_cum_full_time'
                            : rawJobType === 'full time'
                              ? 'full time'
                              : rawJobType === 'internship'
                                ? 'internship'
                                : rawJobType;
                          const prefillData = {
                            company_name: drive?.company_name || '',
                            company_id: drive?.company_id || '',
                            placement_drive_id: drive?.id != null ? String(drive.id) : '',
                            job_type: jobType,
                            ctc_min: ctcStruct.min || ctcStruct.ctc_min || '',
                            ctc_max: ctcStruct.max || ctcStruct.ctc_max || '',
                            variable_pay: ctcStruct.variable || ctcStruct.variable_pay || '',
                            internship_duration: stipendStruct.duration_months || stipendStruct.duration || '',
                            internship_stipend: stipendStruct.amount || stipendStruct.stipend || '',
                          };
                          // Get selected students data
                          const selectedStudentData = processes
                            .filter((p) => selectedForOffers.includes(p.usn))
                            .map((p) => ({
                              usn: p.usn,
                              name: p.student_name,
                              student_name: p.student_name,
                              school: p.school,
                            }));
                          // Navigate to job offers page with state
                          navigate('/placement/job-offers', {
                            state: {
                              prefillData,
                              selectedStudents: selectedStudentData,
                            },
                          });
                        }}
                      >
                        Add Job Offers ({selectedForOffers.length})
                      </Button>
                    )}
                    {!isJobOffersTab && (
                      <Button
                        colorScheme="blue"
                        leftIcon={<Icon as={MdSave} />}
                        size="sm"
                        fontWeight="bold"
                        onClick={handleSaveProcessChanges}
                        isLoading={savingProcesses}
                        loadingText="Saving"
                        isDisabled={Object.keys(editedProcesses).length === 0}
                      >
                        Save Changes
                      </Button>
                    )}
                  </HStack>
                </Flex>

                {/* Table container */}
                <Box
                  className="process-table-wrap"
                  bg="white"
                  borderRadius="xl"
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.200"
                  overflow="hidden"
                  flex="1"
                >
                  {loadingProcesses ? (
                    <Flex justify="center" align="center" py={20}>
                      <Spinner size="xl" thickness="4px" color="blue.500" />
                    </Flex>
                  ) : (
                    <TableContainer overflowX="auto" maxH="calc(100vh - 380px)" className="custom-scrollbar">
                      <Table variant="unstyled" size="sm">
                        <Thead bg="gray.50" borderBottomWidth="2px" borderColor="gray.200" position="sticky" top={0} zIndex={5}>
                          <Tr>
                            {isJobOffersTab ? (
                              <>
                                <Th className="table-header" px={2} py={3} w="40px">
                                  <Checkbox
                                    isChecked={selectedForOffers.length === filteredProcesses.length && filteredProcesses.length > 0}
                                    isIndeterminate={selectedForOffers.length > 0 && selectedForOffers.length < filteredProcesses.length}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedForOffers(filteredProcesses.map((p) => p.usn));
                                      } else {
                                        setSelectedForOffers([]);
                                      }
                                    }}
                                    colorScheme="green"
                                  />
                                </Th>
                                <Th className="table-header" px={4} py={3} minW="180px">
                                  USN / Name
                                </Th>
                                <Th className="table-header" px={3} py={3} minW="120px">
                                  School
                                </Th>
                                <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">
                                  Final Status
                                </Th>
                                <Th className="table-header" px={4} py={3} minW="180px">
                                  Remarks
                                </Th>
                              </>
                            ) : isAllRoundsView ? (
                              <>
                                <Th className="table-header" px={4} py={3} minW="180px">
                                  USN / Name
                                </Th>
                                <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">
                                  Registered
                                </Th>
                                <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">
                                  Approved
                                </Th>
                                {processRounds.map((r, i) => (
                                  <Th key={r} className="table-header" px={3} py={3} textAlign="center" minW="100px">
                                    {r}
                                  </Th>
                                ))}
                                <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">
                                  <HStack spacing={1} justify="center">
                                    <Icon as={MdWarning} color="orange.500" />
                                    <Text>Malpractice</Text>
                                  </HStack>
                                </Th>
                                <Th className="table-header" px={4} py={3} minW="180px">
                                  Remarks
                                </Th>
                              </>
                            ) : (
                              <>
                                <Th className="table-header" px={4} py={3} minW="180px">
                                  USN & Name
                                </Th>
                                <Th className="table-header" px={4} py={3} textAlign="center" minW="160px">
                                  {isRegisteredTab ? 'Registration Status (student-set)' : 'Set Selection Status'}
                                </Th>
                                <Th className="table-header" px={4} py={3} minW="120px">
                                  Previous Stages
                                </Th>
                                <Th className="table-header" px={4} py={3} minW="180px">
                                  Remarks
                                </Th>
                              </>
                            )}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredProcesses.length === 0 ? (
                            <Tr>
                              <Td
                                colSpan={isJobOffersTab ? 5 : isAllRoundsView ? processRounds.length + 5 : 4}
                                textAlign="center"
                                py={10}
                                color="gray.500"
                              >
                                <VStack>
                                  <Icon as={MdAssignment} boxSize={8} opacity={0.3} />
                                  <Text>
                                    {isJobOffersTab
                                      ? 'No students have passed all rounds yet. Mark students as passed in each round to see them here.'
                                      : searchQuery || statusFilter
                                        ? 'No students match your search criteria.'
                                        : 'No student processes for this drive. Add students to get started.'}
                                  </Text>
                                </VStack>
                              </Td>
                            </Tr>
                          ) : (
                            filteredProcesses.map((process) => (
                              <Tr
                                key={process.id}
                                className={`process-row ${process.malpractice ? 'malpractice-row' : ''} ${isJobOffersTab && selectedForOffers.includes(process.usn) ? 'selected-row' : ''}`}
                                _hover={{ bg: isJobOffersTab ? 'green.50' : 'gray.50' }}
                                borderBottomWidth="1px"
                                borderColor="gray.100"
                                bg={isJobOffersTab && selectedForOffers.includes(process.usn) ? 'green.50' : 'transparent'}
                              >
                                {isJobOffersTab ? (
                                  <>
                                    <Td px={2} py={3}>
                                      <Checkbox
                                        isChecked={selectedForOffers.includes(process.usn)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedForOffers((prev) => [...prev, process.usn]);
                                          } else {
                                            setSelectedForOffers((prev) => prev.filter((u) => u !== process.usn));
                                          }
                                        }}
                                        colorScheme="green"
                                      />
                                    </Td>
                                    <Td
                                      px={4}
                                      py={3}
                                      whiteSpace="nowrap"
                                      cursor="pointer"
                                      _hover={{ textDecoration: 'underline' }}
                                      onClick={() => process.usn && navigate(`/placement/students/${encodeURIComponent(process.usn)}`)}
                                    >
                                      <Box fontSize="sm" fontWeight="bold" color="blue.600">
                                        {process.usn}
                                      </Box>
                                      <Box fontSize="xs" color="gray.500">
                                        {process.student_name || '-'}
                                      </Box>
                                    </Td>
                                    <Td px={3} py={3} fontSize="sm" color="gray.600">
                                      {process.school || '-'}
                                    </Td>
                                    <Td px={3} py={3} textAlign="center">
                                      <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                                        SELECTED
                                      </Badge>
                                    </Td>
                                    <Td px={4} py={3} fontSize="sm" color="gray.600" maxW="200px" isTruncated>
                                      {process.remarks || '-'}
                                    </Td>
                                  </>
                                ) : isAllRoundsView ? (
                                  <>
                                    <Td
                                      px={4}
                                      py={3}
                                      whiteSpace="nowrap"
                                      cursor="pointer"
                                      _hover={{ textDecoration: 'underline' }}
                                      onClick={() => process.usn && navigate(`/placement/students/${encodeURIComponent(process.usn)}`)}
                                    >
                                      <Box fontSize="sm" fontWeight="bold" color="blue.600">
                                        {process.usn}
                                      </Box>
                                      <Box fontSize="xs" color="gray.500">
                                        {process.student_name || '-'}
                                      </Box>
                                    </Td>
                                    <Td px={3} py={3} textAlign="center" title="Set by student; auto-expires after deadline">
                                      {formatRoundStatusPill(process.registration_status, 'registration_status')}
                                    </Td>
                                    <Td
                                      px={3}
                                      py={3}
                                      textAlign="center"
                                      cursor={canSetSelectionStatus ? 'pointer' : 'default'}
                                      onClick={() => canSetSelectionStatus && cycleCellValue(process.id, 'approved_status')}
                                      title={canSetSelectionStatus ? 'Click to toggle status' : 'Set status enabled only when drive is ongoing'}
                                    >
                                      {formatRoundStatusPill(process.approved_status, 'approved_status')}
                                    </Td>
                                    {roundFields.map((field, i) => (
                                      <Td
                                        key={processRounds[i]}
                                        px={3}
                                        py={3}
                                        textAlign="center"
                                        cursor={canSetSelectionStatus ? 'pointer' : 'default'}
                                        onClick={() => canSetSelectionStatus && field && cycleCellValue(process.id, field)}
                                        title={canSetSelectionStatus ? 'Click to toggle status' : 'Set status enabled only when drive is ongoing'}
                                      >
                                        {formatRoundStatusPill(field ? process[field] : null, field)}
                                      </Td>
                                    ))}
                                    <Td px={3} py={3} textAlign="center">
                                      <Checkbox
                                        isChecked={process.malpractice === true}
                                        onChange={(e) => handleProcessFieldChange(process.id, 'malpractice', e.target.checked)}
                                        colorScheme="red"
                                        size="lg"
                                      />
                                    </Td>
                                    <Td px={4} py={3}>
                                      <Input
                                        size="sm"
                                        bg="gray.50"
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'blue.300', boxShadow: '0 0 0 1px var(--chakra-colors-blue-300)' }}
                                        placeholder="Remarks / malpractice notes..."
                                        value={process.remarks || ''}
                                        onChange={(e) => handleProcessFieldChange(process.id, 'remarks', e.target.value)}
                                        title="Edit remarks (e.g. malpractice details)"
                                      />
                                    </Td>
                                  </>
                                ) : (
                                  <>
                                    <Td
                                      px={4}
                                      py={3}
                                      whiteSpace="nowrap"
                                      cursor="pointer"
                                      _hover={{ textDecoration: 'underline' }}
                                      onClick={() => process.usn && navigate(`/placement/students/${encodeURIComponent(process.usn)}`)}
                                    >
                                      <Box fontSize="sm" fontWeight="bold" color="blue.600">
                                        {process.usn}
                                      </Box>
                                      <Box fontSize="xs" color="gray.500">
                                        {process.student_name || '-'}
                                      </Box>
                                    </Td>
                                    <Td px={4} py={3}>
                                      {currentSingleRoundField ? (
                                        <Flex justify="center" align="center" gap={2}>
                                          {/* registration_status: read-only, set by student; auto-expires after deadline */}
                                          {currentSingleRoundField === 'registration_status' ? (
                                            <Box title="Set by student; auto-expires after deadline">
                                              {formatRoundStatusPill(process.registration_status, 'registration_status')}
                                            </Box>
                                          ) : !canSetSelectionStatus ? (
                                            <Box title="Set status enabled only when drive is ongoing">
                                              {formatRoundStatusPill(
                                                currentSingleRoundField === 'approved_status' ? process.approved_status : process[currentSingleRoundField],
                                                currentSingleRoundField
                                              )}
                                            </Box>
                                          ) : currentSingleRoundField === 'approved_status' ? (
                                            <>
                                              <Button
                                                className="status-btn pass"
                                                w={10}
                                                h={10}
                                                borderRadius="full"
                                                borderWidth="2px"
                                                borderColor={process.approved_status === 'Qualified' ? 'green.600' : 'gray.200'}
                                                bg={process.approved_status === 'Qualified' ? 'green.500' : 'transparent'}
                                                color={process.approved_status === 'Qualified' ? 'white' : 'gray.400'}
                                                _hover={{ borderColor: 'green.400' }}
                                                onClick={() => setStatus(process.id, true)}
                                                p={0}
                                              >
                                                <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </Icon>
                                              </Button>
                                              <Button
                                                className="status-btn fail"
                                                w={10}
                                                h={10}
                                                borderRadius="full"
                                                borderWidth="2px"
                                                borderColor={process.approved_status === 'Not Qualified' ? 'red.600' : 'gray.200'}
                                                bg={process.approved_status === 'Not Qualified' ? 'red.500' : 'transparent'}
                                                color={process.approved_status === 'Not Qualified' ? 'white' : 'gray.400'}
                                                _hover={{ borderColor: 'red.400' }}
                                                onClick={() => setStatus(process.id, false)}
                                                p={0}
                                              >
                                                <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </Icon>
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Button
                                                className="status-btn pass"
                                                w={10}
                                                h={10}
                                                borderRadius="full"
                                                borderWidth="2px"
                                                borderColor={process[currentSingleRoundField] === true ? 'green.600' : 'gray.200'}
                                                bg={process[currentSingleRoundField] === true ? 'green.500' : 'transparent'}
                                                color={process[currentSingleRoundField] === true ? 'white' : 'gray.400'}
                                                _hover={{ borderColor: 'green.400' }}
                                                onClick={() => setStatus(process.id, true)}
                                                p={0}
                                              >
                                                <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </Icon>
                                              </Button>
                                              <Button
                                                className="status-btn fail"
                                                w={10}
                                                h={10}
                                                borderRadius="full"
                                                borderWidth="2px"
                                                borderColor={process[currentSingleRoundField] === false ? 'red.600' : 'gray.200'}
                                                bg={process[currentSingleRoundField] === false ? 'red.500' : 'transparent'}
                                                color={process[currentSingleRoundField] === false ? 'white' : 'gray.400'}
                                                _hover={{ borderColor: 'red.400' }}
                                                onClick={() => setStatus(process.id, false)}
                                                p={0}
                                              >
                                                <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </Icon>
                                              </Button>
                                            </>
                                          )}
                                        </Flex>
                                      ) : (
                                        <Text color="gray.400" fontSize="sm" textAlign="center">N/A</Text>
                                      )}
                                    </Td>
                                    <Td px={4} py={3}>
                                      <Flex gap={1} flexWrap="wrap">
                                        {Array.from({ length: Math.max(0, currentActiveRoundIndex) }).map((_, i) => (
                                          <Box
                                            key={i}
                                            w={2}
                                            h={2}
                                            borderRadius="full"
                                            bg="green.500"
                                            title={`${processRounds[i]}: Passed`}
                                          />
                                        ))}
                                      </Flex>
                                    </Td>
                                    <Td px={4} py={3}>
                                      <Input
                                        size="sm"
                                        bg="gray.50"
                                        p={2}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'blue.300', boxShadow: '0 0 0 1px var(--chakra-colors-blue-300)' }}
                                        placeholder="Add note..."
                                        value={process.remarks || ''}
                                        onChange={(e) => handleProcessFieldChange(process.id, 'remarks', e.target.value)}
                                      />
                                    </Td>
                                  </>
                                )}
                              </Tr>
                            ))
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </>
            )}
          </VStack>
        </Container>
      </Box>

      <Modal isOpen={isDownloadOpen} onClose={onDownloadClose} size="2xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent maxH="90vh" className="download-modal">
          <ModalHeader className="download-modal-header">
            Download Approved Registrations
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="download-modal-body" pb={6}>
            <Text fontSize="sm" color="gray.600" mb={4} lineHeight="tall">
              Select student data columns to include in the CSV. Choose whether to include resume PDFs in the ZIP.
            </Text>

            <Box className="download-option-resume" mb={5}>
              <Checkbox
                isChecked={includeResumes}
                onChange={(e) => setIncludeResumes(e.target.checked)}
                colorScheme="green"
                size="md"
                className="resume-checkbox"
              >
                <Text as="span" fontWeight="600">Include Resume PDFs</Text>
                <Text as="span" display="block" fontSize="xs" color="gray.500" mt={0.5} fontWeight="normal">
                  Download as ZIP with CSV + resume PDFs
                </Text>
              </Checkbox>
            </Box>

            <Box className="download-columns-section">
              <Flex mb={3} align="center" justify="space-between">
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  Student Data Columns
                </Text>
                <Checkbox
                  size="sm"
                  isChecked={exportColumns.length === Object.keys(EXPORT_COLUMN_LABELS).length}
                  isIndeterminate={exportColumns.length > 0 && exportColumns.length < Object.keys(EXPORT_COLUMN_LABELS).length}
                  onChange={(e) => handleSelectAllExportColumns(e.target.checked)}
                  colorScheme="blue"
                >
                  Select All
                </Checkbox>
              </Flex>

              <Box className="download-categories">
                {EXPORT_COLUMN_CATEGORIES.map((cat) => (
                  <Box key={cat.id} className="download-category-card">
                    <Flex
                      align="center"
                      justify="space-between"
                      py={2}
                      px={3}
                      bg="gray.50"
                      borderRadius="md"
                      mb={2}
                      cursor="pointer"
                      onClick={() => handleCategoryToggle(cat.id, !isCategorySelected(cat.id))}
                      _hover={{ bg: 'gray.100' }}
                    >
                      <HStack spacing={2}>
                        <Text as="span" fontSize="lg" aria-hidden>{cat.icon}</Text>
                        <Text fontWeight="600" fontSize="sm" color="gray.800">{cat.label}</Text>
                      </HStack>
                      <Checkbox
                        isChecked={isCategorySelected(cat.id)}
                        isIndeterminate={isCategoryIndeterminate(cat.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCategoryToggle(cat.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        colorScheme="blue"
                        size="sm"
                      />
                    </Flex>
                    <Wrap spacing={2} pl={1}>
                      {cat.columns.map((col) => (
                        <WrapItem key={col}>
                          <Checkbox
                            size="sm"
                            isChecked={exportColumns.includes(col)}
                            onChange={() => handleExportColumnToggle(col)}
                            colorScheme="gray"
                            className="column-checkbox"
                          >
                            {EXPORT_COLUMN_LABELS[col] || col}
                          </Checkbox>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                ))}
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter className="download-modal-footer">
            <Button variant="ghost" mr={3} onClick={onDownloadClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<DownloadIcon />}
              onClick={handleDownload}
              isLoading={downloading}
              loadingText="Preparing..."
              isDisabled={exportColumns.length === 0}
              className="download-confirm-btn"
            >
              Download ({exportColumns.length} columns{includeResumes ? ' + resumes' : ''})
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default DriveProcess;
