import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Button,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Flex,
    useToast,
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    useDisclosure,
    Spinner,
    Badge,
    Checkbox,
    CheckboxGroup,
    SimpleGrid,
    Divider,
    Textarea,
    Tooltip
  } from '@chakra-ui/react';
// Force refresh
import { SearchIcon, SettingsIcon, EditIcon, InfoIcon, CheckCircleIcon, DownloadIcon, BellIcon } from '@chakra-ui/icons';
import { FaRocket, FaPlus, FaTimes } from 'react-icons/fa';
import { HiLocationMarker } from 'react-icons/hi';
import { MdCalendarToday, MdHourglassEmpty } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './PlacementEvents.css';
import AdminLayout from '../../components/AdminLayout';
import DriveEligibilityModal from '../../components/placement/DriveEligibilityModal';
import { PlacementService } from '../../services/placement.service';
import { NotificationService } from '../../services/notification.service';

/* Fixed columns matching placement_drive.html: Company/Remarks/TPO, Eligibility, Location & Description, Compensation, Important Dates, Openings/Reg, Actions */
const TABLE_COLUMNS = [
  { id: 'company_remarks_tpo', label: 'Company, Remarks & TPO' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'location_description', label: 'Location & Description' },
  { id: 'compensation', label: 'Compensation Details' },
  { id: 'important_dates', label: 'Important Dates' },
  { id: 'openings_reg', label: 'Openings/Reg' },
  { id: 'actions', label: 'Actions' },
];

