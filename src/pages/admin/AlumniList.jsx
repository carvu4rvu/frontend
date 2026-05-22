import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  Button,
  HStack,
  Input,
  Flex,
  useToast,
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
  Badge,
  Icon,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Switch,
  SimpleGrid,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ExternalLinkIcon, CopyIcon, EmailIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaGraduationCap, FaKey, FaExchangeAlt, FaHistory, FaUndo } from 'react-icons/fa';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { buildPlacementNavState } from '../../utils/placementNavigationHistory';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';
import AlumniRegistrationCodes from './AlumniRegistrationCodes';
import './AlumniPortal.css';

function AlumniTabLabel({ icon, children }) {
  return (
    <HStack spacing={2}>
      <Icon as={icon} boxSize={3} aria-hidden />
      <Text as="span">{children}</Text>
    </HStack>
  );
}

function shortBatchId(batchId) {
  const s = String(batchId || '');
  return s.length > 8 ? `${s.slice(0, 8)}…` : s || '—';
}

function canRevertConversionBatch(batch) {
  return (batch?.logs || []).some((l) => l.status === 'success');
}

function isConversionBatchFullyReverted(batch) {
  const logs = batch?.logs || [];
  return logs.length > 0 && logs.every((l) => l.status === 'reverted');
}

function logStatusColorScheme(status) {
  if (status === 'success') return 'green';
  if (status === 'failed') return 'red';
  if (status === 'reverted') return 'purple';
  if (status === 'pending') return 'yellow';
  return 'gray';
}

