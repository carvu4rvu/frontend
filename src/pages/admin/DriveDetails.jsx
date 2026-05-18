import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  useToast,
  useDisclosure,
  VStack,
  Badge,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  HStack,
  Icon,
  Tag,
  TagLabel,
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  SimpleGrid
} from '@chakra-ui/react';
import { ArrowBackIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { 
  MdBusiness, 
  MdLocationOn, 
  MdDateRange, 
  MdAttachMoney, 
  MdSchool, 
  MdDescription, 
  MdEvent, 
  MdWork, 
  MdPeople,
  MdCheckCircle, 
  MdCancel, 
  MdAccessTime, 
  MdInfo,
  MdLayers,
  MdGrade,
  MdBook,
  MdAssignment,
  MdAdd,
  MdViewList
} from 'react-icons/md';
import { PlacementService } from '../../services/placement.service';
import AdminLayout from '../../components/AdminLayout';
import AddStudentsToDrive from '../../components/placement/AddStudentsToDrive';
import DriveEligibilityModal from '../../components/placement/DriveEligibilityModal';

const DriveDetails = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processes, setProcesses] = useState([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);
  const [detailsWidth, setDetailsWidth] = useState(30);
  const containerRef = useRef(null);
  const isResizingRef = useRef(false);
  const [companyList, setCompanyList] = useState([]);
  const [schoolList, setSchoolList] = useState([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState([]);
  const [editedProcesses, setEditedProcesses] = useState({});
  const [savingProcesses, setSavingProcesses] = useState(false);
  const { isOpen: isEligibilityOpen, onOpen: onEligibilityOpen, onClose: onEligibilityClose } = useDisclosure();

  const initialEditState = {
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

  const [editEvent, setEditEvent] = useState(initialEditState);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [saving, setSaving] = useState(false);

  const fetchDriveAndProcesses = async () => {
    try {
      if (!drive) setLoading(true); // Only show full loading on first load
      
      // If we already have drive data, we might just want to refresh processes
      // But for simplicity, we can refetch drive data too or optimize later
      const driveData = await PlacementService.getDriveById(driveId);
      setDrive(driveData);

      if (driveData) {
          setLoadingProcesses(true);
          const processData = await PlacementService.getDriveProcesses(driveId);
          setProcesses(processData);
      }
    } catch (error) {
      const message = error?.message || "Failed to load drive details";
      toast({
        title: "Error fetching drive details",
        description: message,
        status: "error",
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
    const fetchMeta = async () => {
      try {
        const [companies, schools] = await Promise.all([
          PlacementService.getAllCompanies(),
          PlacementService.getSchools()
        ]);
        setCompanyList(Array.isArray(companies) ? companies : []);
        setSchoolList(Array.isArray(schools) ? schools : []);
      } catch (_error) {
        // Metadata load failed; edit form may have empty dropdowns
      }
    };
    fetchMeta();
  }, []);

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditEvent(prev => {
      let updated = { ...prev, [name]: value };

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

        if (updated.ctc_max !== '' && (updated.ctc_variable !== '' || updated.ctc_stock !== '')) {
          const variableAmount = (max * variablePercent) / 100;
          updated.ctc_final = (max + variableAmount + stock).toFixed(2);
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

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isResizingRef.current || !containerRef.current || isDetailsCollapsed) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      if (!totalWidth) return;

      const offsetX = event.clientX - rect.left;
      const panelWidthPx = offsetX;
      let nextWidth = (panelWidthPx / totalWidth) * 100;

      if (nextWidth < 20) nextWidth = 20;
      if (nextWidth > 45) nextWidth = 45;

      setDetailsWidth(nextWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDetailsCollapsed]);

  useEffect(() => {
    if (driveId) {
      fetchDriveAndProcesses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveId]);

  const openEditForDrive = () => {
    if (!drive) return;
    const ctcStruct = drive.ctc_structure || {};
    const stipendStruct = drive.stipend_structure || {};

    setEditEvent({
      company_id: drive.company_id || '',
      tpo: drive.tpo || '',
      year: drive.year ? drive.year.toString() : new Date().getFullYear().toString(),
      job_description: drive.job_description || '',
      job_type: drive.job_type || '',
      job_location: drive.job_location || '',
      event_datetime: drive.event_datetime ? new Date(drive.event_datetime).toISOString().slice(0, 16) : '',
      last_date_to_registration: drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toISOString().slice(0, 10) : '',
      type_of_hiring: drive.type_of_hiring || '',
      process_rounds: Array.isArray(drive.process_rounds)
        ? drive.process_rounds.filter((r) => !/^aptitude$/i.test(String(r || '').trim()))
        : [],
      number_of_openings: drive.number_of_openings || '',
      ctc: drive.ctc || ctcStruct.package || '',
      ctc_min: ctcStruct.min || '',
      ctc_max: ctcStruct.max || '',
      ctc_avg: ctcStruct.avg || '',
      ctc_variable: ctcStruct.variable || '',
      ctc_stock: ctcStruct.stock || '',
      ctc_final: ctcStruct.final || '',
      stipend: stipendStruct.stipend || '',
      stipend_min: stipendStruct.min || '',
      stipend_max: stipendStruct.max || '',
      stipend_avg: stipendStruct.avg || '',
      placement_status: drive.placement_status || 'Scheduled',
      company_remarks: drive.company_remarks || '',
      onboarded_date: drive.onboarded_date ? new Date(drive.onboarded_date).toISOString().slice(0, 10) : '',
      no_shortlisted: drive.no_shortlisted || '',
      offer_letter_status: drive.offer_letter_status || ''
    });
    onEditOpen();
  };

  const handleEditClose = () => {
    onEditClose();
    setEditEvent(initialEditState);
  };

  const handleProcessSelectAll = (checked) => {
    if (checked) {
      setSelectedProcessIds(processes.map(p => p.id));
    } else {
      setSelectedProcessIds([]);
    }
  };

  const handleProcessSelectRow = (id) => {
    setSelectedProcessIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleProcessFieldChange = (id, field, value) => {
    setProcesses(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
    setEditedProcesses(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const cycleCellValue = (id, field) => {
    const process = processes.find(p => p.id === id);
    if (!process) return;

    if (field === 'is_eligible') {
      const current = !!process.is_eligible;
      handleProcessFieldChange(id, field, !current);
      return;
    }

    if (field === 'malpractice') {
      const current = !!process.malpractice;
      handleProcessFieldChange(id, field, !current);
      return;
    }

    if ([
      'oa_status',
      'gd_status',
      'technical_round_status',
      'interview_status',
      'hr_round_status',
      'final_select_status'
    ].includes(field)) {
      const current = process[field];
      let next;
      if (current === null || current === undefined) {
        next = true;
      } else if (current === true) {
        next = false;
      } else {
        next = null;
      }
      handleProcessFieldChange(id, field, next);
      return;
    }

    const options = (() => {
      switch (field) {
        case 'registration_status':
          return ['Pending', 'Registered', 'Not Registered'];
        case 'approved_status':
          return ['skipped', 'Pending', 'Qualified', 'Not Qualified'];
        default:
          return [];
      }
    })();
    if (!options.length) return;

    const currentValue = process[field] || options[0];
    const index = options.indexOf(currentValue);
    const nextIndex = index === -1 || index === options.length - 1 ? 0 : index + 1;
    const nextValue = options[nextIndex];

    handleProcessFieldChange(id, field, nextValue);
  };

  const renderIcon = (char, color) => (
    <Box as="span" fontWeight="extrabold" fontSize="lg" color={color}>
      {char}
    </Box>
  );

  const formatRoundStatus = (value) => {
    if (value === true) return renderIcon('✓', 'green.500');
    if (value === false) return renderIcon('✗', 'red.500');
    return renderIcon('-', 'gray.400');
  };

  const formatFinalStatus = (value) => {
    if (value === true) return renderIcon('✓', 'green.500');
    if (value === false) return renderIcon('✗', 'red.500');
    return renderIcon('-', 'gray.400');
  };

  const formatYesNoIcon = (value) => {
    if (value === true) return renderIcon('✓', 'green.500');
    if (value === false) return renderIcon('✗', 'red.500');
    return renderIcon('-', 'gray.400');
  };

  const formatRegistrationIcon = (status) => {
    if (!status) return renderIcon('-', 'gray.400');
    const value = String(status).toLowerCase();
    if (value === 'registered') return renderIcon('✓', 'green.500');
    if (value === 'not registered' || value === 'false') return renderIcon('✗', 'red.500');
    return renderIcon('-', 'gray.400');
  };

  const formatApprovedIcon = (status) => {
    if (!status) return renderIcon('-', 'gray.400');
    const value = String(status).toLowerCase();
    if (value === 'qualified' || value === 'approved') return renderIcon('✓', 'green.500');
    if (value === 'not qualified' || value === 'rejected') return renderIcon('✗', 'red.500');
    return renderIcon('-', 'gray.400');
  };

  const activeProcessRounds = Array.isArray(drive?.process_rounds)
    ? drive.process_rounds
        .filter((r) => !/^aptitude$/i.test(String(r || '').trim()))
        .map((r) => String(r || '').toLowerCase().trim())
    : [];

  const showOaRound = activeProcessRounds.some((r) => ['oa', 'online assessment', 'coding test'].includes(r));
  const showGdRound = activeProcessRounds.some((r) => ['gd', 'group discussion'].includes(r));
  const showTechnicalRound = activeProcessRounds.some((r) => ['technical', 'technical round'].includes(r));
  const showInterviewRound = activeProcessRounds.includes('interview');
  const showHrRound = activeProcessRounds.some((r) => ['hr', 'hr round'].includes(r));

  const handleSaveProcessChanges = async () => {
    const entries = Object.entries(editedProcesses);
    if (!entries.length) return;
    try {
      setSavingProcesses(true);
      for (const [id, changes] of entries) {
        await PlacementService.updateProcessStatus(id, changes);
      }
      toast({ title: "Process updates saved", status: "success" });
      setEditedProcesses({});
      setSelectedProcessIds([]);
      await fetchDriveAndProcesses();
    } catch (error) {
      toast({ title: "Error saving process updates", status: "error" });
    } finally {
      setSavingProcesses(false);
    }
  };

  const handleSaveDrive = async () => {
    const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';
    const missing = [];
    if (isBlank(editEvent.company_id)) missing.push('Company');
    if (isBlank(editEvent.event_datetime)) missing.push('Event Date');

    if (missing.length) {
      toast({ title: `${missing.join(', ')} are required`, status: "warning" });
      return;
    }

    const payload = {
      ...editEvent,
      number_of_openings: editEvent.number_of_openings === '' ? null : parseInt(editEvent.number_of_openings),
      company_id: parseInt(editEvent.company_id),
      year: parseInt(editEvent.year),
      no_shortlisted: editEvent.no_shortlisted === '' ? null : parseInt(editEvent.no_shortlisted),
      ctc_structure: {
        package: editEvent.ctc,
        min: editEvent.ctc_min,
        max: editEvent.ctc_max,
        avg: editEvent.ctc_avg,
        variable: editEvent.ctc_variable,
        stock: editEvent.ctc_stock,
        final: editEvent.ctc_final
      },
      stipend_structure: {
        stipend: editEvent.stipend,
        min: editEvent.stipend_min,
        max: editEvent.stipend_max,
        avg: editEvent.stipend_avg
      }
    };

    try {
      setSaving(true);
      await PlacementService.updatePlacementDrive(driveId, payload);
      toast({ title: "Drive updated successfully", status: "success" });
      handleEditClose();
      await fetchDriveAndProcesses();
    } catch (error) {
      const message = error?.message || "Error updating drive";
      toast({
        title: "Error updating drive",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
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
          <Button mt={4} onClick={() => navigate('/placement/events')}>Back to Events</Button>
        </Box>
      </AdminLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'green';
      case 'Closed': return 'red';
      default: return 'yellow';
    }
  };

  return (
    <AdminLayout fullWidth>
      <Flex
        h="calc(100vh - 100px)"
        overflow="hidden"
        ref={containerRef}
        position="relative"
      >
        {isDetailsCollapsed && (
          <Box
            position="absolute"
            left="0"
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
          >
            <IconButton
              aria-label="Expand drive details"
              size="sm"
              icon={<ChevronRightIcon />}
              colorScheme="blue"
              borderRadius="full"
              boxShadow="md"
              onClick={() => setIsDetailsCollapsed(false)}
            />
          </Box>
        )}
        <Box
          w={isDetailsCollapsed ? '0' : `${detailsWidth}%`}
          h="100%"
          overflow="hidden"
          borderRight="1px solid"
          borderColor="gray.200"
          bg="gray.50"
          position="relative"
          transition="width 0.2s ease"
        >
          {!isDetailsCollapsed && (
            <>
              <Box
                position="absolute"
                right="-18px"
                top="50%"
                transform="translateY(-50%)"
              >
                <IconButton
                  aria-label="Collapse drive details"
                  size="sm"
                  icon={<ChevronLeftIcon />}
                  colorScheme="blue"
                  borderRadius="full"
                  boxShadow="md"
                  onClick={() => setIsDetailsCollapsed(true)}
                />
              </Box>
              <Box
                h="100%"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-track': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { background: '#4a5568', borderRadius: '24px' },
                }}
              >
                <Box
                  p={5}
                  bg="white"
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  <Flex justify="space-between" align="center" mb={4} gap={4}>
                    <Button 
                      leftIcon={<ArrowBackIcon />} 
                      variant="ghost" 
                      colorScheme="gray"
                      size="sm"
                      onClick={() => navigate('/placement/events')}
                      _hover={{ bg: 'gray.100', shadow: 'sm' }}
                    >
                      Back to Events
                    </Button>
                    <HStack spacing={2}>
                      <Button
                        variant="outline"
                        colorScheme="teal"
                        size="sm"
                        onClick={() => navigate(`/placement/events/${driveId}/process`)}
                      >
                        Process
                      </Button>
                      <Button
                        variant="outline"
                        colorScheme="cyan"
                        size="sm"
                        onClick={() => navigate(`/placement/events/${driveId}/registrations`)}
                      >
                        Registrations
                      </Button>
                      <Button
                        variant="outline"
                        colorScheme="blue"
                        size="sm"
                        onClick={openEditForDrive}
                      >
                        Edit Drive
                      </Button>
                    </HStack>
                  </Flex>

                  <Flex justify="space-between" align="center" gap={4}>
                    <HStack spacing={4} align="start">
                      <Avatar 
                        size="lg" 
                        name={drive.company_name} 
                        bg="blue.500" 
                        color="white" 
                        boxShadow="md"
                      />
                      <Box flex={1}>
                        <Heading size="md" color="gray.800" lineHeight="shorter">
                          {drive.company_name}
                        </Heading>
                        <Text fontWeight="bold" color="blue.600" fontSize="sm" mt={1}>
                          {drive.job_type}
                        </Text>
                        {drive.type_of_hiring && (
                          <Badge colorScheme="purple" mt={1} fontSize="xs">
                            {drive.type_of_hiring}
                          </Badge>
                        )}
                      </Box>
                    </HStack>
                  </Flex>
                </Box>

                <VStack
                  align="stretch"
                  spacing={0}
                  divider={<Divider borderColor="gray.100" />}
                  bg="gray.50"
                >
                  <Box
                    p={5}
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Flex justify="space-between" align="center" mb={4}>
                      <HStack spacing={2}>
                        <Icon as={MdEvent} color="blue.500" boxSize={4} />
                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
                          Current Status
                        </Text>
                      </HStack>
                      <Badge 
                        colorScheme={getStatusColor(drive.placement_status)} 
                        variant="subtle" 
                        px={3} py={1} 
                        borderRadius="full"
                        fontSize="sm"
                      >
                        {drive.placement_status}
                      </Badge>
                    </Flex>
                    
                    <VStack spacing={4} align="stretch">
                      <DetailRow 
                        icon={MdEvent} 
                        label="Drive Date" 
                        value={drive.event_datetime ? new Date(drive.event_datetime).toLocaleString() : 'TBD'} 
                        highlight
                      />
                      <DetailRow 
                        icon={MdAccessTime} 
                        label="Reg. Deadline" 
                        value={drive.last_date_to_registration ? new Date(drive.last_date_to_registration).toLocaleDateString() : 'TBD'} 
                        color="red.300"
                      />
                    </VStack>
                  </Box>

                  <Box
                    p={5}
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <SectionHeader title="Job Details" icon={MdWork} />
                    <VStack spacing={4} align="stretch">
                      <DetailRow icon={MdLocationOn} label="Location" value={drive.job_location} />
                      <DetailRow icon={MdPeople} label="Vacancies" value={drive.number_of_openings} />
                      <DetailRow icon={MdAttachMoney} label="Salary (CTC)" value={formatCTC(drive.ctc_structure)} />
                      <DetailRow icon={MdAttachMoney} label="Stipend" value={formatStipend(drive.stipend_structure)} />
                    </VStack>
                  </Box>

                  <Box
                    p={5}
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <HStack justify="space-between" mb={4}>
                      <SectionHeader title="Eligibility Criteria" icon={MdSchool} />
                      <Button size="sm" colorScheme="teal" variant="outline" leftIcon={<MdCheckCircle />} onClick={onEligibilityOpen}>
                        Configure Eligibility
                      </Button>
                    </HStack>
                    <VStack spacing={4} align="stretch">
                      <DetailRow icon={MdDateRange} label="Batch Year" value={drive.year} />
                      <DetailRow icon={MdBusiness} label="School(s)" value={drive.school || (drive.placement_drive_eligibility?.allowed_school_ids?.length ? `${drive.placement_drive_eligibility.allowed_school_ids.length} selected` : '-')} />
                      <DetailRow icon={MdLayers} label="Program(s)" value={drive.program || (drive.placement_drive_eligibility?.allowed_program_ids?.length ? `${drive.placement_drive_eligibility.allowed_program_ids.length} selected` : '-')} />
                      <HStack spacing={6} pt={2}>
                        <MiniDetail label="Min CGPA" value={drive.placement_drive_eligibility?.min_cgpa ?? drive.eligibility_academics?.min_cgpa} />
                        <MiniDetail label="Max Backlogs" value={drive.placement_drive_eligibility?.max_active_backlogs ?? drive.eligibility_academics?.backlogs_allowed} />
                      </HStack>
                    </VStack>
                  </Box>

                  <Box
                    p={5}
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <SectionHeader title="Description" icon={MdDescription} />
                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="tall">
                      {drive.job_description || 'No description available.'}
                    </Text>
                    
                    {drive.company_remarks && (
                      <Box mt={4} p={3} bg="yellow.50" borderRadius="md" borderLeft="4px solid" borderColor="yellow.400">
                        <HStack mb={1}>
                          <Icon as={MdInfo} color="yellow.500" />
                          <Text fontSize="xs" fontWeight="bold" color="yellow.700" textTransform="uppercase">Remarks</Text>
                        </HStack>
                        <Text fontSize="sm" color="yellow.800">{drive.company_remarks}</Text>
                      </Box>
                    )}
                  </Box>

                  <Box
                    p={5}
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <SectionHeader title="Additional Info" icon={MdInfo} />
                    <VStack spacing={4} align="stretch">
                      <DetailRow icon={MdAssignment} label="Drive ID" value={drive.id} />
                      <DetailRow icon={MdBook} label="TPO" value={drive.tpo} />
                      <DetailRow icon={MdDateRange} label="Year" value={drive.year} />
                      <DetailRow icon={MdPeople} label="Registrations" value={drive.number_of_registrations} />
                      <DetailRow icon={MdDateRange} label="Onboarded Date" value={drive.onboarded_date ? new Date(drive.onboarded_date).toLocaleDateString() : 'TBD'} />
                      <DetailRow icon={MdCheckCircle} label="Offer Letter Status" value={drive.offer_letter_status || '-'} />
                      <DetailRow icon={MdPeople} label="No Shortlisted" value={drive.no_shortlisted} />
                      <DetailRow icon={MdInfo} label="Created At" value={drive.created_at ? new Date(drive.created_at).toLocaleString() : '-'} />
                      <DetailRow icon={MdInfo} label="Updated At" value={drive.updated_at ? new Date(drive.updated_at).toLocaleString() : '-'} />
                    </VStack>
                  </Box>
                </VStack>
              </Box>
            </>
          )}
        </Box>
        {!isDetailsCollapsed && (
          <Box
            w="6px"
            h="100%"
            cursor="col-resize"
            bg="gray.200"
            _hover={{ bg: 'gray.300' }}
            onMouseDown={() => {
              isResizingRef.current = true;
            }}
          />
        )}
        <Box flex="1" h="100%" bg="#f0f0f0" p={6} overflowY="auto">
            <Box
              p={6}
              bg="white"
              borderRadius="2xl"
              shadow="md"
              border="1px solid"
              borderColor="gray.200"
              maxW="7xl"
              mx="auto"
            >
                <HStack mb={6} justify="space-between">
                    <HStack spacing={3}>
                        <Box p={2} bg="blue.50" borderRadius="lg">
                            <Icon as={showAddStudents ? MdPeople : MdAssignment} boxSize={6} color="blue.500" />
                        </Box>
                        <Heading size="md" color="gray.700">
                            {showAddStudents ? "Add Students to Drive" : "Student Process Table"}
                        </Heading>
                    </HStack>
                    <HStack spacing={3}>
                        {!showAddStudents && (
                            <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                                Total: {processes.length}
                            </Badge>
                        )}
                        <Button
                            leftIcon={<Icon as={showAddStudents ? MdViewList : MdAdd} />}
                            colorScheme={showAddStudents ? "gray" : "blue"}
                            onClick={() => setShowAddStudents(!showAddStudents)}
                            size="sm"
                        >
                            {showAddStudents ? "View Processes" : "Add Students"}
                        </Button>
                    </HStack>
                </HStack>

                {showAddStudents ? (
                    <AddStudentsToDrive 
                        driveId={driveId}
                        embedded={true}
                        existingUsns={processes.map(p => p.usn)}
                        onCancel={() => setShowAddStudents(false)}
                        onSuccess={() => {
                            fetchDriveAndProcesses();
                            setShowAddStudents(false);
                        }}
                    />
                ) : (
                    loadingProcesses ? (
                        <Flex justify="center" align="center" py={20}>
                            <Spinner size="xl" thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />
                        </Flex>
                    ) : (
                        <>
                            <Flex justify="flex-end" align="center" mb={3}>
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={handleSaveProcessChanges}
                                isLoading={savingProcesses}
                                loadingText="Saving"
                                variant="solid"
                              >
                                Save Changes
                              </Button>
                            </Flex>
                            <TableContainer borderRadius="xl" borderWidth="1px" borderColor="gray.100" bg="gray.50">
                                <Table variant="striped" colorScheme="gray" size="sm">
                                    <Thead bg="gray.100">
                                        <Tr>
                                            <Th px={2}>
                                                <Checkbox
                                                  isChecked={processes.length > 0 && selectedProcessIds.length === processes.length}
                                                  isIndeterminate={selectedProcessIds.length > 0 && selectedProcessIds.length < processes.length}
                                                  onChange={(e) => handleProcessSelectAll(e.target.checked)}
                                                />
                                            </Th>
                                            <Th>USN</Th>
                                            <Th>Student Name</Th>
                                            <Th>Eligible</Th>
                                            <Th>Registration</Th>
                                            <Th>Approved</Th>
                                            {showOaRound && <Th>OA</Th>}
                                            {showGdRound && <Th>GD</Th>}
                                            {showTechnicalRound && <Th>Technical</Th>}
                                            {showInterviewRound && <Th>Interview</Th>}
                                            {showHrRound && <Th>HR</Th>}
                                            <Th>Final</Th>
                                            <Th>Malpractice</Th>
                                            <Th>Remarks</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {processes.length === 0 ? (
                                            <Tr>
                                                <Td colSpan={18} textAlign="center" py={10} color="gray.500">
                                                    <Flex direction="column" align="center" justify="center">
                                                        <Icon as={MdAssignment} boxSize={8} mb={2} opacity={0.2} />
                                                        <Text>No student processes found for this drive.</Text>
                                                    </Flex>
                                                </Td>
                                            </Tr>
                                        ) : (
                                            processes.map((process) => (
                                            <Tr key={process.id} _hover={{ bg: "blue.50", transition: "all 0.2s" }}>
                                                <Td px={2} onClick={(e) => e.stopPropagation()}>
                                                  <Checkbox
                                                    isChecked={selectedProcessIds.includes(process.id)}
                                                    onChange={() => handleProcessSelectRow(process.id)}
                                                  />
                                                </Td>
                                                <Td
                                                  fontWeight="bold"
                                                  color="blue.600"
                                                  cursor="pointer"
                                                  _hover={{ textDecoration: 'underline' }}
                                                  onClick={() => process.usn && navigate(`/placement/students/${encodeURIComponent(process.usn)}`)}
                                                >
                                                  {process.usn}
                                                </Td>
                                                <Td
                                                  fontWeight="medium"
                                                  cursor="pointer"
                                                  _hover={{ textDecoration: 'underline' }}
                                                  onClick={() => process.usn && navigate(`/placement/students/${encodeURIComponent(process.usn)}`)}
                                                >
                                                  {process.student_name || '-'}
                                                </Td>
                                                <Td>
                                                  <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    w="100%"
                                                    bg="white"
                                                    onClick={() => cycleCellValue(process.id, 'is_eligible')}
                                                  >
                                                    {formatYesNoIcon(process.is_eligible)}
                                                  </Button>
                                                </Td>
                                                <Td>
                                                  <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    w="100%"
                                                    bg="white"
                                                    onClick={() => cycleCellValue(process.id, 'registration_status')}
                                                  >
                                                    {formatRegistrationIcon(process.registration_status)}
                                                  </Button>
                                                </Td>
                                                <Td>
                                                  <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    w="100%"
                                                    bg="white"
                                                    onClick={() => cycleCellValue(process.id, 'approved_status')}
                                                  >
                                                    {formatApprovedIcon(process.approved_status)}
                                                  </Button>
                                                </Td>
                                                {showOaRound && (
                                                  <Td>
                                                    <Button
                                                      size="xs"
                                                      variant="ghost"
                                                      w="100%"
                                                      bg="white"
                                                      onClick={() => cycleCellValue(process.id, 'oa_status')}
                                                    >
                                                      {formatRoundStatus(process.oa_status)}
                                                    </Button>
                                                  </Td>
                                                )}
                                                {showGdRound && (
                                                  <Td>
                                                    <Button
                                                      size="xs"
                                                      variant="ghost"
                                                      w="100%"
                                                      bg="white"
                                                      onClick={() => cycleCellValue(process.id, 'gd_status')}
                                                    >
                                                      {formatRoundStatus(process.gd_status)}
                                                    </Button>
                                                  </Td>
                                                )}
                                                {showTechnicalRound && (
                                                  <Td>
                                                    <Button
                                                      size="xs"
                                                      variant="ghost"
                                                      w="100%"
                                                      bg="white"
                                                      onClick={() => cycleCellValue(process.id, 'technical_round_status')}
                                                    >
                                                      {formatRoundStatus(process.technical_round_status)}
                                                    </Button>
                                                  </Td>
                                                )}
                                                {showInterviewRound && (
                                                  <Td>
                                                    <Button
                                                      size="xs"
                                                      variant="ghost"
                                                      w="100%"
                                                      bg="white"
                                                      onClick={() => cycleCellValue(process.id, 'interview_status')}
                                                    >
                                                      {formatRoundStatus(process.interview_status)}
                                                    </Button>
                                                  </Td>
                                                )}
                                                {showHrRound && (
                                                  <Td>
                                                    <Button
                                                      size="xs"
                                                      variant="ghost"
                                                      w="100%"
                                                      bg="white"
                                                      onClick={() => cycleCellValue(process.id, 'hr_round_status')}
                                                    >
                                                      {formatRoundStatus(process.hr_round_status)}
                                                    </Button>
                                                  </Td>
                                                )}
                                                <Td>
                                                  <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    w="100%"
                                                    bg="white"
                                                    onClick={() => cycleCellValue(process.id, 'final_select_status')}
                                                  >
                                                    {formatFinalStatus(process.final_select_status)}
                                                  </Button>
                                                </Td>
                                                <Td>
                                                  <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    w="100%"
                                                    bg="white"
                                                    onClick={() => cycleCellValue(process.id, 'malpractice')}
                                                  >
                                                    {formatYesNoIcon(process.malpractice)}
                                                  </Button>
                                                </Td>
                                                <Td maxW="200px">
                                                    <Input
                                                      size="sm"
                                                      bg="white"
                                                      value={process.remarks || ''}
                                                      onChange={(e) => handleProcessFieldChange(process.id, 'remarks', e.target.value)}
                                                    />
                                                </Td>
                                            </Tr>
                                        )))}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </>
                    )
                )}
            </Box>
        </Box>
      </Flex>
      <Modal isOpen={isEditOpen} onClose={handleEditClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.50">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.200" bg="white" borderTopRadius="md">
            Edit Placement Drive
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={8} pt={6}>
            <VStack spacing={6} align="stretch">
              <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                <Heading size="md" color="gray.700" mb={4}>Basic Information</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium" color="gray.600">Company</FormLabel>
                    <Select name="company_id" value={editEvent.company_id} onChange={handleEditInputChange} placeholder="Select Company" bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }}>
                      {companyList.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Company Remarks</FormLabel>
                    <Input name="company_remarks" value={editEvent.company_remarks} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">TPO Name</FormLabel>
                    <Input name="tpo" value={editEvent.tpo} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Year</FormLabel>
                    <Input type="number" name="year" value={editEvent.year} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Last Date to Reg</FormLabel>
                    <Input
                      type="date"
                      name="last_date_to_registration"
                      value={editEvent.last_date_to_registration}
                      onChange={handleEditInputChange}
                      max="9999-12-31"
                      bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium" color="gray.600">Event Date</FormLabel>
                    <Input
                      type="datetime-local"
                      name="event_datetime"
                      value={editEvent.event_datetime}
                      onChange={handleEditInputChange}
                      max="9999-12-31T23:59"
                      bg="gray.50" _focus={{ bg: 'white', borderColor: 'blue.500' }}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                <Heading size="md" color="gray.700" mb={4}>Job Details</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium" color="gray.600">Job Type</FormLabel>
                    <Select name="job_type" value={editEvent.job_type} onChange={handleEditInputChange} placeholder="Select Job Type" bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }}>
                      <option value="Full Time">Full Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Internship + FTE">Internship + FTE</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Type of Hiring</FormLabel>
                    <Select name="type_of_hiring" value={editEvent.type_of_hiring} onChange={handleEditInputChange} placeholder="Select Hiring Type" bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }}>
                      <option value="On Campus">On Campus</option>
                      <option value="Off Campus">Off Campus</option>
                      <option value="Pool Campus">Pool Campus</option>
                      <option value="Virtual">Virtual</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Job Location</FormLabel>
                    <Input name="job_location" value={editEvent.job_location} onChange={handleEditInputChange} placeholder="City/State" bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }} />
                  </FormControl>
                  <FormControl gridColumn={{ md: "span 2" }}>
                    <FormLabel fontWeight="medium" color="gray.600">Job Description</FormLabel>
                    <Textarea name="job_description" value={editEvent.job_description} onChange={handleEditInputChange} placeholder="Job description..." rows={3} bg="gray.50" _focus={{ bg: 'white', borderColor: 'purple.500' }} />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                <Heading size="md" color="gray.700" mb={4}>Compensation Details</Heading>
                <Box bg="gray.50" p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor="gray.200">
                  <Text fontWeight="bold" fontSize="sm" mb={3} color="green.700" textTransform="uppercase" letterSpacing="wide">CTC Structure (LPA)</Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Minimum</FormLabel>
                      <Input type="number" name="ctc_min" value={editEvent.ctc_min} onChange={handleEditInputChange} placeholder="Min" bg="white" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Maximum</FormLabel>
                      <Input type="number" name="ctc_max" value={editEvent.ctc_max} onChange={handleEditInputChange} placeholder="Max" bg="white" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Average (Calc)</FormLabel>
                      <Input type="number" name="ctc_avg" value={editEvent.ctc_avg} isReadOnly bg="gray.100" color="gray.600" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Variable Pay (%)</FormLabel>
                      <Input type="number" name="ctc_variable" value={editEvent.ctc_variable} onChange={handleEditInputChange} placeholder="e.g. 10" bg="white" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Stock Options</FormLabel>
                      <Input type="number" name="ctc_stock" value={editEvent.ctc_stock} onChange={handleEditInputChange} placeholder="Stock" bg="white" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="green.600">Final CTC (Calc)</FormLabel>
                      <Input type="number" name="ctc_final" value={editEvent.ctc_final} isReadOnly bg="green.50" color="green.700" fontWeight="bold" borderColor="green.200" />
                    </FormControl>
                  </SimpleGrid>
                </Box>
                <Box bg="gray.50" p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor="gray.200">
                  <Text fontWeight="bold" fontSize="sm" mb={3} color="blue.700" textTransform="uppercase" letterSpacing="wide">Stipend Structure (Monthly)</Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Minimum</FormLabel>
                      <Input type="number" name="stipend_min" value={editEvent.stipend_min} onChange={handleEditInputChange} placeholder="Min" bg="white" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Maximum</FormLabel>
                      <Input type="number" name="stipend_max" value={editEvent.stipend_max} onChange={handleEditInputChange} placeholder="Max" bg="white" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500">Average (Calc)</FormLabel>
                      <Input type="number" name="stipend_avg" value={editEvent.stipend_avg} isReadOnly bg="gray.100" color="gray.600" />
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
                <Heading size="md" color="gray.700" mb={4}>Status & Openings</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Number of Openings</FormLabel>
                    <Input type="number" name="number_of_openings" value={editEvent.number_of_openings} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Placement Status</FormLabel>
                    <Select name="placement_status" value={String(editEvent.placement_status || '').toLowerCase() === 'cancelled' ? 'Failed' : (editEvent.placement_status || '')} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }}>
                      <option value="Scheduled">Upcoming Drives</option>
                      <option value="Ongoing">Ongoing Drives</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed/Cancelled</option>
                      <option value="Postponed">Postponed</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Onboarded Date</FormLabel>
                    <Input
                      type="date"
                      name="onboarded_date"
                      value={editEvent.onboarded_date}
                      onChange={handleEditInputChange}
                      max="9999-12-31"
                      bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">No Shortlisted</FormLabel>
                    <Input type="number" name="no_shortlisted" value={editEvent.no_shortlisted} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color="gray.600">Offer Letter Status</FormLabel>
                    <Select name="offer_letter_status" value={editEvent.offer_letter_status} onChange={handleEditInputChange} bg="gray.50" _focus={{ bg: 'white', borderColor: 'orange.500' }} placeholder="Select Status">
                      <option value="Pending">Pending</option>
                      <option value="Released">Released</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </Select>
                  </FormControl>
                  <FormControl gridColumn={{ md: "span 2" }}>
                    <FormLabel fontWeight="medium" color="gray.600">Process Rounds</FormLabel>
                    <CheckboxGroup
                      value={editEvent.process_rounds || []}
                      onChange={(values) => setEditEvent(prev => ({ ...prev, process_rounds: values }))}
                    >
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
                        <Checkbox value="OA">OA</Checkbox>
                        <Checkbox value="Coding Test">Coding Test</Checkbox>
                        <Checkbox value="GD">GD</Checkbox>
                        <Checkbox value="Technical Round">Technical Round</Checkbox>
                        <Checkbox value="Interview">Interview</Checkbox>
                        <Checkbox value="HR Round">HR Round</Checkbox>
                      </SimpleGrid>
                    </CheckboxGroup>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box bg="gray.50" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                <Text fontSize="sm" color="gray.600" mb={2}>Eligibility is configured in the dedicated Eligibility panel. Click "Configure Eligibility" in the drive details or use the eligibility button on the events list.</Text>
                <Button size="sm" colorScheme="teal" variant="outline" onClick={() => { handleEditClose(); onEligibilityOpen(); }}>
                  Configure Eligibility
                </Button>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.200" bg="gray.50" borderBottomRadius="md">
            <Button variant="outline" mr={3} onClick={handleEditClose} bg="white">
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveDrive} isLoading={saving} loadingText="Saving" px={8}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <DriveEligibilityModal
        isOpen={isEligibilityOpen}
        onClose={onEligibilityClose}
        driveId={driveId}
        schoolList={schoolList}
        onSuccess={fetchDriveAndProcesses}
      />
    </AdminLayout>
  );
};

const SectionHeader = ({ title, icon }) => (
  <HStack mb={4} spacing={2}>
    <Icon as={icon} color="blue.500" boxSize={5} />
    <Heading size="xs" textTransform="uppercase" color="gray.600" letterSpacing="wider">
      {title}
    </Heading>
  </HStack>
);

const DetailRow = ({ icon, label, value, highlight, color }) => (
    <Flex align="flex-start">
        <Icon as={icon} color="gray.500" boxSize={5} mt={0.5} mr={3} />
        <Box flex={1}>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
                {label}
            </Text>
            <Box fontSize="sm" mt={0.5} fontWeight={highlight ? "bold" : "medium"} color={color || "gray.800"}>
                {value || '-'}
            </Box>
        </Box>
    </Flex>
);

const MiniDetail = ({ label, value }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">{label}</Text>
    <Text fontSize="lg" fontWeight="bold" color="gray.800">{value || '-'}</Text>
  </Box>
);

// Helper functions
const formatCTC = (ctcStructure) => {
  if (!ctcStructure) return '-';
  
  if (typeof ctcStructure === 'string') return ctcStructure;

  const finalCTC = ctcStructure.final || ctcStructure.package || '0';
  
  const min = ctcStructure.min || '0';
  const max = ctcStructure.max || '0';
  const variable = ctcStructure.variable ? `${ctcStructure.variable}%` : '0%';
  const stock = ctcStructure.stock || '0';
  
  const details = `Range: ${min}-${max} LPA | Var: ${variable} | Stock: ${stock}`;
  
  return (
    <Tooltip label={details} hasArrow placement="top">
      <Text cursor="pointer" borderBottom="1px dashed" borderColor="gray.400" display="inline-block">
        {finalCTC} LPA
      </Text>
    </Tooltip>
  );
};

const formatStipend = (stipendStructure) => {
  if (!stipendStructure) return '-';

  if (typeof stipendStructure === 'string') return stipendStructure;
  
  const min = parseFloat(stipendStructure.min || 0);
  const max = parseFloat(stipendStructure.max || 0);
  const avg = stipendStructure.avg || 0;
  
  if (min !== max && min > 0 && max > 0) {
    return `${min} - ${max}`;
  }
  
  return avg || min || max || '-';
};

export default DriveDetails;
