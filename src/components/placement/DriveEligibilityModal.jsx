import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { QuestionIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { PlacementService } from '../../services/placement.service';
import { passesPlacementStudentFilters } from '../../utils/placementStudentFilters';

/** Multi-select filter: click to open, shows selected options as tags */
const FilterMultiSelect = ({ label, options, value = [], onChange, placeholder = 'Select...', isDisabled, colorScheme = 'teal', getLabel = (o) => o?.name || o?.abbreviation || String(o) }) => {
  const selected = options.filter((o) => value.includes(o.id));
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };
  const remove = (id) => onChange(value.filter((v) => v !== id));

  return (
    <Box flex="1" minW="120px">
      <Text fontSize="xs" fontWeight="600" color="gray.600" mb={0.5}>{label}</Text>
      <Popover placement="bottom-start" isLazy>
        <PopoverTrigger>
          <Box
            as="button"
            type="button"
            w="100%"
            minH="44px"
            px={2}
            py={1.5}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
            bg={isDisabled ? 'gray.100' : 'gray.50'}
            _hover={!isDisabled && { borderColor: 'gray.300', bg: 'white' }}
            _focus={{ outline: 'none', borderColor: 'teal.400', boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)' }}
            textAlign="left"
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            opacity={isDisabled ? 0.7 : 1}
          >
            {selected.length > 0 ? (
              <Wrap spacing={1}>
                {selected.map((o) => (
                  <WrapItem key={o.id}>
                    <Tag size="sm" colorScheme={colorScheme} borderRadius="md" fontSize="xs">
                      <TagLabel>{getLabel(o)}</TagLabel>
                      <TagCloseButton onClick={(e) => { e.stopPropagation(); remove(o.id); }} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            ) : (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">{placeholder}</Text>
                <ChevronDownIcon />
              </HStack>
            )}
          </Box>
        </PopoverTrigger>
        <PopoverContent w="auto" minW="200px" maxH="240px" overflowY="auto" _focus={{ outline: 'none' }}>
          <PopoverBody p={2}>
            <VStack align="stretch" spacing={0}>
              {options.map((o) => (
                <Checkbox
                  key={o.id}
                  size="sm"
                  isChecked={value.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  py={1.5}
                  px={2}
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="md"
                >
                  {getLabel(o)}
                </Checkbox>
              ))}
              {options.length === 0 && <Text fontSize="sm" color="gray.500" py={2}>No options</Text>}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

const initialEligibilityState = {
  min_cgpa: '',
  max_cgpa: '',
  max_active_backlogs: '',
  max_backlog_history: '',
  max_total_offers: '',
  eligible_years: [],
  eligible_semesters: [],
  allowed_school_ids: [],
  allowed_program_ids: [],
  allowed_major_ids: [],
  allowed_specialization_ids: [],
  allowed_genders: [],
  allowed_years: [],
  allowed_semesters: [],
  allowed_sections: [],
  joining_years: [],
  graduation_years: [],
  allow_already_placed: true,
  max_existing_ctc_lpa: '',
  min_new_ctc_lpa: '',
  min_ctc_multiplier: '1.5',
  min_10th_percent: '',
  min_12th_percent: '',
  min_diploma_percent: '',
  count_offcampus_offers: true,
  admin_override_allowed: false
};

const DriveEligibilityModal = ({ isOpen, onClose, driveId, schoolList: schoolListProp = [], onSuccess }) => {
  const toast = useToast();
  const [eligibilityForm, setEligibilityForm] = useState(initialEligibilityState);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [schoolList, setSchoolList] = useState(schoolListProp);
  const [programList, setProgramList] = useState([]);
  const [specializationList, setSpecializationList] = useState([]);
  const [majorList, setMajorList] = useState([]);

  useEffect(() => {
    if (isOpen && schoolListProp.length) setSchoolList(schoolListProp);
  }, [isOpen, schoolListProp]);

  useEffect(() => {
    if (!eligibilityForm.allowed_school_ids?.length) {
      setProgramList([]);
      return;
    }
    PlacementService.getPrograms().then((all) => {
      const filtered = (all || []).filter((p) => eligibilityForm.allowed_school_ids.includes(p.school_id));
      setProgramList(filtered);
    }).catch(() => setProgramList([]));
  }, [eligibilityForm.allowed_school_ids?.join(',')]);

  useEffect(() => {
    if (!eligibilityForm.allowed_program_ids?.length) {
      setSpecializationList([]);
      setMajorList([]);
      return;
    }
    const progIds = eligibilityForm.allowed_program_ids;
    Promise.all([
      PlacementService.getSpecializations().then((all) => (all || []).filter((s) => progIds.includes(s.program_id))),
      PlacementService.getMajors().then((all) => (all || []).filter((m) => progIds.includes(m.program_id)))
    ]).then(([specs, majors]) => {
      setSpecializationList(specs);
      setMajorList(majors);
    }).catch(() => { setSpecializationList([]); setMajorList([]); });
  }, [eligibilityForm.allowed_program_ids?.join(',')]);

  useEffect(() => {
    if (!isOpen || !driveId) return;
    setEligibilityForm(initialEligibilityState);
    setLoading(true);
    PlacementService.getDriveEligibility(driveId)
      .then((elig) => {
        if (elig) {
          setEligibilityForm({
            min_cgpa: elig.min_cgpa ?? '',
            max_cgpa: elig.max_cgpa ?? '',
            max_active_backlogs: elig.max_active_backlogs ?? '',
            max_backlog_history: elig.max_backlog_history ?? '',
            max_total_offers: elig.max_total_offers ?? '',
            eligible_years: Array.isArray(elig.eligible_years) ? elig.eligible_years : [],
            eligible_semesters: Array.isArray(elig.eligible_semesters) ? elig.eligible_semesters : [],
            allowed_school_ids: Array.isArray(elig.allowed_school_ids) ? elig.allowed_school_ids : [],
            allowed_program_ids: Array.isArray(elig.allowed_program_ids) ? elig.allowed_program_ids : [],
            allowed_major_ids: Array.isArray(elig.allowed_major_ids) ? elig.allowed_major_ids : [],
            allowed_specialization_ids: Array.isArray(elig.allowed_specialization_ids) ? elig.allowed_specialization_ids : [],
            allowed_genders: Array.isArray(elig.allowed_genders) ? elig.allowed_genders : [],
            allowed_years: Array.isArray(elig.allowed_years) ? elig.allowed_years : [],
            allowed_semesters: Array.isArray(elig.allowed_semesters) ? elig.allowed_semesters : [],
            allowed_sections: Array.isArray(elig.allowed_sections) ? elig.allowed_sections : [],
            joining_years: Array.isArray(elig.joining_years) ? elig.joining_years : [],
            graduation_years: Array.isArray(elig.graduation_years) ? elig.graduation_years : [],
            allow_already_placed: elig.allow_already_placed !== false,
            max_existing_ctc_lpa: elig.max_existing_ctc_lpa ?? '',
            min_new_ctc_lpa: elig.min_new_ctc_lpa ?? '',
            min_ctc_multiplier: elig.min_ctc_multiplier ?? '',
            min_10th_percent: elig.min_10th_percent ?? '',
            min_12th_percent: elig.min_12th_percent ?? '',
            min_diploma_percent: elig.min_diploma_percent ?? '',
            count_offcampus_offers: elig.count_offcampus_offers !== false,
            admin_override_allowed: elig.admin_override_allowed === true
          });
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, driveId]);

  const handleSchoolChange = (vals) => {
    setEligibilityForm((prev) => ({ ...prev, allowed_school_ids: vals, allowed_program_ids: [], allowed_major_ids: [], allowed_specialization_ids: [] }));
  };

  const handleProgramChange = (vals) => {
    setEligibilityForm((prev) => ({ ...prev, allowed_program_ids: vals, allowed_major_ids: [], allowed_specialization_ids: [] }));
  };

  const saveEligibility = async () => {
    if (!driveId) return;
    setLoading(true);
    try {
      const res = await PlacementService.upsertDriveEligibility(driveId, eligibilityForm);
      const added = res?.addedToProcess ?? 0;
      const notified = res?.notified ?? 0;
      if (added > 0 || notified > 0) {
        const parts = [];
        if (added > 0) parts.push(`${added} newly added to process`);
        if (notified > 0) parts.push(`notification sent to ${notified} student(s)`);
        if (added === 0 && notified > 0) parts.unshift('0 newly added (all eligible were already in process)');
        toast({
          title: 'Eligibility saved',
          description: parts.join('; '),
          status: 'success',
          duration: 5000,
        });
      } else {
        toast({ title: 'Eligibility saved', status: 'success' });
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      toast({ title: 'Failed to save eligibility', description: e?.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const params = {
        page: 1,
        page_size: 100,
        opt_in_only: true,
        exclude_admin_hold: true,
        exclude_placement_violations: true,
        exclude_disciplinary_records: true,
        exclude_already_added: false,
      };
      if (driveId) params.drive_id = driveId;
      if (eligibilityForm.allowed_school_ids?.length) params.school_ids = eligibilityForm.allowed_school_ids;
      if (eligibilityForm.allowed_program_ids?.length) params.program_ids = eligibilityForm.allowed_program_ids;
      const data = await PlacementService.getAllStudents(params);
      setStudents(data?.students ?? []);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Auto-load all students when modal opens and eligibility has been loaded, or when school/program filters change
  useEffect(() => {
    if (isOpen && driveId && !loading) {
      fetchStudents();
    }
  }, [isOpen, driveId, loading, JSON.stringify(eligibilityForm.allowed_school_ids), JSON.stringify(eligibilityForm.allowed_program_ids)]);

  const filteredStudents = students.filter((student) => {
    const passes = passesPlacementStudentFilters(student, {
      selectedSchoolIds: eligibilityForm.allowed_school_ids || [],
      selectedProgramIds: eligibilityForm.allowed_program_ids || [],
      selectedSpecializationIds: eligibilityForm.allowed_specialization_ids || [],
      selectedMajorIds: eligibilityForm.allowed_major_ids || [],
      minCGPA: eligibilityForm.min_cgpa ?? '',
      maxCGPA: eligibilityForm.max_cgpa ?? '',
      maxActiveBacklogs: eligibilityForm.max_active_backlogs ?? '',
      maxBacklogHistory: eligibilityForm.max_backlog_history ?? '',
      maxTotalOffers: eligibilityForm.max_total_offers ?? '',
      joiningYears: Array.isArray(eligibilityForm.joining_years) ? eligibilityForm.joining_years.join(',') : '',
      graduationYears: Array.isArray(eligibilityForm.graduation_years) ? eligibilityForm.graduation_years.join(',') : '',
      maxExistingCtcLpa: eligibilityForm.max_existing_ctc_lpa ?? '',
      minNewCtcLpa: eligibilityForm.min_new_ctc_lpa ?? '',
      minCtcMultiplier: eligibilityForm.min_ctc_multiplier ?? '1.5',
      selectedGenders: eligibilityForm.allowed_genders || [],
      selectedYears: eligibilityForm.allowed_years || [],
      selectedSemesters: eligibilityForm.allowed_semesters || [],
      selectedSections: eligibilityForm.allowed_sections || [],
      min10thPercent: eligibilityForm.min_10th_percent ?? '',
      min12thPercent: eligibilityForm.min_12th_percent ?? '',
      minDiplomaPercent: eligibilityForm.min_diploma_percent ?? '',
      applyOptionsWhenChecked: false,
      allowAlreadyPlaced: eligibilityForm.allow_already_placed !== false,
      countOffcampusOffers: eligibilityForm.count_offcampus_offers !== false,
    });

    // logic: 
    // 1. If student is in process AND passes -> hide (already added and eligible)
    // 2. If student is in process AND fails -> show (to highlight as red)
    // 3. If student is NOT in process AND passes -> show (eligible to be added)
    // 4. If student is NOT in process AND fails -> hide (ineligible)
    
    if (student.is_in_process) {
      return !passes; // Show only if ineligible
    }
    return passes; // Show only if eligible
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
      <ModalContent maxH="90vh" bg="gray.50" borderRadius="xl" shadow="2xl" overflow="hidden">
        <ModalHeader
          py={5}
          px={6}
          bg="linear-gradient(135deg, #2d3748 0%, #1a202c 100%)"
          color="white"
          borderBottomWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Heading size="md" fontWeight="600">Placement Drive Eligibility</Heading>
          <Text fontSize="sm" color="whiteAlpha.800" mt={1}>Configure criteria and preview eligible students</Text>
        </ModalHeader>
        <ModalCloseButton color="white" top={5} right={4} _hover={{ bg: 'whiteAlpha.200' }} />
        <ModalBody pb={4} pt={4} px={5}>
          {loading ? (
            <Flex justify="center" align="center" py={16}><Spinner size="xl" color="teal.500" thickness="3px" /></Flex>
          ) : (
            <VStack align="stretch" spacing={5}>
              {/* Top Filter Bar */}
              <Box bg="white" p={4} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.200">
                <VStack align="stretch" spacing={3}>
                  <Heading size="sm" color="gray.800">Filters</Heading>
                  <Text fontSize="xs" color="gray.500">
                    Adjust search, toggles, and advanced filters, then click <b>Apply filters</b> to load or refresh data from the server (nothing refetches automatically).
                  </Text>
                  <Flex gap={4} align="center" flexWrap="wrap">
                    <InputGroup size="md" maxW="300px">
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="gray.50"
                      />
                    </InputGroup>

                    <HStack spacing={3}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">Only opted-in students</Text>
                      <Switch colorScheme="teal" isChecked={true} isReadOnly />
                    </HStack>

                    <Button
                      leftIcon={<SettingsIcon />}
                      rightIcon={<ChevronDownIcon />}
                      variant="solid"
                      bg="teal.500"
                      color="white"
                      _hover={{ bg: 'teal.600' }}
                      size="md"
                    >
                      Advanced Filters
                    </Button>

                    <Button
                      leftIcon={<RepeatIcon />}
                      colorScheme="teal"
                      variant="outline"
                      onClick={fetchStudents}
                      isLoading={studentsLoading}
                    >
                      Apply filters
                    </Button>

                    <Button variant="ghost" colorScheme="gray" size="sm" onClick={() => {
                      setEligibilityForm(initialEligibilityState);
                      setSearchTerm('');
                    }}>
                      Clear
                    </Button>
                  </Flex>
                </VStack>
              </Box>

              {/* Advanced Filters Sections */}
              <VStack align="stretch" spacing={4}>
                {/* 1. SCHOOL & PROGRAM */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="teal.50" px={4} py={2} borderLeft="4px solid" borderLeftColor="teal.400">
                    <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase">SCHOOL & PROGRAM</Text>
                  </Box>
                  <Flex gap={6} p={4} bg="white" flexWrap="wrap">
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Schools</Text>
                      <FilterMultiSelect
                        options={schoolList}
                        value={eligibilityForm.allowed_school_ids || []}
                        onChange={handleSchoolChange}
                        placeholder="Select schools"
                        getLabel={(s) => s.name || s.abbreviation}
                        colorScheme="teal"
                        isSimple
                      />
                    </VStack>
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Programs</Text>
                      <FilterMultiSelect
                        options={programList}
                        value={eligibilityForm.allowed_program_ids || []}
                        onChange={handleProgramChange}
                        placeholder="Select programs"
                        isDisabled={!eligibilityForm.allowed_school_ids?.length}
                        colorScheme="purple"
                        isSimple
                      />
                    </VStack>
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Specializations</Text>
                      <FilterMultiSelect
                        options={specializationList}
                        value={eligibilityForm.allowed_specialization_ids || []}
                        onChange={(vals) => setEligibilityForm((p) => ({ ...p, allowed_specialization_ids: vals }))}
                        placeholder="Click to select"
                        isDisabled={!eligibilityForm.allowed_program_ids?.length}
                        colorScheme="blue"
                        isSimple
                      />
                    </VStack>
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Majors</Text>
                      <FilterMultiSelect
                        options={majorList}
                        value={eligibilityForm.allowed_major_ids || []}
                        onChange={(vals) => setEligibilityForm((p) => ({ ...p, allowed_major_ids: vals }))}
                        placeholder="Click to select"
                        isDisabled={!eligibilityForm.allowed_program_ids?.length}
                        colorScheme="cyan"
                        isSimple
                      />
                    </VStack>
                  </Flex>
                </Box>

                {/* 2. ACADEMICS & YEARS */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="blue.50" px={4} py={2} borderLeft="4px solid" borderLeftColor="blue.400">
                    <Text fontSize="xs" fontWeight="bold" color="blue.800" textTransform="uppercase">ACADEMICS & YEARS</Text>
                  </Box>
                  <Flex gap={6} p={4} bg="white" flexWrap="wrap" align="center">
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Min CGPA</Text>
                      <Input type="number" step="0.01" placeholder="e.g. 7.5" value={eligibilityForm.min_cgpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, min_cgpa: e.target.value }))} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Max CGPA</Text>
                      <Input type="number" step="0.01" value={eligibilityForm.max_cgpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_cgpa: e.target.value }))} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Max Backlogs</Text>
                      <Input type="number" value={eligibilityForm.max_active_backlogs} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_active_backlogs: e.target.value }))} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Backlog Hist</Text>
                      <Input type="number" value={eligibilityForm.max_backlog_history} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_backlog_history: e.target.value }))} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Max Offers</Text>
                      <Input type="number" placeholder="e.g. 2" value={eligibilityForm.max_total_offers} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_total_offers: e.target.value }))} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Join Yrs</Text>
                      <Input placeholder="e.g. 2021,2" value={Array.isArray(eligibilityForm.joining_years) ? eligibilityForm.joining_years.join(',') : ''} onChange={(e) => setEligibilityForm((p) => ({ ...p, joining_years: e.target.value.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n)) }))} size="sm" w="120px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Grad Yrs</Text>
                      <Input placeholder="e.g. 2025,2" value={Array.isArray(eligibilityForm.graduation_years) ? eligibilityForm.graduation_years.join(',') : ''} onChange={(e) => setEligibilityForm((p) => ({ ...p, graduation_years: e.target.value.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n)) }))} size="sm" w="120px" h="32px" bg="gray.50" />
                    </HStack>
                  </Flex>
                </Box>

                {/* 3. CTC (LPA) */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="purple.50" px={4} py={2} borderLeft="4px solid" borderLeftColor="purple.400">
                    <Text fontSize="xs" fontWeight="bold" color="purple.800" textTransform="uppercase">CTC (LPA)</Text>
                  </Box>
                  <Flex gap={8} p={4} bg="white" flexWrap="wrap" align="center">
                    <HStack spacing={2}>
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">Max CTC</Text>
                        <Tooltip label="Block if current CTC above this" hasArrow><Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} /></Tooltip>
                      </HStack>
                      <Input type="number" step="0.5" placeholder="e.g. 8" value={eligibilityForm.max_existing_ctc_lpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_existing_ctc_lpa: e.target.value }))} size="sm" w="100px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">Min New CTC</Text>
                        <Tooltip label="New offer must be >= this" hasArrow><Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} /></Tooltip>
                      </HStack>
                      <Input type="number" step="0.5" placeholder="e.g. 30" value={eligibilityForm.min_new_ctc_lpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, min_new_ctc_lpa: e.target.value }))} size="sm" w="100px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">CTC Mult</Text>
                        <Tooltip label="New offer must be >= (Current Max CTC * Multiplier)" hasArrow><Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} /></Tooltip>
                      </HStack>
                      <Input type="number" step="0.1" placeholder="e.g. 1.5" value={eligibilityForm.min_ctc_multiplier} onChange={(e) => setEligibilityForm((p) => ({ ...p, min_ctc_multiplier: e.target.value }))} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                  </Flex>
                </Box>

                {/* 4. OPTIONS */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="gray.100" px={4} py={2} borderLeft="4px solid" borderLeftColor="gray.600">
                    <Text fontSize="xs" fontWeight="bold" color="gray.800" textTransform="uppercase">OPTIONS</Text>
                  </Box>
                  <Flex gap={6} p={4} bg="white" flexWrap="wrap">
                    <Checkbox size="sm" colorScheme="teal" isChecked={eligibilityForm.allow_already_placed} onChange={(e) => setEligibilityForm((p) => ({ ...p, allow_already_placed: e.target.checked }))}>
                      <Text fontSize="xs" fontWeight="600" color="gray.700">Exclude already placed (dream-offer filter)</Text>
                    </Checkbox>
                    <Checkbox size="sm" colorScheme="teal" isChecked={eligibilityForm.count_offcampus_offers} onChange={(e) => setEligibilityForm((p) => ({ ...p, count_offcampus_offers: e.target.checked }))}>
                      <Text fontSize="xs" fontWeight="600" color="gray.700">Count off-campus in max offers</Text>
                    </Checkbox>
                    <Checkbox size="sm" colorScheme="teal" isChecked={eligibilityForm.admin_override_allowed} onChange={(e) => setEligibilityForm((p) => ({ ...p, admin_override_allowed: e.target.checked }))}>
                      <Text fontSize="xs" fontWeight="600" color="gray.700">Eligibility Decision Logs (admin override)</Text>
                    </Checkbox>
                    <Checkbox size="sm" colorScheme="teal" isChecked={true} isReadOnly>
                      <Text fontSize="xs" fontWeight="600" color="gray.700">Placement Violations</Text>
                    </Checkbox>
                    <Checkbox size="sm" colorScheme="teal" isChecked={true} isReadOnly>
                      <Text fontSize="xs" fontWeight="600" color="gray.700">Disciplinary Records</Text>
                    </Checkbox>
                  </Flex>
                </Box>
              </VStack>

              {/* Preview Table Section */}
              <Box bg="white" p={4} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.200">
                <HStack mb={4} justify="space-between">
                  <Heading size="sm" color="gray.800" fontWeight="600">Preview: Eligible Students</Heading>
                  <Badge colorScheme="blue" variant="outline">{filteredStudents.length} Students Matching</Badge>
                </HStack>
                <Box maxH="320px" overflowY="auto" borderRadius="md" borderWidth="1px" borderColor="gray.100">
                  {studentsLoading ? (
                    <Flex justify="center" py={8}><Spinner size="md" color="teal.500" /></Flex>
                  ) : filteredStudents.length === 0 ? (
                    <Text color="gray.500" fontSize="sm" py={6} px={4} textAlign="center">No students match the current criteria.</Text>
                  ) : (
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                        <Tr>
                          <Th>USN</Th>
                          <Th>Name</Th>
                          <Th>Gender</Th>
                          <Th>Year/Sem</Th>
                          <Th>School/Program</Th>
                          <Th>CGPA</Th>
                          <Th>10th/12th %</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredStudents.slice(0, 100).map((s) => {
                          const isHighlighted = s.is_in_process; // In process but failed filter (since only those are shown if in process)
                          return (
                            <Tr key={s.usn} _hover={{ bg: isHighlighted ? 'red.100' : 'gray.50' }} bg={isHighlighted ? 'red.50' : 'transparent'}>
                              <Td fontWeight="500">
                                <HStack spacing={2}>
                                  {isHighlighted && <Tooltip label="Already in process but now INELIGIBLE"><Box as="span" color="red.500">⚠️</Box></Tooltip>}
                                  <Text color={isHighlighted ? 'red.700' : 'inherit'}>{s.usn}</Text>
                                </HStack>
                              </Td>
                              <Td color={isHighlighted ? 'red.700' : 'inherit'}>{s.full_name || s.name}</Td>
                              <Td color={isHighlighted ? 'red.700' : 'inherit'}>{s.gender || '-'}</Td>
                              <Td color={isHighlighted ? 'red.700' : 'inherit'}>{s.current_year || '-'}/{s.current_semester || '-'}</Td>
                              <Td>
                                <Text fontSize="xs" fontWeight="500" color={isHighlighted ? 'red.600' : 'inherit'}>{s.school || '-'}</Text>
                                <Text fontSize="xs" color={isHighlighted ? 'red.400' : 'gray.500'}>{s.program || '-'}</Text>
                              </Td>
                              <Td fontWeight="600" color={isHighlighted ? 'red.600' : 'teal.600'}>{s.latest_sgpa || s.cgpa || '-'}</Td>
                              <Td>
                                <Text fontSize="xs" color={isHighlighted ? 'red.600' : 'inherit'}>10: {s.percent_10th ? `${s.percent_10th}%` : '-'}</Text>
                                <Text fontSize="xs" color={isHighlighted ? 'red.600' : 'inherit'}>12: {s.percent_12th ? `${s.percent_12th}%` : '-'}</Text>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  )}
                  {!studentsLoading && filteredStudents.length > 100 && <Text fontSize="xs" color="gray.500" px={3} py={2} borderTopWidth="1px" borderColor="gray.100">Showing 100 of {filteredStudents.length} students</Text>}
                </Box>
              </Box>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter py={4} px={6} borderTopWidth="1px" borderColor="gray.200" bg="white" gap={3}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" onClick={saveEligibility} isLoading={loading} fontWeight="600">Save Eligibility</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DriveEligibilityModal;