function formatConversionBatchWhen(createdAt) {
  if (!createdAt) return '—';
  try {
    return new Date(createdAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return createdAt;
  }
}

function formatOfferMeta(alum) {
  const parts = [];
  const jt = alum.accepted_offer?.job_type;
  const ay = alum.accepted_offer?.academic_year;
  if (jt) parts.push(jt);
  if (ay) parts.push(`AY ${ay}`);
  return parts.join(' · ');
}

function AlumniGridCard({ alum, onOpen }) {
  const usn = alum.usn || alum.student_id;
  const batch = alum.batch_year ?? alum.graduation_year;
  const schoolProgram = [alum.school_name, alum.program_name].filter(Boolean).join(' · ');
  const role = alum.current_designation?.trim();
  const company = alum.current_company?.trim();
  const hasPlacement = !!(role || company);
  const offerMeta = formatOfferMeta(alum);
  const personalEmail = alum.personal_email?.trim();

  return (
    <article
      className="alumni-portal__card"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="alumni-portal__card-head">
        <div className="alumni-portal__card-head-main">
          <h3 className="alumni-portal__card-name">{alum.full_name || '—'}</h3>
          {usn && <p className="alumni-portal__card-usn">{usn}</p>}
          {schoolProgram && <p className="alumni-portal__card-meta">{schoolProgram}</p>}
        </div>
        <div className="alumni-portal__card-badges">
          {batch != null && batch !== '' && (
            <span className="alumni-portal__card-year">Batch {batch}</span>
          )}
          <span
            className={`alumni-portal__card-source ${
              alum.alumni_source === 'converted'
                ? 'alumni-portal__card-source--converted'
                : 'alumni-portal__card-source--registered'
            }`}
          >
            {alum.alumni_source === 'converted' ? 'Converted' : 'Registered'}
          </span>
        </div>
      </div>

      <div
        className={`alumni-portal__card-placement ${
          hasPlacement ? '' : 'alumni-portal__card-placement--empty'
        }`}
      >
        <p className="alumni-portal__card-section-label">Accepted placement</p>
        {hasPlacement ? (
          <>
            <p className="alumni-portal__card-role">{role || '—'}</p>
            <p className="alumni-portal__card-company">{company || '—'}</p>
            {offerMeta && <p className="alumni-portal__card-offer-meta">{offerMeta}</p>}
            {alum.placement_from_offer && (
              <span className="alumni-portal__card-offer-tag">Synced from placement offer</span>
            )}
          </>
        ) : (
          <p className="alumni-portal__card-empty">No accepted placement on record</p>
        )}
      </div>

      {personalEmail && (
        <p className="alumni-portal__card-email" title={personalEmail}>
          {personalEmail}
        </p>
      )}

      {alum.current_work_location?.trim() && (
        <p className="alumni-portal__card-location">{alum.current_work_location.trim()}</p>
      )}

      <div className="alumni-portal__card-foot">
        <span
          className={`alumni-portal__card-status ${
            alum.profile_data_added ? 'alumni-portal__card-status--added' : 'alumni-portal__card-status--pending'
          }`}
        >
          Profile {alum.profile_data_added ? 'complete' : 'pending'}
        </span>
        <div className="alumni-portal__card-icons">
          {personalEmail && <Icon as={EmailIcon} title={personalEmail} aria-label="Has personal email" />}
          {alum.linkedin && <Icon as={ExternalLinkIcon} title="LinkedIn profile" aria-label="LinkedIn" />}
        </div>
      </div>
    </article>
  );
}

const AlumniList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConvertOpen, onOpen: onConvertOpen, onClose: onConvertClose } = useDisclosure();
  const { isOpen: isRevertOpen, onOpen: onRevertOpen, onClose: onRevertClose } = useDisclosure();

  // Read initial values from URL query params
  const initialSchoolId = searchParams.get('school_id') || '';
  const initialProgramId = searchParams.get('program_id') || '';
  const initialBatch = searchParams.get('batch') || searchParams.get('year_of_joining') || 'all';
  const initialCurrentYear = searchParams.get('current_year') || 'all';
  const initialSection = searchParams.get('section') || 'all';
  const initialOptIn = searchParams.get('opt_in') || 'all';
  const initialIsPlaced = searchParams.get('is_placed') || 'all';
  const initialConversionsSearch = searchParams.get('search') || '';
  const initialPersonalEmailOnly =
    searchParams.get('personal_email') === '1' || searchParams.get('has_personal_email') === 'true';
  const initialTab = searchParams.get('tab');
  const [tabIndex, setTabIndex] = useState(
    initialTab === 'conversions' ? 2 : initialTab === 'logs' ? 3 : 0
  );
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversionsSchools, setConversionsSchools] = useState([]);
  const [conversionsPrograms, setConversionsPrograms] = useState([]);
  const [conversionsRows, setConversionsRows] = useState([]);
  const [conversionsSchoolId, setConversionsSchoolId] = useState(initialSchoolId);
  const [conversionsProgramId, setConversionsProgramId] = useState(initialProgramId);
  const [conversionsLoading, setConversionsLoading] = useState(false);
  const [conversionsFilterPersonalEmail, setConversionsFilterPersonalEmail] = useState(initialPersonalEmailOnly);
  const [conversionsBatch, setConversionsBatch] = useState(initialBatch);
  const [conversionsCurrentYear, setConversionsCurrentYear] = useState(initialCurrentYear);
  const [conversionsSection, setConversionsSection] = useState(initialSection);
  const [conversionsOptIn, setConversionsOptIn] = useState(initialOptIn);
  const [conversionsIsPlaced, setConversionsIsPlaced] = useState(initialIsPlaced);
  const [conversionsSearch, setConversionsSearch] = useState(initialConversionsSearch);
  const [conversionsSearchDebounced, setConversionsSearchDebounced] = useState(initialConversionsSearch);
  const [conversionsFilterMeta, setConversionsFilterMeta] = useState({
    years: [],
    current_years: [],
    sections: [],
  });
  const [conversionsSelectedUsns, setConversionsSelectedUsns] = useState(new Set());
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertResult, setConvertResult] = useState(null);
  const [conversionBatches, setConversionBatches] = useState([]);
  const [conversionLogsLoading, setConversionLogsLoading] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [revertBatchTarget, setRevertBatchTarget] = useState(null);
  const [revertLoading, setRevertLoading] = useState(false);

  const [newAlumni, setNewAlumni] = useState({
    usn: '',
    full_name: '',
    graduation_year: '',
    institution_name: '',
    current_company: '',
    current_designation: '',
    current_work_location: '',
    personal_email: '',
    phone_number: '',
    linkedin: '',
    other_links: '',
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  // Auto-load conversions if URL params are present
  useEffect(() => {
    if (initialTab === 'conversions' && initialSchoolId && initialProgramId) {
      // Fetch meta first, then data will be fetched by another effect
      fetchConversionsMeta();
    }
  }, []);

  const handleTabsChange = (index) => {
    setTabIndex(index);
    // Update URL when changing tabs
    const next = new URLSearchParams(searchParams);
    if (index === 2) {
      next.set('tab', 'conversions');
    } else if (index === 3) {
      next.set('tab', 'logs');
    } else {
      next.delete('tab');
      next.delete('school_id');
      next.delete('program_id');
      next.delete('batch');
      next.delete('year_of_joining');
      next.delete('current_year');
      next.delete('section');
      next.delete('opt_in');
      next.delete('is_placed');
      next.delete('search');
      next.delete('personal_email');
      next.delete('has_personal_email');
    }
    setSearchParams(next, { replace: true });
  };

  const syncConversionsUrl = useCallback(
    (overrides = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'conversions');
        const sid = overrides.school_id ?? conversionsSchoolId;
        const pid = overrides.program_id ?? conversionsProgramId;
        const batch = overrides.batch ?? conversionsBatch;
        const currentYear = overrides.current_year ?? conversionsCurrentYear;
        const section = overrides.section ?? conversionsSection;
        const optIn = overrides.opt_in ?? conversionsOptIn;
        const isPlaced = overrides.is_placed ?? conversionsIsPlaced;
        const search = overrides.search ?? conversionsSearchDebounced;
        const personalOnly =
          overrides.personal_email ?? (conversionsFilterPersonalEmail ? '1' : '0');

        if (sid) next.set('school_id', sid);
        else next.delete('school_id');
        if (pid) next.set('program_id', pid);
        else next.delete('program_id');
        if (batch && batch !== 'all') next.set('batch', batch);
        else {
          next.delete('batch');
          next.delete('year_of_joining');
        }
        if (currentYear && currentYear !== 'all') next.set('current_year', currentYear);
        else next.delete('current_year');
        if (section && section !== 'all') next.set('section', section);
        else next.delete('section');
        if (optIn && optIn !== 'all') next.set('opt_in', optIn);
        else next.delete('opt_in');
        if (isPlaced && isPlaced !== 'all') next.set('is_placed', isPlaced);
        else next.delete('is_placed');
        if (search && String(search).trim()) next.set('search', String(search).trim());
        else next.delete('search');
        if (personalOnly === '1' || personalOnly === true) next.set('personal_email', '1');
        else next.delete('personal_email');
        return next;
      }, { replace: true });
    },
    [
      setSearchParams,
      conversionsSchoolId,
      conversionsProgramId,
      conversionsBatch,
      conversionsCurrentYear,
      conversionsSection,
      conversionsOptIn,
      conversionsIsPlaced,
      conversionsSearchDebounced,
      conversionsFilterPersonalEmail,
    ]
  );

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAllAlumni();
      setAlumni(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Error fetching alumni',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmails = () => {
    const emails = filteredAlumni
      .map((a) => a.personal_email)
      .filter(Boolean)
      .join(', ');
    if (!emails) {
      toast({ title: 'No emails to copy', status: 'info' });
      return;
    }
    navigator.clipboard.writeText(emails);
    toast({ title: 'Emails copied to clipboard', status: 'success' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAlumni((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAlumni = async () => {
    if (!newAlumni.full_name) {
      toast({ title: 'Full name is required', status: 'warning' });
      return;
    }
    try {
      await PlacementService.addAlumni(newAlumni);
      toast({ title: 'Alumni added successfully', status: 'success' });
      onClose();
      setNewAlumni({
        usn: '',
        full_name: '',
        graduation_year: '',
        institution_name: '',
        current_company: '',
        current_designation: '',
        current_work_location: '',
        personal_email: '',
        phone_number: '',
        linkedin: '',
        other_links: '',
      });
      fetchAlumni();
    } catch (error) {
      toast({ title: error.message || 'Error adding alumni', status: 'error' });
    }
  };

  const alumniList = Array.isArray(alumni) ? alumni : [];

  const filteredAlumni = alumniList.filter((a) => {
    const q = searchQuery.toLowerCase();
    const haystack = [a.full_name, a.usn || a.student_id, a.current_company, a.current_designation, a.personal_email, a.school_name]
      .map((v) => (v == null ? '' : String(v)).toLowerCase());
    return haystack.some((s) => s.includes(q));
  });

  const linkId = (a) => a.student_id || a.usn || a.id;

  const fetchConversionsMeta = useCallback(async () => {
    try {
      const data = await PlacementService.getAlumniConversions();
      setConversionsSchools(data.schools || []);
      setConversionsPrograms(data.programs || []);
    } catch (e) {
      toast({ title: 'Error loading schools/programs', status: 'error' });
    }
  }, [toast]);

  const buildConversionsQueryParams = useCallback(() => {
    const sid = conversionsSchoolId && conversionsSchoolId !== '' ? conversionsSchoolId : null;
    const pid = conversionsProgramId && conversionsProgramId !== '' ? conversionsProgramId : null;
    if (sid == null || pid == null) return null;
    return {
      school_id: sid,
      program_id: pid,
      batch: conversionsBatch !== 'all' ? conversionsBatch : undefined,
      current_year: conversionsCurrentYear !== 'all' ? conversionsCurrentYear : undefined,
      section: conversionsSection !== 'all' ? conversionsSection : undefined,
      opt_in: conversionsOptIn !== 'all' ? conversionsOptIn : undefined,
      is_placed: conversionsIsPlaced !== 'all' ? conversionsIsPlaced : undefined,
      search: conversionsSearchDebounced.trim() || undefined,
      has_personal_email: conversionsFilterPersonalEmail || undefined,
    };
  }, [
    conversionsSchoolId,
    conversionsProgramId,
    conversionsBatch,
    conversionsCurrentYear,
    conversionsSection,
    conversionsOptIn,
    conversionsIsPlaced,
    conversionsSearchDebounced,
    conversionsFilterPersonalEmail,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setConversionsSearchDebounced(conversionsSearch), 400);
    return () => clearTimeout(timer);
  }, [conversionsSearch]);

  const fetchConversionsData = useCallback(async () => {
    const params = buildConversionsQueryParams();
    if (params == null) {
      setConversionsRows([]);
      setConversionsFilterMeta({ years: [], current_years: [], sections: [] });
      return;
    }
    setConversionsLoading(true);
    setConversionsSelectedUsns(new Set());
    try {
      const data = await PlacementService.getAlumniConversions(params);
      setConversionsRows(data.rows || []);
      setConversionsFilterMeta(data.filter_meta || { years: [], current_years: [], sections: [] });
      if (!conversionsSchools.length) setConversionsSchools(data.schools || []);
      if (!conversionsPrograms.length) setConversionsPrograms(data.programs || []);
      syncConversionsUrl();
    } catch (e) {
      toast({ title: 'Error loading conversions data', status: 'error' });
      setConversionsRows([]);
    } finally {
      setConversionsLoading(false);
    }
  }, [
    buildConversionsQueryParams,
    toast,
    conversionsSchools.length,
    conversionsPrograms.length,
    syncConversionsUrl,
  ]);

  useEffect(() => {
    if (tabIndex === 2) fetchConversionsMeta();
  }, [tabIndex, fetchConversionsMeta]);

  const fetchConversionLogs = useCallback(async () => {
    setConversionLogsLoading(true);
    try {
      const batches = await PlacementService.getAlumniConversionLogs({ limit: 500, grouped: true });
      setConversionBatches(Array.isArray(batches) ? batches : []);
      setExpandedBatchId(null);
    } catch (e) {
      toast({ title: 'Failed to load conversion logs', status: 'error' });
    } finally {
      setConversionLogsLoading(false);
    }
  }, [toast]);

  const toggleConversionBatch = (batchId) => {
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
  };

  const openRevertBatchModal = (batch, e) => {
    e?.stopPropagation?.();
    setRevertBatchTarget(batch);
    onRevertOpen();
  };

  const handleRevertBatchConfirm = async () => {
    if (!revertBatchTarget?.batch_id) return;
    setRevertLoading(true);
    try {
      const data = await PlacementService.revertAlumniConversionBatch(revertBatchTarget.batch_id);
      toast({
        title: 'Bulk conversion reverted',
        description: data?.message || 'Students were restored; logs remain marked as reverted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onRevertClose();
      setRevertBatchTarget(null);
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'logs');
      window.location.assign(`/placement/alumni?${next.toString()}`);
      return;
    } catch (e) {
      toast({
        title: 'Revert failed',
        description: e?.message || 'Could not revert this batch.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRevertLoading(false);
    }
  };

  useEffect(() => {
    if (tabIndex === 3) fetchConversionLogs();
  }, [tabIndex, fetchConversionLogs]);

  useEffect(() => {
    if (tabIndex === 2 && conversionsSchoolId && conversionsProgramId) {
      fetchConversionsData();
    }
  }, [
    tabIndex,
    conversionsSchoolId,
    conversionsProgramId,
    conversionsBatch,
    conversionsCurrentYear,
    conversionsSection,
    conversionsOptIn,
    conversionsIsPlaced,
    conversionsSearchDebounced,
    conversionsFilterPersonalEmail,
    fetchConversionsData,
  ]);

  const conversionsProgramsFiltered = conversionsSchoolId
    ? (conversionsPrograms || []).filter((p) => String(p.school_id) === String(conversionsSchoolId))
    : (conversionsPrograms || []);

  const conversionsRowsFiltered = conversionsRows || [];

  const conversionsSelectAll = conversionsRowsFiltered.length > 0 && conversionsRowsFiltered.every((r) => conversionsSelectedUsns.has(r.usn));
  const conversionsSelectSome = conversionsRowsFiltered.some((r) => conversionsSelectedUsns.has(r.usn));

  const toggleConversionsSelectAll = () => {
    if (conversionsSelectAll) {
      setConversionsSelectedUsns((prev) => {
        const next = new Set(prev);
        conversionsRowsFiltered.forEach((r) => next.delete(r.usn));
        return next;
      });
    } else {
      setConversionsSelectedUsns((prev) => {
        const next = new Set(prev);
        conversionsRowsFiltered.forEach((r) => next.add(r.usn));
        return next;
      });
    }
  };

  const toggleConversionsSelectOne = (usn) => {
    setConversionsSelectedUsns((prev) => {
      const next = new Set(prev);
      if (next.has(usn)) next.delete(usn);
      else next.add(usn);
      return next;
    });
  };

  const usnsToConvert = conversionsRowsFiltered.map((r) => r.usn).filter(Boolean);
  const rowsWithPersonalEmail = conversionsRowsFiltered.filter((r) => r.personal_email && String(r.personal_email).trim());
  const usnsWithPersonalEmail = rowsWithPersonalEmail.map((r) => r.usn);
  const usnsSelectedForConvert =
    conversionsSelectedUsns.size > 0
      ? usnsToConvert.filter((u) => conversionsSelectedUsns.has(u))
      : usnsToConvert;
  const usnsToSend = usnsSelectedForConvert.filter((u) => usnsWithPersonalEmail.includes(u));
  const hasSelectedWithoutEmail =
    usnsSelectedForConvert.length > 0 && usnsToSend.length < usnsSelectedForConvert.length;
  const showConvertButton = conversionsRows.length > 0;

  const handleConvertToAlumni = async () => {
    if (usnsToSend.length === 0) {
      toast({
        title: hasSelectedWithoutEmail ? 'Select only students with personal mail id' : 'Select students to convert',
        description: hasSelectedWithoutEmail ? 'Only students with a personal email can be converted to alumni.' : undefined,
        status: 'error',
        isClosable: true,
        duration: 5000,
      });
      return;
    }
    setConvertLoading(true);
    setConvertResult(null);
    try {
      const data = await PlacementService.convertToAlumni(usnsToSend);
      setConvertResult(data);
      if (data.converted > 0) {
        toast({ title: `${data.converted} converted to alumni`, status: 'success' });
        setConversionsSelectedUsns(new Set());
        fetchConversionsData();
      }
    } catch (e) {
      toast({ title: e.message || 'Convert failed', status: 'error' });
      setConvertResult({ total: 0, converted: 0, failed: usnsToSend.length, failed_list: [{ usn: '', error_message: e.message || 'Request failed' }] });
    } finally {
      setConvertLoading(false);
    }
  };

  const openConvertModal = () => {
    setConvertResult(null);
    if (hasSelectedWithoutEmail && usnsToSend.length === 0) {
      toast({
        title: 'Select only students with personal mail id',
        description: 'Only students with a personal email can be converted to alumni.',
        status: 'error',
        isClosable: true,
        duration: 5000,
      });
    }
    onConvertOpen();
  };
  const closeConvertModal = () => {
    setConvertResult(null);
    onConvertClose();
  };

  const displayedCount = filteredAlumni.length;
  const totalCount = alumniList.length;

  return (
    <AdminLayout fullWidth>
      <div className="alumni-portal">
        <div className="alumni-portal__inner">
          <header className="alumni-portal__hero">
            <div className="alumni-portal__hero-inner">
              <div className="alumni-portal__hero-icon" aria-hidden>
                <FaGraduationCap />
              </div>
              <div>
                <h1 className="alumni-portal__hero-title">Alumni Network</h1>
                <p className="alumni-portal__hero-subtitle">
                  Browse alumni profiles, manage registration codes, and convert graduating students.
                </p>
              </div>
            </div>
            <button type="button" className="alumni-portal__btn-add" onClick={onOpen}>
              <AddIcon boxSize={3} aria-hidden />
              Add manually
            </button>
          </header>

          <div className="alumni-portal__stats" aria-label="Summary">
            <span className="alumni-portal__stat-pill">
              <strong>{totalCount.toLocaleString()}</strong> alumni
            </span>
            {searchQuery.trim() && (
              <span className="alumni-portal__stat-pill alumni-portal__stat-pill--muted">
                <strong>{displayedCount.toLocaleString()}</strong> matching search
              </span>
            )}
          </div>

          <Tabs
            index={tabIndex}
            onChange={handleTabsChange}
            variant="unstyled"
            className="alumni-portal__tabs-wrap"
            isLazy
          >
            <TabList className="alumni-portal__tab-list">
              <Tab className="alumni-portal__tab">
                <AlumniTabLabel icon={FaGraduationCap}>Current Alumni</AlumniTabLabel>
              </Tab>
              <Tab className="alumni-portal__tab">
                <AlumniTabLabel icon={FaKey}>Manage Registrations</AlumniTabLabel>
              </Tab>
              <Tab className="alumni-portal__tab">
                <AlumniTabLabel icon={FaExchangeAlt}>Alumni Conversions</AlumniTabLabel>
              </Tab>
              <Tab className="alumni-portal__tab">
                <AlumniTabLabel icon={FaHistory}>Conversion logs</AlumniTabLabel>
              </Tab>
            </TabList>

            <TabPanels className="alumni-portal__tab-panels">
              <TabPanel p={0}>
                <div className="alumni-portal__toolbar-card">
                  <div className="alumni-portal__toolbar">
                    <div className="alumni-portal__search-wrap">
                      <SearchIcon className="alumni-portal__search-icon" aria-hidden />
                      <input
                        type="search"
                        className="alumni-portal__search-input"
                        placeholder="Search name, USN, company, role, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search alumni"
                      />
                    </div>
                    <button type="button" className="alumni-portal__btn-secondary" onClick={handleCopyEmails}>
                      <CopyIcon boxSize={3} aria-hidden />
                      Copy emails
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="alumni-portal__loading"><Spinner /></div>
                ) : filteredAlumni.length === 0 ? (
                  <div className="alumni-portal__empty">No alumni found.</div>
                ) : (
                  <div className="alumni-portal__grid">
                    {filteredAlumni.map((alum, index) => (
                      <AlumniGridCard
                        key={alum.id ?? alum.usn ?? alum.student_id ?? `alum-${index}`}
                        alum={alum}
                        onOpen={() =>
                          navigate(`/placement/alumni/${linkId(alum)}`, {
                            state: buildPlacementNavState(location),
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </TabPanel>

              <TabPanel p={0}>
                <Box className="alumni-portal__panel">
                  <AlumniRegistrationCodes />
                </Box>
              </TabPanel>

              <TabPanel p={0}>
                <Box className="alumni-portal__panel">
                <Box className="alumni-portal__filters">
                  <HStack spacing={4} flexWrap="wrap" align="end">
                    <FormControl w="200px">
                      <FormLabel fontSize="sm">School</FormLabel>
                      <Select
                        placeholder="Select school"
                        value={conversionsSchoolId}
                        onChange={(e) => {
                          setConversionsSchoolId(e.target.value);
                          setConversionsProgramId('');
                          setConversionsBatch('all');
                          setConversionsCurrentYear('all');
                          setConversionsSection('all');
                          setConversionsFilterMeta({ years: [], current_years: [], sections: [] });
                        }}
                        size="sm"
                      >
                        {(conversionsSchools || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl w="240px">
                      <FormLabel fontSize="sm">Program</FormLabel>
                      <Select
                        placeholder="Select program"
                        value={conversionsProgramId}
                        onChange={(e) => setConversionsProgramId(e.target.value)}
                        size="sm"
                      >
                        {conversionsProgramsFiltered.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size="sm"
                      className="alumni-portal__btn-primary"
                      onClick={fetchConversionsData}
                      isDisabled={!conversionsSchoolId || !conversionsProgramId}
                      isLoading={conversionsLoading}
                    >
                      Load
                    </Button>
                  </HStack>
                  {conversionsSchoolId && conversionsProgramId && (
                    <HStack spacing={4} flexWrap="wrap" align="end" mt={3}>
                      <FormControl w="140px">
                        <FormLabel fontSize="sm">Batch (joining year)</FormLabel>
                        <Select
                          size="sm"
                          value={conversionsBatch}
                          onChange={(e) => setConversionsBatch(e.target.value)}
                        >
                          <option value="all">All batches</option>
                          {(conversionsFilterMeta.years || []).map((y) => (
                            <option key={y} value={String(y)}>{y}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl w="130px">
                        <FormLabel fontSize="sm">Current year</FormLabel>
                        <Select
                          size="sm"
                          value={conversionsCurrentYear}
                          onChange={(e) => setConversionsCurrentYear(e.target.value)}
                        >
                          <option value="all">All years</option>
                          {(conversionsFilterMeta.current_years || []).map((y) => (
                            <option key={`cy-${y}`} value={String(y)}>Year {y}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl w="120px">
                        <FormLabel fontSize="sm">Section</FormLabel>
                        <Select
                          size="sm"
                          value={conversionsSection}
                          onChange={(e) => setConversionsSection(e.target.value)}
                        >
                          <option value="all">All sections</option>
                          {(conversionsFilterMeta.sections || []).map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl w="120px">
                        <FormLabel fontSize="sm">Opt in</FormLabel>
                        <Select
                          size="sm"
                          value={conversionsOptIn}
                          onChange={(e) => setConversionsOptIn(e.target.value)}
                        >
                          <option value="all">All</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </Select>
                      </FormControl>
                      <FormControl w="120px">
                        <FormLabel fontSize="sm">Placed</FormLabel>
                        <Select
                          size="sm"
                          value={conversionsIsPlaced}
                          onChange={(e) => setConversionsIsPlaced(e.target.value)}
                        >
                          <option value="all">All</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </Select>
                      </FormControl>
                      <FormControl w="220px" flex="1" minW="180px">
                        <FormLabel fontSize="sm">Search</FormLabel>
                        <Input
                          size="sm"
                          placeholder="USN, name, or email"
                          value={conversionsSearch}
                          onChange={(e) => setConversionsSearch(e.target.value)}
                        />
                      </FormControl>
                      <FormControl display="flex" alignItems="center" w="auto" pb={1}>
                        <FormLabel fontSize="sm" mb={0} whiteSpace="nowrap">Personal email only</FormLabel>
                        <Switch
                          size="sm"
                          ml={2}
                          isChecked={conversionsFilterPersonalEmail}
                          onChange={(e) => setConversionsFilterPersonalEmail(e.target.checked)}
                        />
                      </FormControl>
                    </HStack>
                  )}
                </Box>
                {conversionsLoading ? (
                  <div className="alumni-portal__loading"><Spinner /></div>
                ) : (
                  <TableContainer className="alumni-portal__table-wrap" overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th px={2} w="40px">
                            <Checkbox
                              isChecked={conversionsSelectAll}
                              isIndeterminate={conversionsSelectSome && !conversionsSelectAll}
                              onChange={toggleConversionsSelectAll}
                              aria-label="Select all"
                            />
                          </Th>
                          <Th>USN</Th>
                          <Th>Name</Th>
                          <Th>RVU mail id</Th>
                          <Th>Personal mail id</Th>
                          <Th>Program</Th>
                          <Th>Batch</Th>
                          <Th>Current year</Th>
                          <Th>Section</Th>
                          <Th>Program year</Th>
                          <Th>Opt in</Th>
                          <Th>Is placed</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {conversionsRowsFiltered.map((row) => (
                          <Tr key={row.usn}>
                            <Td px={2}>
                              <Checkbox
                                isChecked={conversionsSelectedUsns.has(row.usn)}
                                onChange={() => toggleConversionsSelectOne(row.usn)}
                                aria-label={`Select ${row.usn}`}
                              />
                            </Td>
                            <Td fontFamily="mono" fontSize="xs">{row.usn || '—'}</Td>
                            <Td fontWeight="medium">{row.full_name || '—'}</Td>
                            <Td fontSize="sm">{row.college_email || '—'}</Td>
                            <Td fontSize="sm">{row.personal_email || '—'}</Td>
                            <Td fontSize="sm">{row.program || '—'}</Td>
                            <Td>{row.year_of_joining ?? '—'}</Td>
                            <Td>{row.current_year ?? '—'}</Td>
                            <Td>{row.section || '—'}</Td>
                            <Td fontSize="sm">[{row.course_year_min ?? 0}-{row.course_year_max ?? 0}]</Td>
                            <Td>
                              <Badge colorScheme={row.opt_in ? 'green' : 'gray'} size="sm">{row.opt_in ? 'Yes' : 'No'}</Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={row.is_placed ? 'green' : 'gray'} size="sm">{row.is_placed ? 'Yes' : 'No'}</Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
                {!conversionsLoading && conversionsSchoolId && conversionsProgramId && conversionsRows.length === 0 && (
                  <Text color="gray.500" py={4}>No students match the selected filters.</Text>
                )}
                {!conversionsLoading && conversionsRows.length === 0 && !conversionsSchoolId && (
                  <Text color="gray.500" py={4}>Select a school and program to view students.</Text>
                )}
                {showConvertButton && (
                  <Flex mt={4} justify="flex-end">
                    <Button size="md" className="alumni-portal__btn-green" onClick={openConvertModal}>
                      Convert to Alumni
                    </Button>
                  </Flex>
                )}
                </Box>
              </TabPanel>

              <TabPanel p={0}>
                <Box className="alumni-portal__panel">
                  <p className="alumni-portal__panel-intro">
                    Bulk conversion runs are stored in <strong>alumni_conversion_log</strong>. Click a batch to see each student.
                    Use <strong>Revert bulk</strong> to undo successful conversions; every row stays in the log with status <strong>reverted</strong> so you can always see who was rolled back.
                  </p>
                {conversionLogsLoading ? (
                  <div className="alumni-portal__loading"><Spinner /></div>
                ) : conversionBatches.length === 0 ? (
                  <div className="alumni-portal__empty">No conversion logs yet.</div>
                ) : (
                  <div className="alumni-portal__log-batches">
                    {conversionBatches.map((batch) => {
                      const isExpanded = expandedBatchId === batch.batch_id;
                      const studentLabel =
                        batch.total === 1 ? '1 student' : `${batch.total} students`;
                      const fullyReverted = isConversionBatchFullyReverted(batch);
                      const showRevert = canRevertConversionBatch(batch);
                      return (
                        <div
                          key={batch.batch_id}
                          className={`alumni-portal__log-batch${isExpanded ? ' alumni-portal__log-batch--expanded' : ''}${fullyReverted ? ' alumni-portal__log-batch--reverted' : ''}`}
                        >
                          <div className="alumni-portal__log-batch-head-row">
                          <button
                            type="button"
                            className="alumni-portal__log-batch-head"
                            onClick={() => toggleConversionBatch(batch.batch_id)}
                            aria-expanded={isExpanded}
                          >
                            <span className="alumni-portal__log-batch-main">
                              <span className="alumni-portal__log-batch-title">
                                {fullyReverted ? 'Bulk conversion (reverted)' : 'Bulk conversion'} · {studentLabel}
                              </span>
                              <span className="alumni-portal__log-batch-meta">
                                <time className="alumni-portal__log-batch-date" dateTime={batch.created_at || undefined}>
                                  {formatConversionBatchWhen(batch.created_at)}
                                </time>
                                <span className="alumni-portal__log-batch-meta-sep" aria-hidden>·</span>
                                <span className="alumni-portal__log-batch-id" title={batch.batch_id}>
                                  Batch {shortBatchId(batch.batch_id)}
                                </span>
                              </span>
                            </span>
                            <HStack spacing={2} className="alumni-portal__log-batch-stats" flexShrink={0}>
                              {batch.success > 0 && (
                                <Badge colorScheme="green" size="sm">
                                  {batch.success} {batch.success === 1 ? 'alumni' : 'alumnis'}
                                </Badge>
                              )}
                              {batch.failed > 0 && (
                                <Badge colorScheme="red" size="sm">{batch.failed} failed</Badge>
                              )}
                              {batch.pending > 0 && (
                                <Badge colorScheme="yellow" size="sm">{batch.pending} pending</Badge>
                              )}
                              {batch.reverted > 0 && (
                                <Badge colorScheme="purple" size="sm">{batch.reverted} reverted</Badge>
                              )}
                            </HStack>
                            <Icon
                              as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                              boxSize={5}
                              color="gray.500"
                              aria-hidden
                            />
                          </button>
                          {showRevert && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              colorScheme="purple"
                              bg="transparent"
                              _hover={{ bg: 'rgba(128, 90, 213, 0.1)' }}
                              leftIcon={<Icon as={FaUndo} />}
                              className="alumni-portal__log-batch-revert"
                              onClick={(e) => openRevertBatchModal(batch, e)}
                            >
                              Revert bulk
                            </Button>
                          )}
                          </div>
                          {isExpanded && (
                            <div className="alumni-portal__log-batch-detail">
                              <TableContainer className="alumni-portal__table-wrap alumni-portal__log-table-wrap" overflowX="auto">
                                <Table variant="simple" size="sm" className="alumni-portal__log-table">
                                  <Thead>
                                    <Tr>
                                      <Th className="alumni-portal__log-th--num">#</Th>
                                      <Th>Student</Th>
                                      <Th>USN</Th>
                                      <Th>RVU email</Th>
                                      <Th>Personal email</Th>
                                      <Th className="alumni-portal__log-th--center">Migrated</Th>
                                      <Th className="alumni-portal__log-th--center">Role</Th>
                                      <Th className="alumni-portal__log-th--center">Gmail</Th>
                                      <Th className="alumni-portal__log-th--center">Status</Th>
                                      <Th>Notes</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {(batch.logs || []).map((log, i) => {
                                      const migrated = log.status === 'success';
                                      const wasReverted = log.status === 'reverted';
                                      const failed = log.status === 'failed';
                                      return (
                                        <Tr
                                          key={log.id}
                                          className={
                                            wasReverted
                                              ? 'alumni-portal__log-row--reverted'
                                              : failed
                                                ? 'alumni-portal__log-row--failed'
                                                : undefined
                                          }
                                        >
                                          <Td className="alumni-portal__log-td--num">{i + 1}</Td>
                                          <Td className="alumni-portal__log-td--name">{log.student_name || '—'}</Td>
                                          <Td>
                                            <span className="alumni-portal__log-usn">{log.usn || '—'}</span>
                                          </Td>
                                          <Td className="alumni-portal__log-td--email" title={log.rvu_email || undefined}>
                                            {log.rvu_email || '—'}
                                          </Td>
                                          <Td className="alumni-portal__log-td--email" title={log.personal_email || undefined}>
                                            {log.personal_email || '—'}
                                          </Td>
                                          <Td className="alumni-portal__log-td--center">
                                            <Badge
                                              colorScheme={wasReverted ? 'purple' : migrated ? 'green' : 'red'}
                                              variant={migrated || wasReverted ? 'solid' : 'subtle'}
                                              size="sm"
                                              className="alumni-portal__log-badge"
                                            >
                                              {wasReverted ? 'Reverted' : migrated ? 'Yes' : 'No'}
                                            </Badge>
                                          </Td>
                                          <Td className="alumni-portal__log-td--center alumni-portal__log-td--flag">
                                            {log.role_converted && !wasReverted ? 'Yes' : wasReverted ? 'Undone' : 'No'}
                                          </Td>
                                          <Td className="alumni-portal__log-td--center alumni-portal__log-td--flag">
                                            {log.personal_mail_row_created && !wasReverted ? 'Yes' : wasReverted ? 'Removed' : 'No'}
                                          </Td>
                                          <Td className="alumni-portal__log-td--center">
                                            <Badge
                                              colorScheme={logStatusColorScheme(log.status)}
                                              size="sm"
                                              className="alumni-portal__log-badge alumni-portal__log-badge--status"
                                            >
                                              {log.status}
                                            </Badge>
                                          </Td>
                                          <Td className="alumni-portal__log-td--notes" title={log.error_message || undefined}>
                                            {log.error_message || '—'}
                                          </Td>
                                        </Tr>
                                      );
                                    })}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent className="alumni-portal__modal-content">
              <ModalHeader>Add new alumni (manual)</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Box as="form" id="add-alumni-form">
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel>USN</FormLabel>
                      <Input name="usn" value={newAlumni.usn} onChange={handleInputChange} placeholder="1RVU..." />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Full name</FormLabel>
                      <Input name="full_name" value={newAlumni.full_name} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mb={4}>
                    <FormLabel>Graduation year</FormLabel>
                    <Input name="graduation_year" type="number" value={newAlumni.graduation_year} onChange={handleInputChange} placeholder="e.g. 2024" />
                  </FormControl>
                  <FormControl mb={4}>
                    <FormLabel>Institution name</FormLabel>
                    <Input name="institution_name" value={newAlumni.institution_name} onChange={handleInputChange} placeholder="e.g. RV University" />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel>Current company</FormLabel>
                      <Input name="current_company" value={newAlumni.current_company} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Designation</FormLabel>
                      <Input name="current_designation" value={newAlumni.current_designation} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mb={4}>
                    <FormLabel>Work location</FormLabel>
                    <Input name="current_work_location" value={newAlumni.current_work_location} onChange={handleInputChange} />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel>Personal email</FormLabel>
                      <Input name="personal_email" type="email" value={newAlumni.personal_email} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Phone number</FormLabel>
                      <Input name="phone_number" value={newAlumni.phone_number} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mb={4}>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <Input name="linkedin" value={newAlumni.linkedin} onChange={handleInputChange} placeholder="https://..." />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Other links</FormLabel>
                    <Input name="other_links" value={newAlumni.other_links} onChange={handleInputChange} placeholder="Portfolio, etc." />
                  </FormControl>
                </Box>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                <Button colorScheme="green" bg="#22c35e" onClick={handleAddAlumni}>Save alumni</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isConvertOpen} onClose={closeConvertModal} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent className="alumni-portal__modal-content">
              <ModalHeader>Convert to Alumni</ModalHeader>
              <ModalCloseButton isDisabled={convertLoading} />
              <ModalBody>
                {!convertResult ? (
                  <>
                    <Text mb={4}>
                      {usnsToSend.length === 0
                        ? (hasSelectedWithoutEmail ? 'Select only students with personal mail id. Only students with a personal email can be converted to alumni.' : 'Select students to convert.')
                        : `Convert ${usnsToSend.length} student(s) to alumni? Their RVU login will become alumni, an alumni profile will be created, and a separate login will be added for their personal Gmail (same password as their college account). Failed conversions are reverted automatically.`}
                    </Text>
                    {convertLoading && (
                      <Flex align="center" gap={3} py={2}>
                        <Spinner size="sm" />
                        <Text>Converting…</Text>
                      </Flex>
                    )}
                  </>
                ) : (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Conversion complete: {convertResult.success_rate_pct ?? 0}% success
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      {convertResult.converted} converted, {convertResult.failed} failed (reverted to student).
                    </Text>
                    {convertResult.failed_list && convertResult.failed_list.length > 0 && (
                      <Box mt={3}>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>Failed (reverted to student):</Text>
                        <Box as="ul" pl={4} fontSize="sm" maxH="200px" overflowY="auto">
                          {convertResult.failed_list.map((f, i) => (
                            <Box as="li" key={i} mb={1}>
                              <Badge fontFamily="mono" mr={2}>{f.usn}</Badge>
                              {f.error_message}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </ModalBody>
              <ModalFooter>
                {!convertResult ? (
                  <>
                    <Button variant="ghost" onClick={closeConvertModal} isDisabled={convertLoading}>Cancel</Button>
                    <Button colorScheme="green" onClick={handleConvertToAlumni} isLoading={convertLoading} isDisabled={usnsToSend.length === 0}>
                      Convert
                    </Button>
                  </>
                ) : (
                  <Button onClick={closeConvertModal}>Close</Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={isRevertOpen}
            onClose={() => {
              if (!revertLoading) {
                onRevertClose();
                setRevertBatchTarget(null);
              }
            }}
            size="md"
            isCentered
          >
            <ModalOverlay />
            <ModalContent className="alumni-portal__modal-content">
              <ModalHeader>Revert bulk conversion?</ModalHeader>
              <ModalCloseButton isDisabled={revertLoading} />
              <ModalBody>
                {revertBatchTarget && (
                  <Box>
                    <Text mb={3}>
                      This will undo every <strong>successful</strong> conversion in this batch (
                      {revertBatchTarget.success} student
                      {revertBatchTarget.success === 1 ? '' : 's'}
                      ): RVU login back to student, alumni profile removed, personal Gmail login removed.
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      All rows stay in <strong>alumni_conversion_log</strong> with status <Badge colorScheme="purple" size="sm">reverted</Badge> so you can still expand this batch and see who was rolled back.
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontFamily="mono">
                      Batch {shortBatchId(revertBatchTarget.batch_id)}
                    </Text>
                  </Box>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onRevertClose();
                    setRevertBatchTarget(null);
                  }}
                  isDisabled={revertLoading}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="purple"
                  leftIcon={<Icon as={FaUndo} />}
                  onClick={handleRevertBatchConfirm}
                  isLoading={revertLoading}
                >
                  Revert bulk
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AlumniList;