/* Granular export columns (merged display columns split for download) */
const EXPORT_COLUMNS = [
  { id: 'company_name', label: 'Company Name', group: 'Company' },
  { id: 'company_remarks', label: 'Company Remarks', group: 'Company' },
  { id: 'tpo', label: 'TPO', group: 'Company' },
  { id: 'eligibility', label: 'Eligibility (School - Program)', group: 'Eligibility' },
  { id: 'job_location', label: 'Job Location', group: 'Location' },
  { id: 'type_of_hiring', label: 'Type of Hiring', group: 'Location' },
  { id: 'job_description', label: 'Job Description', group: 'Location' },
  { id: 'ctc_lpa', label: 'CTC (LPA)', group: 'Compensation' },
  { id: 'base_min', label: 'Base Min (LPA)', group: 'Compensation' },
  { id: 'base_max', label: 'Base Max (LPA)', group: 'Compensation' },
  { id: 'variable_pct', label: 'Variable %', group: 'Compensation' },
  { id: 'stock', label: 'Stock (LPA)', group: 'Compensation' },
  { id: 'stipend', label: 'Stipend', group: 'Compensation' },
  { id: 'drive_date', label: 'Drive Date', group: 'Dates' },
  { id: 'registration_deadline', label: 'Registration Deadline', group: 'Dates' },
  { id: 'registrations_count', label: 'Registrations', group: 'Openings' },
  { id: 'number_of_openings', label: 'Seats', group: 'Openings' },
  { id: 'job_type', label: 'Job Type', group: 'Other' },
  { id: 'academic_year', label: 'Academic Year', group: 'Other' },
  { id: 'placement_status', label: 'Placement Status', group: 'Other' },
];

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEligibilityOpen, onOpen: onEligibilityOpen, onClose: onEligibilityClose } = useDisclosure();
  const { isOpen: isExportModalOpen, onOpen: onExportModalOpen, onClose: onExportModalClose } = useDisclosure();
  const [exportColumnsSelected, setExportColumnsSelected] = useState(() => EXPORT_COLUMNS.map(c => c.id));
  const [modalStep, setModalStep] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(() => TABLE_COLUMNS.map(c => c.id));
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Same total CTC calculation as student side and form: final = max + (max * variable/100) + stock
  const calculateTotalCTC = (c) => {
    if (!c || typeof c !== 'object') return null;
    const max = parseFloat(c.max ?? c.max_lpa ?? 0) || 0;
    const variablePercent = parseFloat(c.variable ?? 0) || 0;
    const stock = parseFloat(c.stock ?? 0) || 0;
    if (max <= 0) return null;
    if (variablePercent === 0 && stock === 0) return max;
    const variableAmount = (max * variablePercent) / 100;
    const total = max + variableAmount + stock;
    return Number(total.toFixed(2));
  };

  // Derive placement_status from dates (same logic as backend). Manual: Cancelled, Postponed.
  const derivePlacementStatusFromDates = (lastDateToReg, eventDatetime) => {
    const now = new Date();
    let regEnd = lastDateToReg ? new Date(lastDateToReg) : null;
    const eventStart = eventDatetime ? new Date(eventDatetime) : null;
    if (regEnd && !isNaN(regEnd.getTime())) {
      const str = String(lastDateToReg).trim();
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str) || (str.length <= 10 && str.indexOf('T') === -1);
      if (dateOnly) regEnd.setHours(23, 59, 59, 999);
    }
    if (!eventStart || isNaN(eventStart.getTime())) return 'Scheduled';
    if (!regEnd || isNaN(regEnd.getTime())) return now < eventStart ? 'Scheduled' : 'Completed';
    if (now <= regEnd) return 'Scheduled';
    if (now < eventStart) return 'Ongoing';
    return 'Completed';
  };

  const isManualPlacementStatus = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'cancelled' || s === 'postponed';
  };

  // Value to show for CTC (calculated or stored) for use in strings/cards
  const getDisplayCTCValue = (ctcStructure) => {
    if (!ctcStructure || typeof ctcStructure !== 'object') return null;
    const calculated = calculateTotalCTC(ctcStructure);
    const stored = ctcStructure.final ?? ctcStructure.package ?? ctcStructure.total;
    return calculated != null ? calculated : (stored != null && stored !== '' ? stored : null);
  };

  // Helper functions for formatting
  const formatCTC = (ctcStructure) => {
    if (!ctcStructure) return '-';
    const finalCTC = getDisplayCTCValue(ctcStructure) ?? '0';
    const min = ctcStructure.min || '0';
    const max = ctcStructure.max || '0';
    const variable = ctcStructure.variable ? `${ctcStructure.variable}%` : '0%';
    const stock = ctcStructure.stock || '0';
    const details = `Range: ${min}-${max} LPA | Var: ${variable} | Stock: ${stock}`;
    return (
      <Tooltip label={details} hasArrow placement="top">
        <Text cursor="pointer" borderBottom="1px dashed" borderColor="gray.400">
          {finalCTC} LPA
        </Text>
      </Tooltip>
    );
  };

  const formatStipend = (stipendStructure) => {
    if (!stipendStructure) return '-';
    
    // Check if min and max are different
    const min = parseFloat(stipendStructure.min || 0);
    const max = parseFloat(stipendStructure.max || 0);
    const avg = stipendStructure.avg || 0;
    
    if (min !== max && min > 0 && max > 0) {
      return `${min} - ${max}`;
    }
    
    // If same or only one available, show average/fixed amount
    return avg || min || max || '-';
  };

  /** Resolve eligibility display. Prefer eligibility_display (school - program pairs from process table).
   * Fallback to eligibility_criteria or drive.school/program when no registrations yet. */
  const getEligibilityDisplay = (drive) => {
    if (drive?.eligibility_display) {
      return { display: drive.eligibility_display };
    }
    const pairs = drive?.school_program_pairs || [];
    if (pairs.length > 0) {
      const display = pairs.map((p) => `${p.school} - ${p.program}`).join(', ');
      return { display };
    }
    const elig = drive?.placement_drive_eligibility;
    const schoolMap = (schoolList || []).reduce((acc, s) => {
      const id = s.id;
      acc[id] = acc[Number(id)] = s.name || s.abbreviation || String(s.id);
      return acc;
    }, {});
    const programMap = (programList || []).reduce((acc, p) => {
      const id = p.id;
      acc[id] = acc[Number(id)] = p.name || String(p.id);
      return acc;
    }, {});
    let schoolNames = [];
    let programNames = [];
    if (elig?.allowed_school_ids?.length) {
      schoolNames = elig.allowed_school_ids.map((id) => schoolMap[id] ?? schoolMap[Number(id)] ?? `ID ${id}`).filter(Boolean);
    }
    if (elig?.allowed_program_ids?.length) {
      programNames = elig.allowed_program_ids.map((id) => programMap[id] ?? programMap[Number(id)] ?? `ID ${id}`).filter(Boolean);
    }
    if (schoolNames.length === 0 && drive?.school) schoolNames = [drive.school];
    if (programNames.length === 0 && drive?.program) programNames = [drive.program];
    const schoolStr = schoolNames.length ? schoolNames.join(', ') : null;
    const programStr = programNames.length ? programNames.join(', ') : null;
    const display = [schoolStr, programStr].filter(Boolean).join(' • ') || '—';
    return { display };
  };

  // Edit State
  const [selectedEventId, setSelectedEventId] = useState(null);

  // View: table | cards. Tab: upcoming | completed | failed | postponed (match HTML)
  const [viewMode, setViewMode] = useState('table');
  const [statusTab, setStatusTab] = useState('upcoming');

  // Filters (HTML only: search, school, job type, TPO, clear)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedJobProfile, setSelectedJobProfile] = useState('');
  const [selectedTpo, setSelectedTpo] = useState('');

  // Scroll to highlighted event
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setSearchQuery('');
      setSelectedAcademicYear('');
      setSelectedSchool('');
      setSelectedJobProfile('');
      setSelectedTpo('');
      if (!loading) {
        setTimeout(() => {
          const element = document.getElementById(`drive-${highlightId}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [location.search, loading, drives]);

  // Metadata Lists
  const [companyList, setCompanyList] = useState([]);
  const [schoolList, setSchoolList] = useState([]);
  const [programList, setProgramList] = useState([]);

  // New Event Form State (Step 1 - no eligibility fields)
  const initialEventState = {
    company_id: '',
    tpo: '',
    year: new Date().getFullYear().toString(),
    job_description: '',
    job_type: '',
    job_location: '',
    event_datetime: '',
    last_date_to_registration: '',
    type_of_hiring: '',
    process_rounds: [],
    number_of_openings: '',
    ctc: '',
    ctc_min: '',
    ctc_max: '',
    ctc_variable: '',
    ctc_stock: '',
    ctc_avg: '',
    ctc_final: '',
    stipend: '',
    stipend_min: '',
    stipend_max: '',
    stipend_avg: '',
    placement_status: 'Scheduled',
    company_remarks: '',
    onboarded_date: '',
    no_shortlisted: '',
    offer_letter_status: ''
  };

  const [newEvent, setNewEvent] = useState(initialEventState);
  const [eligibilityDriveId, setEligibilityDriveId] = useState(null);
  const [notifyingDriveId, setNotifyingDriveId] = useState(null);

  // Manage Drive State - Removed in favor of dedicated page
  // const { isOpen: isManageOpen, onOpen: onManageOpen, onClose: onManageClose } = useDisclosure();
  // const [selectedDrive, setSelectedDrive] = useState(null);
  // const [driveApplications, setDriveApplications] = useState([]);
  // const [loadingApps, setLoadingApps] = useState(false);

  const handleManageClick = async (drive) => {
    navigate(`/placement/events/${drive.id}/registrations`);
  };

  const handleSendNotification = async (drive, e) => {
    if (e) e.stopPropagation();
    setNotifyingDriveId(drive.id);
    try {
      const eventDate = drive.event_datetime ? new Date(drive.event_datetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
      const regDate = drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toLocaleDateString() : '—';
      const ctcVal = getDisplayCTCValue(drive.ctc_structure);
      const ctc = ctcVal != null ? `${ctcVal} LPA` : (drive.ctc || 'TBD');
      const title = `Placement drive: ${drive.company_name || 'Drive'}`;
      const message = [
        `${drive.company_name || 'Company'} – ${drive.job_type || drive.job_profile || '—'}`,
        drive.job_location ? `Location: ${drive.job_location}` : null,
        drive.type_of_hiring ? `Hiring: ${drive.type_of_hiring}` : null,
        `CTC: ${ctc}`,
        `Event date: ${eventDate}`,
        `Last date to register: ${regDate}`,
        drive.job_description ? drive.job_description.slice(0, 200) + (drive.job_description.length > 200 ? '…' : '') : ''
      ].filter(Boolean).join('\n');
      const link = `/placement/events/${drive.id}/process`;
      const created = await NotificationService.create({ title, message, type: 'PLACEMENT', link, drive_id: drive.id });
      toast({ title: 'Notification created', description: 'Redirecting to send to students.', status: 'success', duration: 2000 });
      navigate(`/placement/notifications/${created.id}`);
    } catch (err) {
      toast({ title: 'Failed to create notification', status: 'error', isClosable: true });
    } finally {
      setNotifyingDriveId(null);
    }
  };

  const handleStatusChange = async (processId, field, newValue) => {
    try {
      await PlacementService.updateProcessStatus(processId, { [field]: newValue });
      toast({ title: "Status updated", status: "success", duration: 1000 });
    } catch (error) {
      toast({ title: "Error updating status", status: "error" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => {
      let updated = { ...prev, [name]: value };

      if (name === 'last_date_to_registration' || name === 'event_datetime') {
        if (!isManualPlacementStatus(updated.placement_status)) {
          updated.placement_status = derivePlacementStatusFromDates(updated.last_date_to_registration, updated.event_datetime);
        }
        const reg = updated.last_date_to_registration ? new Date(updated.last_date_to_registration) : null;
        const evt = updated.event_datetime ? new Date(updated.event_datetime) : null;
        if (reg && evt && !isNaN(reg.getTime()) && !isNaN(evt.getTime()) && reg >= evt) {
          setTimeout(() => toast({ title: 'Last date to register should be before event date', status: 'warning', duration: 4000 }), 0);
        }
      }

      if (['ctc_min', 'ctc_max', 'ctc_variable', 'ctc_stock'].includes(name)) {
        const min = parseFloat(updated.ctc_min) || 0;
        const max = parseFloat(updated.ctc_max) || 0;
        const variablePercent = parseFloat(updated.ctc_variable) || 0;
        const stock = parseFloat(updated.ctc_stock) || 0;

        if (updated.ctc_min !== '' && updated.ctc_max !== '') {
          updated.ctc_avg = ((min + max) / 2).toFixed(2);
        } else {
          updated.ctc_avg = '';
        }

        // Final CTC = max + (max * variable/100) + stock; if only max set, final = max
        if (updated.ctc_max !== '') {
          if (updated.ctc_variable !== '' || updated.ctc_stock !== '') {
            const variableAmount = (max * variablePercent) / 100;
            updated.ctc_final = (max + variableAmount + stock).toFixed(2);
          } else {
            updated.ctc_final = max > 0 ? max.toFixed(2) : '';
          }
        } else {
          updated.ctc_final = '';
        }
      }

      if (['stipend_min', 'stipend_max'].includes(name)) {
        const min = parseFloat(updated.stipend_min) || 0;
        const max = parseFloat(updated.stipend_max) || 0;

        if (updated.stipend_min !== '' && updated.stipend_max !== '') {
          updated.stipend_avg = ((min + max) / 2).toFixed(2);
        } else {
          updated.stipend_avg = '';
        }
      }

      return updated;
    });
  };

  const handleEditClick = (drive) => {
    setSelectedEventId(drive.id);
    setModalStep(1);
    const ctcStruct = drive.ctc_structure || {};
    const stipendStruct = drive.stipend_structure || {};

    setNewEvent({
      company_id: drive.company_id || '',
      tpo: drive.tpo || '',
      year: drive.year ? drive.year.toString() : new Date().getFullYear().toString(),
      job_description: drive.job_description || '',
      job_type: drive.job_type || '',
      job_location: drive.job_location || '',
      event_datetime: drive.event_datetime ? new Date(drive.event_datetime).toISOString().slice(0, 16) : '',
      last_date_to_registration: drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toISOString().slice(0, 10) : '',
      type_of_hiring: drive.type_of_hiring || '',
      process_rounds: Array.isArray(drive.process_rounds) ? drive.process_rounds : [],
      number_of_openings: drive.number_of_openings || '',
      ctc: drive.ctc || ctcStruct.package || '',
      stipend: stipendStruct.stipend || '',
      placement_status: isManualPlacementStatus(drive.placement_status)
        ? (drive.placement_status || 'Scheduled')
        : derivePlacementStatusFromDates(drive.last_date_to_registration, drive.event_datetime),
      company_remarks: drive.company_remarks || '',
      onboarded_date: drive.onboarded_date ? new Date(drive.onboarded_date).toISOString().slice(0, 10) : '',
      no_shortlisted: drive.no_shortlisted || '',
      offer_letter_status: drive.offer_letter_status || '',
      ctc_min: ctcStruct.min || '',
      ctc_max: ctcStruct.max || '',
      ctc_avg: ctcStruct.avg || '',
      ctc_variable: ctcStruct.variable || '',
      ctc_stock: ctcStruct.stock || '',
      ctc_final: (() => {
        const max = parseFloat(ctcStruct.max ?? ctcStruct.max_lpa ?? 0) || 0;
        const variablePercent = parseFloat(ctcStruct.variable ?? 0) || 0;
        const stock = parseFloat(ctcStruct.stock ?? 0) || 0;
        if (max <= 0) return ctcStruct.final || '';
        if (variablePercent !== 0 || stock !== 0) {
          const variableAmount = (max * variablePercent) / 100;
          return (max + variableAmount + stock).toFixed(2);
        }
        return ctcStruct.final ?? max.toFixed(2) ?? '';
      })(),
      stipend_min: stipendStruct.min || '',
      stipend_max: stipendStruct.max || '',
      stipend_avg: stipendStruct.avg || ''
    });
    onOpen();
  };

  const openEligibilityModal = (driveId) => {
    setEligibilityDriveId(driveId);
    onEligibilityOpen();
  };

  const handleSaveEvent = async (andConfigureEligibility = false) => {
    const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';
    const missing = [];
    if (isBlank(newEvent.company_id)) missing.push('Company');
    if (isBlank(newEvent.event_datetime)) missing.push('Event Date');

    if (missing.length) {
      toast({ title: `${missing.join(', ')} are required`, status: "warning" });
      return;
    }

    const num = (v) => { const n = parseInt(v, 10); return Number.isNaN(n) ? null : n; };
    const payload = {
      ...newEvent,
      company_id: num(newEvent.company_id),
      number_of_openings: newEvent.number_of_openings === '' ? null : num(newEvent.number_of_openings),
      year: num(newEvent.year),
      no_shortlisted: newEvent.no_shortlisted === '' ? null : num(newEvent.no_shortlisted),
      ctc_structure: {
        package: newEvent.ctc,
        min: newEvent.ctc_min,
        max: newEvent.ctc_max,
        avg: newEvent.ctc_avg,
        variable: newEvent.ctc_variable,
        stock: newEvent.ctc_stock,
        final: newEvent.ctc_final
      },
      stipend_structure: {
        stipend: newEvent.stipend,
        min: newEvent.stipend_min,
        max: newEvent.stipend_max,
        avg: newEvent.stipend_avg
      }
    };

    try {
      let driveId = selectedEventId;
      if (selectedEventId) {
        await PlacementService.updatePlacementDrive(selectedEventId, payload);
        toast({ title: "Event updated successfully", status: "success" });
      } else {
        const created = await PlacementService.addPlacementDrive(payload);
        driveId = created?.id;
        toast({ title: "Event added successfully", status: "success" });
      }
      if (andConfigureEligibility && driveId) {
        onClose();
        setNewEvent(initialEventState);
        setSelectedEventId(null);
        fetchDrives();
        navigate(`/placement/events/${driveId}/process?clicked_add_students=true`);
      } else {
        onClose();
        setNewEvent(initialEventState);
        setSelectedEventId(null);
        fetchDrives();
      }
    } catch (error) {
      const message = error?.message || (selectedEventId ? "Error updating event" : "Error adding event");
      toast({
        title: selectedEventId ? "Error updating event" : "Error adding event",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleModalClose = () => {
    onClose();
    setNewEvent(initialEventState);
    setSelectedEventId(null);
    setModalStep(1);
  };

  /** Render table cell by column id (placement_drive.html layout) */
  const renderTableCell = (drive, colId) => {
    const ctc = drive.ctc_structure || {};
    const stipend = drive.stipend_structure || {};
    switch (colId) {
      case 'company_remarks_tpo':
        return (
          <Box className="col-company-remarks-tpo">
            <Flex gap={3}>
              <Box className="company-logo">{(drive.company_name || ' ')[0]}</Box>
              <Flex flexDirection="column">
                <Box className="company-name">{drive.company_name || '—'}</Box>
                <Box className="company-remarks line-clamp-2">"{drive.company_remarks || ''}"</Box>
                <Box className="company-tpo">TPO: {(drive.tpo || '').toUpperCase()}</Box>
              </Flex>
            </Flex>
          </Box>
        );
      case 'eligibility': {
        const { display } = getEligibilityDisplay(drive);
        const tooltipParts = [display];
        const elig = drive?.placement_drive_eligibility;
        if (elig?.min_cgpa) tooltipParts.push(`Min CGPA: ${elig.min_cgpa}`);
        if (elig?.max_active_backlogs != null) tooltipParts.push(`Max Backlogs: ${elig.max_active_backlogs}`);
        return (
          <Tooltip label={tooltipParts.length ? tooltipParts.join('\n') : display} hasArrow placement="top">
            <Box cursor="help" maxW="100%" minW={0} overflow="hidden" display="block">
              <Badge fontSize="10px" colorScheme="gray" variant="subtle" fontWeight="bold" textTransform="uppercase" letterSpacing="tighter" px={2} py={1} borderRadius="md" whiteSpace="normal" maxW="100%" display="inline-block">
                <Text as="span" noOfLines={2} wordBreak="break-word" overflowWrap="break-word">{display || '—'}</Text>
              </Badge>
            </Box>
          </Tooltip>
        );
      }
      case 'location_description':
        return (
          <Flex flexDirection="column" gap={1} maxW="350px">
            <Flex as="span" alignItems="center" gap={1} fontSize="xs" fontWeight="bold" color="gray.700">
              <Box as={HiLocationMarker} boxSize={3} color="gray.500" /> {drive.job_location || '—'} ({drive.type_of_hiring || '—'})
            </Flex>
            <Text fontSize="11px" color="gray.500" fontWeight="medium" className="line-clamp-2" fontStyle="italic" lineHeight="relaxed">"{drive.job_description || ''}"</Text>
          </Flex>
        );
      case 'compensation': {
        const ctcValue = getDisplayCTCValue(ctc);
        return (
          <Flex flexDirection="column" gap={1}>
            <Text fontSize="sm" fontWeight="bold" color="blue.600">
              {ctcValue != null ? `${ctcValue} LPA` : 'TBD'}
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight="normal">
              Base: {ctc.min || '0'}-{ctc.max || '0'} | Var: {ctc.variable || '0'}%
            </Text>
            {stipend && (stipend.avg || stipend.min || stipend.max) ? (
              <Text fontSize="xs" fontWeight="bold" color="green.500">
                Stipend: ₹{parseInt(stipend.avg || stipend.min || 0, 10).toLocaleString()}
              </Text>
            ) : (
              <Text fontSize="xs" color="gray.400">—</Text>
            )}
          </Flex>
        );
      }
      case 'important_dates':
        return (
          <Box fontSize="11px">
            <Flex as="p" alignItems="center" gap={1} color="gray.600" fontWeight="bold" textTransform="uppercase" letterSpacing="tighter">
              <Box as={MdCalendarToday} boxSize={3} /> Drive: {drive.event_datetime ? new Date(drive.event_datetime).toLocaleDateString() : '—'}
            </Flex>
            <Flex as="p" alignItems="center" gap={1} color="red.400" fontWeight="bold" mt={1} letterSpacing="tighter" textTransform="uppercase">
              <Box as={MdHourglassEmpty} boxSize={3} /> Reg: {drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toLocaleDateString() : '—'}
            </Flex>
          </Box>
        );
      case 'openings_reg':
        return (
          <Flex alignItems="center" gap={3}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.800">{registeredCount(drive)}</Text>
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" fontWeight="bold">Regs</Text>
            </Box>
            <Box w="1px" h={6} bg="gray.200" />
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.800">{drive.number_of_openings ?? '—'}</Text>
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" fontWeight="bold">Seats</Text>
            </Box>
          </Flex>
        );
      case 'actions':
        const driveStatus = (drive.placement_status || 'Scheduled').toLowerCase();
        const isCompleted = driveStatus === 'completed' || driveStatus === 'closed';
        return (
          <HStack spacing={1} justify="flex-end">
            {!isCompleted && (
              <Tooltip label="Send Notification">
                <Button size="sm" variant="ghost" color="gray.400" _hover={{ color: 'orange.600' }} onClick={(e) => handleSendNotification(drive, e)} aria-label="Send Notification" isLoading={notifyingDriveId === drive.id}>
                  <BellIcon boxSize={4} />
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Configure Eligibility">
              <Button size="sm" variant="ghost" color="gray.400" _hover={{ color: 'teal.600' }} onClick={(e) => { e.stopPropagation(); navigate(`/placement/events/${drive.id}/process?clicked_add_students=true`); }} aria-label="Eligibility">
                <CheckCircleIcon boxSize={4} />
              </Button>
            </Tooltip>
            <Tooltip label="Edit Drive">
              <Button size="sm" variant="ghost" color="gray.300" _hover={{ color: 'blue.600' }} onClick={(e) => { e.stopPropagation(); handleEditClick(drive); }} aria-label="Edit">
                <EditIcon boxSize={4} />
              </Button>
            </Tooltip>
          </HStack>
        );
      default:
        return '—';
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await PlacementService.syncDriveStatuses();
      fetchDrives();
    };
    onLoad();
    fetchMetadata();
  }, []);

  // Clear school filter when switching tabs if selected school has no drives in the new tab
  useEffect(() => {
    const tabDrives = drives.filter(d => {
      const s = (d.placement_status || 'Scheduled').toLowerCase();
      if (statusTab === 'upcoming') return s === 'scheduled' || s === 'open';
      if (statusTab === 'ongoing') return s === 'ongoing';
      if (statusTab === 'completed') return s === 'completed' || s === 'closed';
      if (statusTab === 'failed') return s === 'cancelled' || s === 'failed';
      if (statusTab === 'postponed') return s === 'postponed';
      return true;
    });
    const tabSchools = new Set(tabDrives.flatMap(d => (d.school_program_pairs || []).map(p => p.school)).filter(Boolean));
    if (selectedSchool && !tabSchools.has(selectedSchool)) {
      setSelectedSchool('');
    }
  }, [statusTab, drives, selectedSchool]);

  const fetchMetadata = async () => {
    try {
      const [companies, schools, programs] = await Promise.all([
        PlacementService.getAllCompanies(),
        PlacementService.getSchools(),
        PlacementService.getPrograms()
      ]);
      setCompanyList(companies ?? []);
      setSchoolList(schools ?? []);
      setProgramList(programs ?? []);
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('403') || msg.includes('Forbidden') || msg.includes('Session expired')) {
        toast({ title: "Session expired. Please logout and login again.", status: "error", duration: 5000 });
      }
    }
  };


  const fetchDrives = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAllDrives();
      setDrives(data);
    } catch (error) {
      if (error.message === 'Forbidden' || error.message.includes('403')) {
          toast({ title: "Session expired. Please logout and login again.", status: "error", duration: 5000 });
      } else {
        toast({
          title: "Error fetching events",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAcademicYear('');
    setSelectedSchool('');
    setSelectedJobProfile('');
    setSelectedTpo('');
  };

  // Derive filter options from current tab drives (match HTML)
  const drivesByStatus = drives.filter(drive => {
    const s = (drive.placement_status || 'Scheduled').toLowerCase();
    if (statusTab === 'upcoming') return s === 'scheduled' || s === 'open';
    if (statusTab === 'ongoing') return s === 'ongoing';
    if (statusTab === 'completed') return s === 'completed' || s === 'closed';
    if (statusTab === 'failed') return s === 'cancelled' || s === 'failed';
    if (statusTab === 'postponed') return s === 'postponed';
    return true;
  });

  const rawYears = drives.map(d => d.academic_year || (d.year ? String(d.year) : null)).filter(Boolean);
  const academicYearList = [...new Set(rawYears)]
    .filter(y => (y || '').toString().toLowerCase().replace(/\s+/g, ' ') !== 'all year')
    .sort()
    .reverse();
  // Schools: only those that appear in the eligibility column (from school_program_pairs / process table)
  // Dedupe by normalized name, exclude "All Schools", default is no filter
  const rawSchools = drivesByStatus.flatMap(d => (d.school_program_pairs || []).map(p => (p.school || '').trim())).filter(Boolean);
  const seenNormalized = new Set();
  const schools = rawSchools
    .filter(s => {
      if (!s) return false;
      const n = s.replace(/\s+/g, ' ').trim().toLowerCase();
      if (n === 'all schools') return false;
      if (seenNormalized.has(n)) return false;
      seenNormalized.add(n);
      return true;
    })
    .sort();
  const rawJobProfiles = drives.map(d => (d.job_type || '').trim()).filter(Boolean);
  const jobProfilesByKey = new Map();
  rawJobProfiles.forEach(j => {
    const key = j.toLowerCase().replace(/\s+/g, ' ');
    if (key === 'all types') return;
    if (!jobProfilesByKey.has(key)) jobProfilesByKey.set(key, j);
  });
  const jobProfiles = Array.from(jobProfilesByKey.values());
  const rawTpos = drives.map(d => (d.tpo || '').trim()).filter(Boolean);
  const tpoSeen = new Set();
  const tpoList = rawTpos.filter(t => {
    const n = t.toLowerCase().replace(/\s+/g, ' ');
    if (n === 'all tpos') return false;
    if (tpoSeen.has(n)) return false;
    tpoSeen.add(n);
    return true;
  }).sort();

  const filteredDrives = drivesByStatus.filter(drive => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      (drive.company_name?.toLowerCase() || '').includes(query) ||
      (drive.job_profile?.toLowerCase() || '').includes(query) ||
      (drive.job_type?.toLowerCase() || '').includes(query) ||
      (drive.school_program_pairs || []).some(p => (p.school || '').toLowerCase().includes(query)) ||
      (drive.tpo?.toLowerCase() || '').includes(query) ||
      (drive.job_location?.toLowerCase() || '').includes(query) ||
      (drive.company_remarks?.toLowerCase() || '').includes(query);
    const driveYear = drive.academic_year || (drive.year ? String(drive.year) : '');
    const matchesAcademicYear = !selectedAcademicYear || driveYear === selectedAcademicYear;
    const driveSchools = (drive.school_program_pairs || []).map(p => p.school).filter(Boolean);
    const matchesSchool = !selectedSchool || driveSchools.includes(selectedSchool);
    const matchesJobProfile = !selectedJobProfile || drive.job_type === selectedJobProfile;
    const matchesTpo = !selectedTpo || (drive.tpo || '') === selectedTpo;
    return matchesSearch && matchesAcademicYear && matchesSchool && matchesJobProfile && matchesTpo;
  });

  const registeredCount = (drive) => drive.registered_count ?? drive.number_of_registrations ?? 0;

  const visibleTableColumns = TABLE_COLUMNS.filter(c => visibleColumns.includes(c.id));

  const getExportValue = (drive, colId) => {
    if (colId === 'actions') return '';
    const ctc = drive.ctc_structure || {};
    const stipend = drive.stipend_structure || {};
    switch (colId) {
      case 'company_remarks_tpo':
        return [drive.company_name || '', drive.company_remarks || '', drive.tpo || ''].join(' | ');
      case 'eligibility': {
        const { display } = getEligibilityDisplay(drive);
        return display || '—';
      }
      case 'location_description':
        return `${drive.job_location || '—'} (${drive.type_of_hiring || '—'})\n${drive.job_description || ''}`;
      case 'compensation': {
        const ctcVal = getDisplayCTCValue(ctc);
        const parts = [ctcVal != null ? `${ctcVal} LPA` : 'TBD', `Base: ${ctc.min || '0'}-${ctc.max || '0'} | Var: ${ctc.variable || '0'}%`];
        if (stipend && (stipend.avg || stipend.min)) parts.push(`Stipend: ₹${parseInt(stipend.avg || stipend.min || 0, 10).toLocaleString()}`);
        return parts.join('\n');
      }
      case 'important_dates':
        const driveDate = drive.event_datetime ? new Date(drive.event_datetime).toLocaleDateString() : '—';
        const regDate = drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toLocaleDateString() : '—';
        return `Drive: ${driveDate}\nReg: ${regDate}`;
      case 'openings_reg':
        return `Regs: ${registeredCount(drive)} | Seats: ${drive.number_of_openings ?? '—'}`;
      default:
        return '';
    }
  };

  /** Get value for granular export column (used by Export modal) */
  const getExportValueForColumn = (drive, colId) => {
    const ctc = drive.ctc_structure || {};
    const stipend = drive.stipend_structure || {};
    switch (colId) {
      case 'company_name': return drive.company_name || '';
      case 'company_remarks': return drive.company_remarks || '';
      case 'tpo': return drive.tpo || '';
      case 'eligibility': {
        const { display } = getEligibilityDisplay(drive);
        return display || '';
      }
      case 'job_location': return drive.job_location || '';
      case 'type_of_hiring': return drive.type_of_hiring || '';
      case 'job_description': return drive.job_description || '';
      case 'ctc_lpa': return getDisplayCTCValue(ctc) ?? '';
      case 'base_min': return ctc.min ?? '';
      case 'base_max': return ctc.max ?? '';
      case 'variable_pct': return ctc.variable ?? '';
      case 'stock': return ctc.stock ?? '';
      case 'stipend': return (stipend.avg || stipend.min || stipend.max) != null ? `₹${parseInt(stipend.avg || stipend.min || stipend.max || 0, 10).toLocaleString()}` : '';
      case 'drive_date': return drive.event_datetime ? new Date(drive.event_datetime).toLocaleDateString() : '';
      case 'registration_deadline': return drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toLocaleDateString() : '';
      case 'registrations_count': return registeredCount(drive) ?? '';
      case 'number_of_openings': return drive.number_of_openings ?? '';
      case 'job_type': return drive.job_type || '';
      case 'academic_year': return drive.academic_year || (drive.year ? String(drive.year) : '') || '';
      case 'placement_status': return drive.placement_status || '';
      default: return '';
    }
  };

  const handleExportExcel = () => {
    onExportModalOpen();
  };

  const doExportExcel = () => {
    const colsToExport = EXPORT_COLUMNS.filter(c => exportColumnsSelected.includes(c.id));
    if (colsToExport.length === 0) {
      toast({ title: 'Select at least one column to export', status: 'warning' });
      return;
    }
    const data = filteredDrives.map(drive => {
      const row = {};
      colsToExport.forEach(col => {
        row[col.label] = getExportValueForColumn(drive, col.id);
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Placement Drives');
    XLSX.writeFile(wb, `Placement_Drives_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onExportModalClose();
    toast({ title: 'Export downloaded', status: 'success', duration: 2000 });
  };

  const toggleExportColumn = (id) => {
    setExportColumnsSelected(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };
  const selectAllExportColumns = () => setExportColumnsSelected(EXPORT_COLUMNS.map(c => c.id));

  return (
    <AdminLayout fullWidth>
      <Box className="placement-events-page" minH="calc(100vh - 72px)" h="100%" pt={0} pb={0} px={0}>
        <Box as="header" className="placement-events-header">
          <Box>
            <Heading as="h1" size="md" display="flex" alignItems="center" gap={2}>
              <Box as={FaRocket} className="header-icon" boxSize={5} />
              Placement Drives Management
            </Heading>
          </Box>
          <Flex align="center" gap={3} flexWrap="wrap">
            <div className="placement-events-view-toggle">
              <button
                type="button"
                className={viewMode === 'table' ? 'active' : ''}
                onClick={() => setViewMode('table')}
              >
                TABLE VIEW
              </button>
              <button
                type="button"
                className={viewMode === 'cards' ? 'active' : ''}
                onClick={() => setViewMode('cards')}
              >
                CARD VIEW
              </button>
            </div>
            <HStack spacing={2} flexWrap="wrap">
              <Button size="sm" variant="outline" leftIcon={<DownloadIcon />} onClick={handleExportExcel} bg="white" borderColor="gray.200" _hover={{ borderColor: 'blue.200' }}>
                Export Excel
              </Button>
            </HStack>
            <button type="button" className="placement-events-add-btn" onClick={onOpen}>
              <FaPlus size={12} /> ADD DRIVE
            </button>
          </Flex>
        </Box>

        <Box as="main" className="placement-events-main">
          {/* Tabs: Upcoming, Ongoing, Completed, Failed/Cancelled, Postponed */}
          <div className="placement-events-tabs">
            <button type="button" className={statusTab === 'upcoming' ? 'tab-active' : ''} onClick={() => setStatusTab('upcoming')}>Upcoming Drives</button>
            <button type="button" className={statusTab === 'ongoing' ? 'tab-active' : ''} onClick={() => setStatusTab('ongoing')}>Ongoing Drives</button>
            <button type="button" className={statusTab === 'completed' ? 'tab-active' : ''} onClick={() => setStatusTab('completed')}>Completed</button>
            <button type="button" className={statusTab === 'failed' ? 'tab-active' : ''} onClick={() => setStatusTab('failed')}>Failed/Cancelled</button>
            <button type="button" className={statusTab === 'postponed' ? 'tab-active' : ''} onClick={() => setStatusTab('postponed')}>Postponed</button>
          </div>

          {/* Filters Bar */}
          <div className="placement-events-filters">
            <Box flex="1" minW="180px" maxW="280px" className="filter-search-wrap">
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none" height="100%">
                  <SearchIcon color="gray.400" boxSize={4} />
                </InputLeftElement>
                <Input
                  placeholder="Search company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl={10}
                  bg="#f8fafc"
                  borderColor="#e2e8f0"
                  borderRadius="lg"
                  fontSize="sm"
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' }}
                />
              </InputGroup>
            </Box>
            <Select placeholder="All Year" value={selectedAcademicYear || ''} onChange={(e) => setSelectedAcademicYear(e.target.value || '')} size="sm" maxW="160px" bg="#f8fafc" borderColor="#e2e8f0" borderRadius="lg" fontSize="sm">
              {academicYearList.map(ay => <option key={ay} value={ay}>{ay}</option>)}
            </Select>
            <Select placeholder="All Schools" value={selectedSchool || ''} onChange={(e) => setSelectedSchool(e.target.value || '')} size="sm" maxW="160px" bg="#f8fafc" borderColor="#e2e8f0" borderRadius="lg" fontSize="sm">
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select placeholder="All Types" value={selectedJobProfile || ''} onChange={(e) => setSelectedJobProfile(e.target.value || '')} size="sm" maxW="160px" bg="#f8fafc" borderColor="#e2e8f0" borderRadius="lg" fontSize="sm">
              {jobProfiles.map(j => <option key={j} value={j}>{j}</option>)}
            </Select>
            <Select placeholder="All TPOs" value={selectedTpo || ''} onChange={(e) => setSelectedTpo(e.target.value || '')} size="sm" maxW="160px" bg="#f8fafc" borderColor="#e2e8f0" borderRadius="lg" fontSize="sm">
              {tpoList.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <button type="button" className="clear-btn" onClick={handleClearFilters}><FaTimes size={12} /> Clear</button>
          </div>

          {/* Table View (placement_drive.html: 7 columns) */}
          {viewMode === 'table' && (
          <Box className="placement-events-table-wrap">
              <Table size="sm" variant="unstyled" className="placement-events-table" minW="1450px">
                <Thead>
                  <Tr>
                    {visibleTableColumns.map((col) => (
                      <Th key={col.id} textAlign={col.id === 'actions' ? 'right' : 'left'}>
                        {col.label}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {loading ? (
                    <Tr><Td colSpan={visibleTableColumns.length || 1} textAlign="center" py={8}><Spinner /></Td></Tr>
                  ) : filteredDrives.length === 0 ? (
                    <Tr><Td colSpan={visibleTableColumns.length || 1} textAlign="center" py={8} color="gray.500">No drives found</Td></Tr>
                  ) : (
                    filteredDrives.map((drive) => {
                      const isHighlighted = new URLSearchParams(location.search).get('highlight') === String(drive.id);
                      return (
                        <Tr
                          key={drive.id}
                          id={`drive-${drive.id}`}
                          bg={isHighlighted ? 'blue.50' : 'white'}
                          _hover={{ bg: isHighlighted ? 'blue.100' : '#f8fafc', cursor: 'pointer' }}
                          transition="background 0.15s ease"
                          onClick={() => navigate(`/placement/events/${drive.id}/process`)}
                        >
                          {visibleTableColumns.map((col) => (
                            <Td key={col.id} textAlign={col.id === 'actions' ? 'right' : 'left'} maxW={col.id === 'location_description' ? '350px' : col.id === 'eligibility' ? '220px' : undefined} className={col.id === 'eligibility' ? 'col-eligibility' : undefined}>
                              {renderTableCell(drive, col.id)}
                            </Td>
                          ))}
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
          </Box>
          )}

          {/* Card View (placement_drive.html layout) */}
          {viewMode === 'cards' && (
            <div className="placement-events-card-grid">
              {loading ? (
                <Box gridColumn="1 / -1" display="flex" justifyContent="center" py={12}><Spinner /></Box>
              ) : filteredDrives.length === 0 ? (
                <Box gridColumn="1 / -1" color="gray.500" py={8}>No drives found</Box>
              ) : (
                filteredDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="placement-events-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/placement/events/${drive.id}/process`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/placement/events/${drive.id}/process`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Flex justify="space-between" align="flex-start" mb={6}>
                      <Flex align="center" gap={3}>
                        <Box w={12} h={12} borderRadius="xl" bg="#1e293b" color="white" display="flex" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="lg" boxShadow="md">
                          {(drive.company_name || '?')[0]}
                        </Box>
                        <Box>
                          <Heading size="md" color="gray.900">{drive.company_name}</Heading>
                          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                            {getEligibilityDisplay(drive).display || '—'}
                          </Text>
                        </Box>
                      </Flex>
                      <Badge bg="gray.100" color="gray.600" fontSize="10px" fontWeight="bold" px={3} py={1} borderRadius="full" textTransform="uppercase">{drive.job_type || drive.job_profile || '—'}</Badge>
                    </Flex>
                    <Box flex={1} className="placement-events-card-body">
                      <Box p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.100" mb={4}>
                        <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={1}>Location & Description</Text>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={1}>{drive.job_location || '—'}</Text>
                        <Text fontSize="xs" color="gray.600" className="line-clamp-2" fontStyle="italic">"{drive.job_description || '—'}"</Text>
                      </Box>
                      <Flex gap={4} mb={4}>
                        <Box>
                          <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={1}>Compensation</Text>
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">{(() => { const v = getDisplayCTCValue(drive.ctc_structure); return v != null ? `${v} LPA` : (drive.ctc || 'TBD'); })()}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={1}>Hiring Type</Text>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">{drive.type_of_hiring || '—'}</Text>
                        </Box>
                      </Flex>
                      <Box pt={4} borderTop="1px solid" borderColor="gray.100">
                        <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={1}>Company Remarks</Text>
                        <Text fontSize="xs" color="gray.500" className="line-clamp-2" fontStyle="italic">"{drive.company_remarks || '—'}"</Text>
                        <Text fontSize="9px" fontWeight="bold" color="blue.500" textTransform="uppercase" letterSpacing="wider" mt={2}>Lead TPO: {drive.tpo || '—'}</Text>
                      </Box>
                    </Box>
                    <Flex justify="space-between" align="center" pt={4} mt={6} borderTop="1px solid" borderColor="gray.100">
                      <Box fontSize="11px">
                        <Text color="gray.400" fontWeight="bold" textTransform="uppercase" fontSize="10px">Applied Strength</Text>
                        <Text color="gray.900" fontWeight="bold">{registeredCount(drive)} Registered / {drive.number_of_openings || '—'} Seats</Text>
                      </Box>
                      <HStack spacing={1}>
                        {!['completed', 'closed'].includes((drive.placement_status || '').toLowerCase()) && (
                          <Tooltip label="Send Notification"><Button size="sm" bg="gray.50" color="gray.400" _hover={{ bg: 'orange.600', color: 'white' }} w={9} h={9} borderRadius="xl" onClick={(e) => handleSendNotification(drive, e)} aria-label="Send Notification" isLoading={notifyingDriveId === drive.id}><BellIcon boxSize={4} /></Button></Tooltip>
                        )}
                        <Tooltip label="Configure Eligibility"><Button size="sm" bg="gray.50" color="gray.400" _hover={{ bg: 'teal.600', color: 'white' }} w={9} h={9} borderRadius="xl" onClick={(e) => { e.stopPropagation(); navigate(`/placement/events/${drive.id}/process?clicked_add_students=true`); }} aria-label="Eligibility"><CheckCircleIcon boxSize={4} /></Button></Tooltip>
                        <Tooltip label="Edit"><Button size="sm" bg="gray.50" color="gray.400" _hover={{ bg: 'blue.600', color: 'white' }} w={9} h={9} borderRadius="xl" onClick={(e) => { e.stopPropagation(); handleEditClick(drive); }} aria-label="Edit"><SettingsIcon boxSize={4} /></Button></Tooltip>
                      </HStack>
                    </Flex>
                  </div>
                ))
              )}
            </div>
          )}

        {/* Export Excel modal - select columns for download */}
        <Modal isOpen={isExportModalOpen} onClose={onExportModalClose} size="md" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader display="flex" alignItems="center" gap={2}>
              <Box as={DownloadIcon} boxSize={5} color="green.500" />
              Export to Excel
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Select which columns to include in the download. Merged display columns are split into individual fields.
              </Text>
              <VStack align="stretch" spacing={3}>
                {['Company', 'Eligibility', 'Location', 'Compensation', 'Dates', 'Openings', 'Other'].map(group => (
                  <Box key={group}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>{group}</Text>
                    <VStack align="stretch" spacing={1} pl={2}>
                      {EXPORT_COLUMNS.filter(c => c.group === group).map(col => (
                        <Checkbox key={col.id} isChecked={exportColumnsSelected.includes(col.id)} onChange={() => toggleExportColumn(col.id)} size="sm">
                          <Text fontSize="sm">{col.label}</Text>
                        </Checkbox>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </VStack>
              <HStack mt={4} gap={2}>
                <Button size="sm" variant="outline" onClick={selectAllExportColumns}>
                  Select all
                </Button>
                <Button size="sm" colorScheme="green" leftIcon={<DownloadIcon />} onClick={doExportExcel}>
                  Download
                </Button>
              </HStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Add/Edit Drive Modal */}
        <Modal isOpen={isOpen} onClose={handleModalClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
          <ModalContent bg="gray.50">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" bg="white" borderTopRadius="md">
              {selectedEventId ? 'Edit Placement Drive' : 'Add New Placement Drive'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={8} pt={6}>
              <VStack spacing={6} align="stretch">
                
                {/* Section 1: Basic Information */}
                <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                  <HStack mb={5} spacing={3} borderBottomWidth="1px" pb={3} borderColor="gray.100">
                    <Box bg="blue.50" p={2} borderRadius="md">
                       <InfoIcon color="blue.500" boxSize={4} />
                    </Box>
                    <Heading size="md" color="gray.700">Basic Information</Heading>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium" color="gray.600">Company Name</FormLabel>
                      <HStack spacing={2} align="stretch">
                        <Select name="company_id" value={newEvent.company_id} onChange={handleInputChange} placeholder="Select Company" bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} flex={1}>
                          {companyList.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                        </Select>
                        <Button size="md" variant="outline" colorScheme="blue" leftIcon={<FaPlus size={12} />} onClick={() => navigate('/placement/companies?add=1')} whiteSpace="nowrap">
                          Add new
                        </Button>
                      </HStack>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">Company Remarks</FormLabel>
                      <Input name="company_remarks" value={newEvent.company_remarks} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">TPO Name</FormLabel>
                      <Input name="tpo" value={newEvent.tpo} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">Year</FormLabel>
                      <Input type="number" name="year" value={newEvent.year} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} />
                    </FormControl>

                    <FormControl>
                       <FormLabel fontWeight="medium" color="gray.600">Last Date to Reg</FormLabel>
                       <Input 
                         type="date" 
                         name="last_date_to_registration" 
                         value={newEvent.last_date_to_registration} 
                         onChange={handleInputChange}
                         max="9999-12-31"
                         bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} 
                       />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="medium" color="gray.600">Event Date</FormLabel>
                      <Input 
                        type="datetime-local" 
                        name="event_datetime" 
                        value={newEvent.event_datetime} 
                        onChange={handleInputChange}
                        max="9999-12-31T23:59"
                        bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} 
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">Placement Status</FormLabel>
                      <Select name="placement_status" value={String(newEvent.placement_status || '').toLowerCase() === 'cancelled' ? 'Failed' : (newEvent.placement_status || '')} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }}>
                        <option value="Scheduled">Upcoming Drives</option>
                        <option value="Ongoing">Ongoing Drives</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed/Cancelled</option>
                        <option value="Postponed">Postponed</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Section 2: Job Details */}
                <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                  <HStack mb={5} spacing={3} borderBottomWidth="1px" pb={3} borderColor="gray.100">
                    <Box bg="purple.50" p={2} borderRadius="md">
                       <SearchIcon color="purple.500" boxSize={4} />
                    </Box>
                    <Heading size="md" color="gray.700">Job Details</Heading>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium" color="gray.600">Job Type</FormLabel>
                      <Select name="job_type" value={newEvent.job_type} onChange={handleInputChange} placeholder="Select Job Type" bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }}>
                        <option value="Full Time">Full Time</option>
                        <option value="Internship">Internship</option>
                        <option value="Internship + FTE">Internship + FTE</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">Type of Hiring</FormLabel>
                      <Select name="type_of_hiring" value={newEvent.type_of_hiring} onChange={handleInputChange} placeholder="Select Hiring Type" bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }}>
                         <option value="On Campus">On Campus</option>
                         <option value="Off Campus">Off Campus</option>
                         <option value="Pool Campus">Pool Campus</option>
                         <option value="Virtual">Virtual</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">Job Location</FormLabel>
                      <Input name="job_location" value={newEvent.job_location} onChange={handleInputChange} placeholder="City/State" bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }} />
                    </FormControl>

                    <FormControl gridColumn={{ md: "span 2" }}>
                      <FormLabel fontWeight="medium" color="gray.600">Job Description</FormLabel>
                      <Textarea name="job_description" value={newEvent.job_description} onChange={handleInputChange} placeholder="Job description..." rows={3} bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }} />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Section 3: Compensation */}
                <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                  <HStack mb={5} spacing={3} borderBottomWidth="1px" pb={3} borderColor="gray.100">
                    <Box bg="green.50" p={2} borderRadius="md">
                       <Text fontSize="lg" fontWeight="bold" color="green.600">₹</Text>
                    </Box>
                    <Heading size="md" color="gray.700">Compensation Details</Heading>
                  </HStack>
                  
                  <Box bg="gray.50" p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor="gray.200">
                    <Text fontWeight="bold" fontSize="sm" mb={3} color="green.700" textTransform="uppercase" letterSpacing="wide">CTC Structure (LPA)</Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Minimum</FormLabel>
                        <Input type="number" name="ctc_min" value={newEvent.ctc_min} onChange={handleInputChange} placeholder="Min" bg="white" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Maximum</FormLabel>
                        <Input type="number" name="ctc_max" value={newEvent.ctc_max} onChange={handleInputChange} placeholder="Max" bg="white" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Average (Calc)</FormLabel>
                        <Input type="number" name="ctc_avg" value={newEvent.ctc_avg} isReadOnly bg="gray.100" color="gray.600" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Variable Pay (%)</FormLabel>
                        <Input type="number" name="ctc_variable" value={newEvent.ctc_variable} onChange={handleInputChange} placeholder="e.g. 10" bg="white" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Stock Options</FormLabel>
                        <Input type="number" name="ctc_stock" value={newEvent.ctc_stock} onChange={handleInputChange} placeholder="Stock" bg="white" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="green.600">Final CTC (Calc)</FormLabel>
                        <Input type="number" name="ctc_final" value={newEvent.ctc_final} isReadOnly bg="green.50" color="green.700" fontWeight="bold" borderColor="green.200" />
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  <Box bg="gray.50" p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor="gray.200">
                    <Text fontWeight="bold" fontSize="sm" mb={3} color="blue.700" textTransform="uppercase" letterSpacing="wide">Stipend Structure (Monthly)</Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Minimum</FormLabel>
                        <Input type="number" name="stipend_min" value={newEvent.stipend_min} onChange={handleInputChange} placeholder="Min" bg="white" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Maximum</FormLabel>
                        <Input type="number" name="stipend_max" value={newEvent.stipend_max} onChange={handleInputChange} placeholder="Max" bg="white" />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Average (Calc)</FormLabel>
                        <Input type="number" name="stipend_avg" value={newEvent.stipend_avg} isReadOnly bg="gray.100" color="gray.600" />
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                </Box>

                {/* Section 4: Status & Openings */}
                <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                  <HStack mb={5} spacing={3} borderBottomWidth="1px" pb={3} borderColor="gray.100">
                    <Box bg="orange.50" p={2} borderRadius="md">
                       <SettingsIcon color="orange.500" boxSize={4} />
                    </Box>
                    <Heading size="md" color="gray.700">Status & Openings</Heading>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">Number of Openings</FormLabel>
                      <Input type="number" name="number_of_openings" value={newEvent.number_of_openings} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} />
                    </FormControl>

                    <FormControl>
                       <FormLabel fontWeight="medium" color="gray.600">Onboarded Date</FormLabel>
                       <Input 
                         type="date" 
                         name="onboarded_date" 
                         value={newEvent.onboarded_date} 
                         onChange={handleInputChange}
                         max="9999-12-31"
                         bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} 
                       />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium" color="gray.600">No Shortlisted</FormLabel>
                      <Input type="number" name="no_shortlisted" value={newEvent.no_shortlisted} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} />
                    </FormControl>

                    <FormControl>
                       <FormLabel fontWeight="medium" color="gray.600">Offer Letter Status</FormLabel>
                       <Select name="offer_letter_status" value={newEvent.offer_letter_status} onChange={handleInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} placeholder="Select Status">
                          <option value="Pending">Pending</option>
                          <option value="Released">Released</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                       </Select>
                    </FormControl>
                    <FormControl gridColumn={{ md: "span 2" }}>
                      <FormLabel fontWeight="medium" color="gray.600">Process Rounds</FormLabel>
                      <CheckboxGroup
                        value={newEvent.process_rounds || []}
                        onChange={(values) => setNewEvent(prev => ({ ...prev, process_rounds: values }))}
                      >
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
                          <Checkbox value="OA">OA</Checkbox>
                          <Checkbox value="GD">GD</Checkbox>
                          <Checkbox value="Technical Round">Technical Round</Checkbox>
                          <Checkbox value="Interview">Interview</Checkbox>
                          <Checkbox value="HR Round">HR Round</Checkbox>
                        </SimpleGrid>
                      </CheckboxGroup>
                    </FormControl>
                  </SimpleGrid>
                </Box>

              </VStack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" bg="gray.50" borderBottomRadius="md">
              <Button variant="outline" mr={3} onClick={handleModalClose} bg="white">Cancel</Button>
              <Button variant="outline" mr={3} onClick={() => handleSaveEvent(true)} colorScheme="teal">
                {selectedEventId ? 'Save & Configure Eligibility' : 'Save & Configure Eligibility'}
              </Button>
              <Button colorScheme="blue" onClick={() => handleSaveEvent(false)} px={8}>{selectedEventId ? 'Update Drive' : 'Save Drive'}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <DriveEligibilityModal
          isOpen={isEligibilityOpen}
          onClose={onEligibilityClose}
          driveId={eligibilityDriveId}
          schoolList={schoolList}
          onSuccess={fetchDrives}
        />

        </Box>
      </Box>
    </AdminLayout>
  );
};

export default Events;
