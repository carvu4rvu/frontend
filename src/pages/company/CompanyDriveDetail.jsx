import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { ArrowBackIcon, SearchIcon } from '@chakra-ui/icons';
import { MdAssignment, MdCardGiftcard, MdSave, MdWarning } from 'react-icons/md';
import '../admin/DriveProcess.css';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';

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

function isRoundPassed(process, field) {
  if (!field) return true;
  if (field === 'approved_status') return process[field] === 'Qualified';
  return process[field] === true;
}

/** Company has view-only access to the process table; no editing status, remarks, or creating offers from here. */
const COMPANY_VIEW_ONLY = true;

const CompanyDriveDetail = () => {
  const { id: driveId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [drive, setDrive] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [editedProcesses, setEditedProcesses] = useState({});
  const [savingProcesses, setSavingProcesses] = useState(false);
  const [currentActiveRoundIndex, setCurrentActiveRoundIndex] = useState(-2);
  const [selectedForOffers, setSelectedForOffers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const processRounds = Array.isArray(drive?.process_rounds)
    ? drive.process_rounds
        .filter((r) => {
          const s = String(r || '').trim();
          return s !== '' && !/^aptitude$/i.test(s);
        })
        .filter((r) => getRoundField(r) != null)
    : [];
  const roundFields = processRounds.map((r) => getRoundField(r));

  const isRegistered = (p) => String(p.registration_status || '').toLowerCase() === 'registered';

  const fetchDriveAndProcesses = async () => {
    try {
      if (!drive) setLoading(true);
      const driveData = await CompanyService.getDriveById(driveId);
      setDrive(driveData);
      if (driveData) {
        setLoadingProcesses(true);
        const candidates = await CompanyService.getDriveCandidates(driveId);
        const mapped = (candidates || []).map((c) => ({
          ...c,
          student_name: c.student_basic_details?.full_name || c.student_name || '—',
          school: c.school || '—',
        }));
        setProcesses(mapped);
      }
    } catch (error) {
      toast({
        title: 'Error loading drive process',
        description: error?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setLoadingProcesses(false);
      setEditedProcesses({});
    }
  };

  useEffect(() => {
    if (driveId) fetchDriveAndProcesses();
  }, [driveId]);

  const getFilteredProcesses = () => {
    let result = processes;
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
    } else if (currentActiveRoundIndex >= 0 && currentActiveRoundIndex < roundFields.length) {
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.usn || '').toLowerCase().includes(q) ||
          (p.student_name || '').toLowerCase().includes(q)
      );
    }
    if (currentActiveRoundIndex === -1 && statusFilter) {
      result = result.filter((p) => {
        if (statusFilter === 'malpractice') return p.malpractice === true;
        if (statusFilter === 'selected') return p.final_select_status === true;
        if (statusFilter === 'pending')
          return roundFields.some((field) => field && (p[field] == null || p[field] === undefined));
        if (statusFilter === 'rejected')
          return roundFields.some((field) => field && p[field] === false);
        return true;
      });
    }
    return result;
  };

  const filteredProcesses = getFilteredProcesses();

  const handleProcessFieldChange = (processId, field, value) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, [field]: value } : p))
    );
    setEditedProcesses((prev) => ({
      ...prev,
      [processId]: { ...(prev[processId] || {}), [field]: value },
    }));
  };

  const cycleCellValue = (processId, field) => {
    const process = processes.find((p) => p.id === processId);
    if (!process) return;
    if (field === 'malpractice') {
      handleProcessFieldChange(processId, field, !process.malpractice);
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
      const next = current === null || current === undefined ? true : current === true ? false : null;
      handleProcessFieldChange(processId, field, next);
      return;
    }
    if (field === 'approved_status') {
      const options = ['skipped', 'Pending', 'Qualified', 'Not Qualified'];
      const currentValue = process[field] || options[0];
      const index = options.indexOf(currentValue);
      const nextIndex = index === -1 || index === options.length - 1 ? 0 : index + 1;
      handleProcessFieldChange(processId, field, options[nextIndex]);
    }
  };

  const setStatus = (processId, status) => {
    const process = processes.find((p) => p.id === processId);
    if (!process) return;
    const field =
      currentActiveRoundIndex === -3
        ? 'approved_status'
        : currentActiveRoundIndex >= 0 && roundFields[currentActiveRoundIndex]
        ? roundFields[currentActiveRoundIndex]
        : null;
    if (!field || field === 'registration_status') return;
    if (field === 'approved_status') {
      const newValue = status === true ? 'Qualified' : status === false ? 'Not Qualified' : 'Pending';
      handleProcessFieldChange(processId, field, newValue);
      if (status === false) {
        for (let i = currentActiveRoundIndex + 1; i < roundFields.length; i++) {
          const laterField = roundFields[i];
          if (laterField && laterField !== 'approved_status')
            handleProcessFieldChange(processId, laterField, null);
        }
      }
      return;
    }
    const current = process[field];
    if (current === status) {
      handleProcessFieldChange(processId, field, null);
    } else {
      handleProcessFieldChange(processId, field, status);
      if (status === false) {
        for (let i = currentActiveRoundIndex + 1; i < roundFields.length; i++) {
          const laterField = roundFields[i];
          if (laterField) handleProcessFieldChange(processId, laterField, null);
        }
      }
    }
  };

  const formatRoundStatusPill = (value, field) => {
    if (field === 'registration_status') {
      const v = String(value || '').toLowerCase();
      const statusClass =
        v === 'registered' ? 'status-pass' : v === 'not registered' ? 'status-fail' : 'status-pending';
      const statusText =
        v === 'registered' ? 'REGISTERED' : v === 'not registered' ? 'NOT REGISTERED' : 'PENDING';
      return <span className={`status-pill ${statusClass}`}>{statusText}</span>;
    }
    if (field === 'approved_status') {
      const statusClass =
        value === 'Qualified' ? 'status-pass' : value === 'Not Qualified' ? 'status-fail' : 'status-pending';
      const statusText =
        value === 'Qualified' ? 'QUALIFIED' : value === 'Not Qualified' ? 'NOT QUALIFIED' : 'PENDING';
      return <span className={`status-pill ${statusClass}`}>{statusText}</span>;
    }
    const statusClass =
      value === true ? 'status-pass' : value === false ? 'status-fail' : 'status-pending';
    const statusText = value === true ? 'PASSED' : value === false ? 'FAILED' : 'PENDING';
    return <span className={`status-pill ${statusClass}`}>{statusText}</span>;
  };

  const handleSaveProcessChanges = async () => {
    const entries = Object.entries(editedProcesses);
    if (!entries.length) {
      toast({ title: 'No changes to save', status: 'info' });
      return;
    }
    try {
      setSavingProcesses(true);
      for (const [processId, changes] of entries) {
        const p = processes.find((pr) => String(pr.id) === String(processId));
        if (p && p.usn) await CompanyService.updateCandidateStatus(driveId, p.usn, changes);
      }
      toast({ title: 'Process updates saved', status: 'success' });
      setEditedProcesses({});
      await fetchDriveAndProcesses();
    } catch (error) {
      toast({ title: 'Error saving process updates', status: 'error' });
    } finally {
      setSavingProcesses(false);
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        <Flex justify="center" align="center" h="calc(100vh - 100px)">
          <Spinner size="xl" />
        </Flex>
      </CompanyLayout>
    );
  }

  if (!drive) {
    return (
      <CompanyLayout>
        <Box p={5}>
          <Text>Drive not found.</Text>
          <Button mt={4} onClick={() => navigate('/company/drives')}>
            Back to Drives
          </Button>
        </Box>
      </CompanyLayout>
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
  const canSetSelectionStatus = !COMPANY_VIEW_ONLY && isOngoing;
  const displayCount = isRegisteredTab
    ? filteredProcesses.filter(isRegistered).length
    : filteredProcesses.length;
  const currentSingleRoundField = isRegisteredTab
    ? 'registration_status'
    : isApprovedTab
    ? 'approved_status'
    : isRoundTab && roundFields[currentActiveRoundIndex]
    ? roundFields[currentActiveRoundIndex]
    : null;
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

  const totalStudents = processes.length;
  const approvedCount = processes.filter((p) => p.approved_status === 'Qualified').length;
  const malpracticeCount = processes.filter((p) => p.malpractice === true).length;
  const selectedCount = processes.filter((p) => p.final_select_status === true).length;

  return (
    <CompanyLayout>
      <Box className="drive-process-page" bg="#f0f0f0" color="gray.800" minH="100vh" py={0}>
        <Container maxW="100%" py={4} px={6}>
          <VStack align="stretch" spacing={4}>
            <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/company/drives')}
                >
                  Back to Drives
                </Button>
              </HStack>
              {drive?.placement_status && (
                <Badge
                  colorScheme={
                    String(drive.placement_status).toLowerCase() === 'scheduled' ||
                    String(drive.placement_status).toLowerCase() === 'open'
                      ? 'blue'
                      : String(drive.placement_status).toLowerCase() === 'ongoing'
                      ? 'green'
                      : String(drive.placement_status).toLowerCase() === 'completed' ||
                        String(drive.placement_status).toLowerCase() === 'closed'
                      ? 'gray'
                      : String(drive.placement_status).toLowerCase() === 'cancelled' ||
                        String(drive.placement_status).toLowerCase() === 'failed'
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
            </Flex>

            {/* Drive Details Card - same as admin process */}
            <Box
              className="drive-info-card drive-details-row"
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="sm"
              overflow="hidden"
            >
              <Flex px={5} py={4} align="center" justify="space-between" flexWrap="wrap" gap={4}>
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
                      {(drive.company_name || drive.job_description || 'C').charAt(0).toUpperCase()}
                    </Box>
                    <Flex flexDirection="column">
                      <Text className="company-name" fontSize="0.95rem" fontWeight="bold" color="gray.900" lineHeight="1.3">
                        {drive.company_name || drive.job_description || '—'}
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
                    <Badge colorScheme="gray" fontSize="xs">{drive.placement_status || 'Pending'}</Badge>
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

            {/* Round tabs */}
            <Box className="round-tabs-container" bg="white" p={2} borderRadius="xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
              <Flex flexWrap="wrap" align="center" gap={2} overflowX="auto" className="custom-scrollbar">
                <Button
                  className={`round-tab ${currentActiveRoundIndex === -2 ? 'active' : ''}`}
                  size="sm"
                  variant="ghost"
                  fontWeight="semibold"
                  color={currentActiveRoundIndex === -2 ? 'blue.700' : 'gray.500'}
                  bg={currentActiveRoundIndex === -2 ? 'blue.50' : 'transparent'}
                  borderWidth={currentActiveRoundIndex === -2 ? '1px' : 0}
                  borderColor={currentActiveRoundIndex === -2 ? 'blue.200' : 'transparent'}
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => setCurrentActiveRoundIndex(-2)}
                >
                  Registered
                </Button>
                <Button
                  className={`round-tab ${currentActiveRoundIndex === -3 ? 'active' : ''}`}
                  size="sm"
                  variant="ghost"
                  fontWeight="semibold"
                  color={currentActiveRoundIndex === -3 ? 'blue.700' : 'gray.500'}
                  bg={currentActiveRoundIndex === -3 ? 'blue.50' : 'transparent'}
                  borderWidth={currentActiveRoundIndex === -3 ? '1px' : 0}
                  borderColor={currentActiveRoundIndex === -3 ? 'blue.200' : 'transparent'}
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => setCurrentActiveRoundIndex(-3)}
                >
                  Approved
                </Button>
                {processRounds.map((round, index) => (
                  <Button
                    key={`${round}-${index}`}
                    className={`round-tab ${currentActiveRoundIndex === index ? 'active' : ''}`}
                    size="sm"
                    variant="ghost"
                    fontWeight="semibold"
                    color={currentActiveRoundIndex === index ? 'blue.700' : 'gray.500'}
                    bg={currentActiveRoundIndex === index ? 'blue.50' : 'transparent'}
                    borderWidth={currentActiveRoundIndex === index ? '1px' : 0}
                    borderColor={currentActiveRoundIndex === index ? 'blue.200' : 'transparent'}
                    _hover={{ bg: 'gray.100' }}
                    leftIcon={
                      <Box
                        as="span"
                        w={5}
                        h={5}
                        borderRadius="full"
                        bg={currentActiveRoundIndex === index ? 'blue.600' : 'gray.200'}
                        color={currentActiveRoundIndex === index ? 'white' : 'gray.600'}
                        fontSize="10px"
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {index + 1}
                      </Box>
                    }
                    onClick={() => setCurrentActiveRoundIndex(index)}
                  >
                    {round}
                  </Button>
                ))}
                <Box w="1px" h={6} bg="gray.200" mx={1} />
                <Button
                  className={`round-tab ${currentActiveRoundIndex === -1 ? 'active' : ''}`}
                  size="sm"
                  variant="ghost"
                  fontWeight="semibold"
                  color={currentActiveRoundIndex === -1 ? 'blue.700' : 'gray.500'}
                  bg={currentActiveRoundIndex === -1 ? 'blue.50' : 'transparent'}
                  borderWidth={currentActiveRoundIndex === -1 ? '1px' : 0}
                  borderColor={currentActiveRoundIndex === -1 ? 'blue.200' : 'transparent'}
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => setCurrentActiveRoundIndex(-1)}
                >
                  All Rounds View
                </Button>
                {(isOngoing || isCompleted) && (
                  <>
                    <Box w="1px" h={6} bg="gray.200" mx={1} />
                    <Button
                      className={`round-tab ${isJobOffersTab ? 'active' : ''}`}
                      size="sm"
                      variant="ghost"
                      fontWeight="semibold"
                      color={isJobOffersTab ? 'green.700' : 'gray.500'}
                      bg={isJobOffersTab ? 'green.50' : 'transparent'}
                      borderWidth={isJobOffersTab ? '1px' : 0}
                      borderColor={isJobOffersTab ? 'green.200' : 'transparent'}
                      _hover={{ bg: 'green.50' }}
                      leftIcon={<Icon as={MdCardGiftcard} />}
                      onClick={() => {
                        setCurrentActiveRoundIndex(-4);
                        setSelectedForOffers([]);
                      }}
                    >
                      Job Offers
                    </Button>
                  </>
                )}
              </Flex>
            </Box>

            {/* Filters bar */}
            <Flex className="filters-bar" bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" p={3} shadow="sm" flexWrap="wrap" align="center" gap={3}>
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
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  {currentRoundTitle}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {displayCount} of {processes.length} students
                </Text>
                {!COMPANY_VIEW_ONLY && (isJobOffersTab ? (
                  <Button
                    colorScheme="green"
                    leftIcon={<Icon as={MdCardGiftcard} />}
                    size="sm"
                    fontWeight="bold"
                    isDisabled={selectedForOffers.length === 0}
                    onClick={() => {
                      const prefillData = {
                        placement_drive_id: String(drive.id),
                        company_id: drive.company_id,
                        job_type: (drive.job_type || '').toLowerCase(),
                      };
                      const selectedStudents = processes
                        .filter((p) => selectedForOffers.includes(p.usn))
                        .map((p) => ({ usn: p.usn, name: p.student_name, student_name: p.student_name, school: p.school }));
                      navigate('/company/offers', { state: { prefillData, selectedStudents } });
                    }}
                  >
                    Add Job Offers ({selectedForOffers.length})
                  </Button>
                ) : (
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
                ))}
                {COMPANY_VIEW_ONLY && (
                  <Badge colorScheme="gray" fontSize="xs" px={2} py={1}>View only</Badge>
                )}
              </HStack>
            </Flex>

            {/* Table */}
            <Box className="process-table-wrap" bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden" flex="1">
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
                            {!COMPANY_VIEW_ONLY && (
                              <Th className="table-header" px={2} py={3} w="40px">
                                <Checkbox
                                  isChecked={selectedForOffers.length === filteredProcesses.length && filteredProcesses.length > 0}
                                  isIndeterminate={selectedForOffers.length > 0 && selectedForOffers.length < filteredProcesses.length}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedForOffers(filteredProcesses.map((p) => p.usn));
                                    else setSelectedForOffers([]);
                                  }}
                                  colorScheme="green"
                                />
                              </Th>
                            )}
                            <Th className="table-header" px={4} py={3} minW="180px">USN / Name</Th>
                            <Th className="table-header" px={3} py={3} minW="120px">School</Th>
                            <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">Final Status</Th>
                            <Th className="table-header" px={4} py={3} minW="180px">Remarks</Th>
                          </>
                        ) : isAllRoundsView ? (
                          <>
                            <Th className="table-header" px={4} py={3} minW="180px">USN / Name</Th>
                            <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">Registered</Th>
                            <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">Approved</Th>
                            {processRounds.map((r) => (
                              <Th key={r} className="table-header" px={3} py={3} textAlign="center" minW="100px">{r}</Th>
                            ))}
                            <Th className="table-header" px={3} py={3} textAlign="center" minW="100px">
                              <HStack spacing={1} justify="center">
                                <Icon as={MdWarning} color="orange.500" />
                                <Text>Malpractice</Text>
                              </HStack>
                            </Th>
                            <Th className="table-header" px={4} py={3} minW="180px">Remarks</Th>
                          </>
                        ) : (
                          <>
                            <Th className="table-header" px={4} py={3} minW="180px">USN & Name</Th>
                            <Th className="table-header" px={4} py={3} textAlign="center" minW="160px">
                              {isRegisteredTab ? 'Registration Status' : 'Set Selection Status'}
                            </Th>
                            <Th className="table-header" px={4} py={3} minW="120px">Previous Stages</Th>
                            <Th className="table-header" px={4} py={3} minW="180px">Remarks</Th>
                          </>
                        )}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredProcesses.length === 0 ? (
                        <Tr>
                          <Td
                            colSpan={isJobOffersTab ? (COMPANY_VIEW_ONLY ? 4 : 5) : isAllRoundsView ? processRounds.length + 5 : 4}
                            textAlign="center"
                            py={10}
                            color="gray.500"
                          >
                            <VStack>
                              <Icon as={MdAssignment} boxSize={8} opacity={0.3} />
                              <Text>
                                {isJobOffersTab
                                  ? 'No students have passed all rounds yet.'
                                  : searchQuery || statusFilter
                                  ? 'No students match your search.'
                                  : 'No student processes for this drive.'}
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
                                {!COMPANY_VIEW_ONLY && (
                                  <Td px={2} py={3}>
                                    <Checkbox
                                      isChecked={selectedForOffers.includes(process.usn)}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedForOffers((prev) => [...prev, process.usn]);
                                        else setSelectedForOffers((prev) => prev.filter((u) => u !== process.usn));
                                      }}
                                      colorScheme="green"
                                    />
                                  </Td>
                                )}
                                <Td px={4} py={3} whiteSpace="nowrap" cursor="pointer" _hover={{ textDecoration: 'underline' }} onClick={() => process.usn && navigate(`/company/student/${process.usn}`)}>
                                  <Box fontSize="sm" fontWeight="bold" color="blue.600">{process.usn}</Box>
                                  <Box fontSize="xs" color="gray.500">{process.student_name || '-'}</Box>
                                </Td>
                                <Td px={3} py={3} fontSize="sm" color="gray.600">{process.school || '-'}</Td>
                                <Td px={3} py={3} textAlign="center">
                                  <Badge colorScheme="green" px={2} py={1} borderRadius="full">SELECTED</Badge>
                                </Td>
                                <Td px={4} py={3} fontSize="sm" color="gray.600" maxW="200px" isTruncated>{process.remarks || '-'}</Td>
                              </>
                            ) : isAllRoundsView ? (
                              <>
                                <Td px={4} py={3} whiteSpace="nowrap" cursor="pointer" _hover={{ textDecoration: 'underline' }} onClick={() => process.usn && navigate(`/company/student/${process.usn}`)}>
                                  <Box fontSize="sm" fontWeight="bold" color="blue.600">{process.usn}</Box>
                                  <Box fontSize="xs" color="gray.500">{process.student_name || '-'}</Box>
                                </Td>
                                <Td px={3} py={3} textAlign="center">{formatRoundStatusPill(process.registration_status, 'registration_status')}</Td>
                                <Td px={3} py={3} textAlign="center" cursor={canSetSelectionStatus ? 'pointer' : 'default'} onClick={() => canSetSelectionStatus && cycleCellValue(process.id, 'approved_status')}>
                                  {formatRoundStatusPill(process.approved_status, 'approved_status')}
                                </Td>
                                {roundFields.map((field, i) => (
                                  <Td key={processRounds[i]} px={3} py={3} textAlign="center" cursor={canSetSelectionStatus ? 'pointer' : 'default'} onClick={() => canSetSelectionStatus && field && cycleCellValue(process.id, field)}>
                                    {formatRoundStatusPill(field ? process[field] : null, field)}
                                  </Td>
                                ))}
                                <Td px={3} py={3} textAlign="center">
                                  {COMPANY_VIEW_ONLY ? (
                                    <span className={`status-pill ${process.malpractice ? 'status-fail' : 'status-pass'}`}>
                                      {process.malpractice ? 'YES' : 'NO'}
                                    </span>
                                  ) : (
                                    <Checkbox
                                      isChecked={process.malpractice === true}
                                      onChange={(e) => handleProcessFieldChange(process.id, 'malpractice', e.target.checked)}
                                      colorScheme="red"
                                      size="lg"
                                    />
                                  )}
                                </Td>
                                <Td px={4} py={3}>
                                  {COMPANY_VIEW_ONLY ? (
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>{process.remarks || '—'}</Text>
                                  ) : (
                                    <Input
                                      size="sm"
                                      bg="gray.50"
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor="gray.200"
                                      _focus={{ borderColor: 'blue.300', boxShadow: '0 0 0 1px var(--chakra-colors-blue-300)' }}
                                      placeholder="Remarks..."
                                      value={process.remarks || ''}
                                      onChange={(e) => handleProcessFieldChange(process.id, 'remarks', e.target.value)}
                                    />
                                  )}
                                </Td>
                              </>
                            ) : (
                              <>
                                <Td px={4} py={3} whiteSpace="nowrap" cursor="pointer" _hover={{ textDecoration: 'underline' }} onClick={() => process.usn && navigate(`/company/student/${process.usn}`)}>
                                  <Box fontSize="sm" fontWeight="bold" color="blue.600">{process.usn}</Box>
                                  <Box fontSize="xs" color="gray.500">{process.student_name || '-'}</Box>
                                </Td>
                                <Td px={4} py={3}>
                                  {currentSingleRoundField ? (
                                    <Flex justify="center" align="center" gap={2}>
                                      {currentSingleRoundField === 'registration_status' ? (
                                        <Box>{formatRoundStatusPill(process.registration_status, 'registration_status')}</Box>
                                      ) : !canSetSelectionStatus ? (
                                        <Box>
                                          {formatRoundStatusPill(
                                            currentSingleRoundField === 'approved_status' ? process.approved_status : process[currentSingleRoundField],
                                            currentSingleRoundField
                                          )}
                                        </Box>
                                      ) : currentSingleRoundField === 'approved_status' ? (
                                        <>
                                          <Button className="status-btn pass" w={10} h={10} borderRadius="full" borderWidth="2px" borderColor={process.approved_status === 'Qualified' ? 'green.600' : 'gray.200'} bg={process.approved_status === 'Qualified' ? 'green.500' : 'transparent'} color={process.approved_status === 'Qualified' ? 'white' : 'gray.400'} _hover={{ borderColor: 'green.400' }} onClick={() => setStatus(process.id, true)} p={0}>
                                            <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></Icon>
                                          </Button>
                                          <Button className="status-btn fail" w={10} h={10} borderRadius="full" borderWidth="2px" borderColor={process.approved_status === 'Not Qualified' ? 'red.600' : 'gray.200'} bg={process.approved_status === 'Not Qualified' ? 'red.500' : 'transparent'} color={process.approved_status === 'Not Qualified' ? 'white' : 'gray.400'} _hover={{ borderColor: 'red.400' }} onClick={() => setStatus(process.id, false)} p={0}>
                                            <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button className="status-btn pass" w={10} h={10} borderRadius="full" borderWidth="2px" borderColor={process[currentSingleRoundField] === true ? 'green.600' : 'gray.200'} bg={process[currentSingleRoundField] === true ? 'green.500' : 'transparent'} color={process[currentSingleRoundField] === true ? 'white' : 'gray.400'} _hover={{ borderColor: 'green.400' }} onClick={() => setStatus(process.id, true)} p={0}>
                                            <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></Icon>
                                          </Button>
                                          <Button className="status-btn fail" w={10} h={10} borderRadius="full" borderWidth="2px" borderColor={process[currentSingleRoundField] === false ? 'red.600' : 'gray.200'} bg={process[currentSingleRoundField] === false ? 'red.500' : 'transparent'} color={process[currentSingleRoundField] === false ? 'white' : 'gray.400'} _hover={{ borderColor: 'red.400' }} onClick={() => setStatus(process.id, false)} p={0}>
                                            <Icon viewBox="0 0 24 24" boxSize={5} fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>
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
                                      <Box key={i} w={2} h={2} borderRadius="full" bg="green.500" />
                                    ))}
                                  </Flex>
                                </Td>
                                <Td px={4} py={3}>
                                  {COMPANY_VIEW_ONLY ? (
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>{process.remarks || '—'}</Text>
                                  ) : (
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
                                  )}
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
          </VStack>
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyDriveDetail;
