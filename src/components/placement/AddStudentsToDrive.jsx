import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  VStack,
  Badge,
  Avatar,
  InputGroup,
  InputLeftElement,
  Flex,
  Spinner,
  Checkbox,
  useToast,
  TableContainer,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Tooltip,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Switch,
  FormControl,
  FormLabel,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { QuestionIcon } from '@chakra-ui/icons';
import { MdFilterList, MdViewColumn } from 'react-icons/md';
import { PlacementService } from '../../services/placement.service';

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

/** Parse "1,2,3" or "1 2 3" into array of integers */
const parseIntList = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(/[\s,]+/).map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n));
};

const AddStudentsToDrive = ({ driveId, onCancel, onSuccess, embedded = false, existingUsns = [] }) => {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [onlyOptedIn, setOnlyOptedIn] = useState(false);

  // Filter lists (Schools, Programs, Specializations, Majors)
  const [schoolList, setSchoolList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [specializationList, setSpecializationList] = useState([]);
  const [majorList, setMajorList] = useState([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState([]);
  const [selectedMajorIds, setSelectedMajorIds] = useState([]);

  // Eligibility-style filters (same as placement drive eligibility)
  const [minCGPA, setMinCGPA] = useState('');
  const [maxCGPA, setMaxCGPA] = useState('');
  const [maxActiveBacklogs, setMaxActiveBacklogs] = useState('');
  const [maxBacklogHistory, setMaxBacklogHistory] = useState('');
  const [maxTotalOffers, setMaxTotalOffers] = useState('');
  const [joiningYears, setJoiningYears] = useState('');
  const [graduationYears, setGraduationYears] = useState('');
  const [maxExistingCtcLpa, setMaxExistingCtcLpa] = useState('');
  const [minNewCtcLpa, setMinNewCtcLpa] = useState('');
  const [minCtcMultiplier, setMinCtcMultiplier] = useState('');
  const [allowAlreadyPlaced, setAllowAlreadyPlaced] = useState(true);
  const [countOffcampusOffers, setCountOffcampusOffers] = useState(true);
  const [noDisciplinaryAction, setNoDisciplinaryAction] = useState(true);
  const [noActivePlacementViolation, setNoActivePlacementViolation] = useState(true);
  const [adminOverrideAllowed, setAdminOverrideAllowed] = useState(false);

  // Selection state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Column definitions (select is always visible)
  const baseColumns = [
    { id: 'select', label: 'Select', alwaysVisible: true },
    { id: 'name', label: 'Name' },
    { id: 'usn', label: 'USN' },
    { id: 'year_of_joining', label: 'Joining Year' },
    { id: 'graduation_year', label: 'Graduation Year' },
    { id: 'school', label: 'School' },
    { id: 'program', label: 'Program' },
    { id: 'specialization', label: 'Specialization' },
    { id: 'major', label: 'Majors' },
    { id: 'latest_sgpa', label: 'CGPA' },
    { id: 'live_backlogs', label: 'Current Backlogs' },
    { id: 'closed_backlogs', label: 'Cleared Backlogs' },
    { id: 'offers_count', label: 'No. of Offers' },
    { id: 'max_ctc_lpa', label: 'Prev Max CTC (LPA)' },
    { id: 'is_placed', label: 'Placed?' },
    { id: 'is_placed_off_campus', label: 'Off-Campus Placed?' },
    { id: 'disciplinary', label: 'Disciplinary Action?' },
    { id: 'placement_violations', label: 'Placement Violation?' },
    { id: 'admin_hold', label: 'Admin Override Hold?' },
    ...(driveId ? [{ id: 'eligibility', label: 'Eligible' }] : []),
  ];
  const selectableColumns = baseColumns.filter((c) => !c.alwaysVisible);
  const defaultVisibleIds = baseColumns.map((c) => c.id);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleIds);
  const baseColumnIds = baseColumns.map((c) => c.id);

  const handleColumnToggle = (columnId) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        const next = prev.filter((id) => id !== columnId);
        if (next.length <= 1) return prev;
        return next;
      }
      return [...prev, columnId];
    });
  };
  const handleSelectAllColumns = (checked) => {
    setVisibleColumns(checked ? baseColumnIds : ['select']);
  };

  const getLabelForColumn = (id) => {
    if (id === 'select') return '';
    const found = baseColumns.find(c => c.id === id);
    return found ? found.label : id;
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch schools for filter dropdowns
  useEffect(() => {
    PlacementService.getSchools().then((list) => setSchoolList(list || []));
  }, []);

  useEffect(() => {
    if (!selectedSchoolIds?.length) {
      setProgramList([]);
      return;
    }
    PlacementService.getPrograms().then((all) => {
      const filtered = (all || []).filter((p) => selectedSchoolIds.includes(p.school_id));
      setProgramList(filtered);
    }).catch(() => setProgramList([]));
  }, [JSON.stringify(selectedSchoolIds)]);

  useEffect(() => {
    if (!selectedProgramIds?.length) {
      setSpecializationList([]);
      setMajorList([]);
      return;
    }
    const progIds = selectedProgramIds;
    Promise.all([
      PlacementService.getSpecializations().then((all) => (all || []).filter((s) => progIds.includes(s.program_id))),
      PlacementService.getMajors().then((all) => (all || []).filter((m) => progIds.includes(m.program_id))),
    ]).then(([specs, majors]) => {
      setSpecializationList(specs);
      setMajorList(majors);
    }).catch(() => { setSpecializationList([]); setMajorList([]); });
  }, [JSON.stringify(selectedProgramIds)]);

  // Pre-fill filters from drive eligibility when available
  useEffect(() => {
    if (!driveId) return;
    PlacementService.getDriveEligibility(driveId).then((data) => {
      setEligibility(data);
      if (data) {
        if (data.min_cgpa != null) setMinCGPA(String(data.min_cgpa));
        if (data.max_cgpa != null) setMaxCGPA(String(data.max_cgpa));
        if (data.max_active_backlogs != null) setMaxActiveBacklogs(String(data.max_active_backlogs));
        if (data.max_backlog_history != null) setMaxBacklogHistory(String(data.max_backlog_history));
        if (data.max_total_offers != null) setMaxTotalOffers(String(data.max_total_offers));
        if (data.joining_years?.length) setJoiningYears(data.joining_years.join(','));
        if (data.graduation_years?.length) setGraduationYears(data.graduation_years.join(','));
        if (data.max_existing_ctc_lpa != null) setMaxExistingCtcLpa(String(data.max_existing_ctc_lpa));
        if (data.min_new_ctc_lpa != null) setMinNewCtcLpa(String(data.min_new_ctc_lpa));
        if (data.min_ctc_multiplier != null) setMinCtcMultiplier(String(data.min_ctc_multiplier));
        setAllowAlreadyPlaced(data.allow_already_placed !== false);
        setCountOffcampusOffers(data.count_offcampus_offers !== false);
        setNoDisciplinaryAction(data.no_disciplinary_action !== false);
        setNoActivePlacementViolation(data.no_active_placement_violation !== false);
        setAdminOverrideAllowed(data.admin_override_allowed === true);
        if (data.allowed_school_ids) {
          const sids = Array.isArray(data.allowed_school_ids) ? data.allowed_school_ids : 
                       typeof data.allowed_school_ids === 'string' ? data.allowed_school_ids.split(',').map(n => n.trim()).filter(Boolean).map(Number) : [];
          setSelectedSchoolIds(sids);
        }
        if (data.allowed_program_ids) {
          const pids = Array.isArray(data.allowed_program_ids) ? data.allowed_program_ids : 
                       typeof data.allowed_program_ids === 'string' ? data.allowed_program_ids.split(',').map(n => n.trim()).filter(Boolean).map(Number) : [];
          setSelectedProgramIds(pids);
        }
        if (data.allowed_specialization_ids) {
          const sids = Array.isArray(data.allowed_specialization_ids) ? data.allowed_specialization_ids : 
                       typeof data.allowed_specialization_ids === 'string' ? data.allowed_specialization_ids.split(',').map(n => n.trim()).filter(Boolean).map(Number) : [];
          setSelectedSpecializationIds(sids);
        }
        if (data.allowed_major_ids) {
          const mids = Array.isArray(data.allowed_major_ids) ? data.allowed_major_ids : 
                       typeof data.allowed_major_ids === 'string' ? data.allowed_major_ids.split(',').map(n => n.trim()).filter(Boolean).map(Number) : [];
          setSelectedMajorIds(mids);
        }
      }
    });
  }, [driveId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { limit: 10000 };
      if (driveId) params.drive_id = driveId;
      if (selectedSchoolIds?.length) params.school_ids = selectedSchoolIds;
      if (selectedProgramIds?.length) params.program_ids = selectedProgramIds;
      if (onlyOptedIn) params.opt_in_only = true;
      const data = await PlacementService.getAllStudents(params);
      setStudents(data);
    } catch (error) {
      const message = error?.message || "Failed to fetch students.";
      toast({
          title: "Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Refetch students when drive, opted-in toggle, or school/program filters change
  useEffect(() => {
    if (driveId) fetchStudents();
  }, [driveId, onlyOptedIn, JSON.stringify(selectedSchoolIds), JSON.stringify(selectedProgramIds)]);

  // Filter logic (client-side on top of API school/program filter)
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.usn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSchool = selectedSchoolIds.length === 0 || (student.school_id != null && selectedSchoolIds.map(Number).includes(Number(student.school_id)));
    const matchesProgram = selectedProgramIds.length === 0 || (student.program_id != null && selectedProgramIds.map(Number).includes(Number(student.program_id)));
    const matchesSpecialization = selectedSpecializationIds.length === 0 || (student.specialization_id != null && selectedSpecializationIds.map(Number).includes(Number(student.specialization_id)));
    const matchesMajor = selectedMajorIds.length === 0 || (student.major_id != null && selectedMajorIds.map(Number).includes(Number(student.major_id)));

    const studentCGPA = parseFloat(student.latest_sgpa ?? student.cgpa);
    const matchesMinCGPA = !minCGPA || (!Number.isNaN(studentCGPA) && studentCGPA >= parseFloat(minCGPA));
    const matchesMaxCGPA = !maxCGPA || (!Number.isNaN(studentCGPA) && studentCGPA <= parseFloat(maxCGPA));

    const studentLiveBL = parseInt(student.live_backlogs || 0, 10);
    const matchesMaxActiveBL = maxActiveBacklogs === '' ? true : studentLiveBL <= parseInt(maxActiveBacklogs, 10);

    const studentBacklogHist = parseInt(student.total_backlog_history ?? student.closed_backlogs ?? 0, 10);
    const matchesBacklogHist = maxBacklogHistory === '' ? true : studentBacklogHist <= parseInt(maxBacklogHistory, 10);

    const jyList = parseIntList(joiningYears);
    const studentJY = student.year_of_joining ? parseInt(student.year_of_joining, 10) : null;
    const matchesJoiningYears = jyList.length === 0 || (studentJY != null && jyList.includes(studentJY));

    const gyList = parseIntList(graduationYears);
    const studentGY = student.graduation_year ? parseInt(student.graduation_year, 10) : null;
    const matchesGraduationYears = gyList.length === 0 || (studentGY != null && gyList.includes(studentGY));

    const studentOffers = parseInt(student.offers_count || 0, 10);
    // Note: backend currently provides is_placed_off_campus as boolean, not a count. 
    // We treat is_placed_off_campus as 1 offer if true for this calculation.
    const offCampusCount = student.is_placed_off_campus ? 1 : 0;
    const totalOffers = countOffcampusOffers ? studentOffers : (studentOffers - offCampusCount);
    const matchesMaxOffers = maxTotalOffers === '' ? true : totalOffers <= parseInt(maxTotalOffers, 10);

    const studentMaxCtc = parseFloat(student.max_ctc_lpa || 0);
    const matchesMaxCtc = maxExistingCtcLpa === '' ? true : studentMaxCtc <= parseFloat(maxExistingCtcLpa);

    // If a drive is provided, we can check min new CTC and multiplier
    let matchesNewCtc = true;
    const mult = parseFloat(minCtcMultiplier);
    if (minNewCtcLpa !== '' && studentMaxCtc > 0) {
      const minRequired = studentMaxCtc * (Number.isNaN(mult) ? 1 : mult);
      matchesNewCtc = parseFloat(minNewCtcLpa) >= minRequired;
    }

    const matchesPlaced = allowAlreadyPlaced ? true : !student.is_placed;
    const matchesDisciplinary = noDisciplinaryAction ? !student.disciplinary : true;
    const matchesViolation = noActivePlacementViolation ? !student.placement_violations : true;
    const matchesAdminHold = adminOverrideAllowed ? true : !student.admin_hold;

    const isNotRegistered = !existingUsns.includes(student.usn);

    return (
      matchesSearch &&
      matchesSchool &&
      matchesProgram &&
      matchesSpecialization &&
      matchesMajor &&
      matchesMinCGPA &&
      matchesMaxCGPA &&
      matchesMaxActiveBL &&
      matchesBacklogHist &&
      matchesJoiningYears &&
      matchesGraduationYears &&
      matchesMaxOffers &&
      matchesMaxCtc &&
      matchesNewCtc &&
      matchesPlaced &&
      matchesDisciplinary &&
      matchesViolation &&
      matchesAdminHold &&
      isNotRegistered
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handleClearFilters = () => {
    setSearchQuery('');
    setOnlyOptedIn(false);
    setSelectedSchoolIds([]);
    setSelectedProgramIds([]);
    setSelectedSpecializationIds([]);
    setSelectedMajorIds([]);
    setMinCGPA('');
    setMaxCGPA('');
    setMaxActiveBacklogs('');
    setMaxBacklogHistory('');
    setMaxTotalOffers('');
    setJoiningYears('');
    setGraduationYears('');
    setMaxExistingCtcLpa('');
    setMinNewCtcLpa('');
    setMinCtcMultiplier('');
    setAllowAlreadyPlaced(true);
    setCountOffcampusOffers(true);
    setNoDisciplinaryAction(true);
    setNoActivePlacementViolation(true);
    setAdminOverrideAllowed(false);
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          // Select all visible students on current page or all filtered? 
          // Usually "Select All" applies to filtered list or just current page. 
          // Let's do current page for simplicity, or filtered list.
          // Let's do filtered list so they can bulk add everyone matching a filter.
          const allIds = filteredStudents.map(s => s.usn);
          setSelectedStudents(allIds);
      } else {
          setSelectedStudents([]);
      }
  };

  const handleSelectStudent = (usn) => {
      setSelectedStudents(prev => {
          if (prev.includes(usn)) {
              return prev.filter(id => id !== usn);
          } else {
              return [...prev, usn];
          }
      });
  };

  const handleAddStudents = async () => {
      if (selectedStudents.length === 0) return;

      setIsAdding(true);
      try {
          // Add students sequentially or in parallel?
          // Since we don't have a bulk endpoint confirmed, let's do parallel requests with a limit or just Promise.all if not too many.
          // If 100s of students, this might be bad. But typically it's smaller batches.
          
          let successCount = 0;
          let failCount = 0;
          const errorMessages = new Set();

          const promises = selectedStudents.map(async (usn) => {
              try {
                  await PlacementService.registerForDrive(usn, driveId);
                  successCount++;
              } catch (error) {
                  failCount++;
                  errorMessages.add(error?.message || `Failed to register ${usn}`);
              }
          });

          await Promise.all(promises);

          if (successCount > 0) {
              toast({
                  title: "Success",
                  description: `Successfully added ${successCount} students. ${failCount > 0 ? `${failCount} failed.` : ''}`,
                  status: "success",
                  duration: 3000,
                  isClosable: true
              });
              if (onSuccess) onSuccess();
          } else if (failCount > 0) {
              const errorMsg = Array.from(errorMessages).join(', ') || "They might already be registered.";
              toast({
                  title: "Error",
                  description: `Failed to add selected students. ${errorMsg}`,
                  status: "error",
                  duration: 3000,
                  isClosable: true
              });
          }

      } catch (error) {
          const message = error?.message || "Failed to add selected students.";
          toast({
              title: "Error",
              description: message,
              status: "error",
              duration: 5000,
              isClosable: true
          });
      } finally {
          setIsAdding(false);
      }
  };

  const handleSchoolChange = (vals) => {
    setSelectedSchoolIds(vals);
    setSelectedProgramIds([]);
    setSelectedSpecializationIds([]);
    setSelectedMajorIds([]);
  };

  const handleProgramChange = (vals) => {
    setSelectedProgramIds(vals);
    setSelectedSpecializationIds([]);
    setSelectedMajorIds([]);
  };

  return (
    <Box 
      bg={embedded ? "transparent" : "white"} 
      borderRadius={embedded ? "none" : "xl"} 
      shadow={embedded ? "none" : "sm"} 
      border={embedded ? "none" : "1px solid"} 
      borderColor={embedded ? "transparent" : "gray.200"} 
      p={embedded ? 0 : 5}
    >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
            <Box>
                <Heading size="md" color="gray.800">Add Students</Heading>
                <Text color="gray.500" fontSize="sm">Select students to add to this placement drive</Text>
            </Box>
            <HStack>
                 <Button onClick={onCancel} variant="ghost">Cancel</Button>
                 <Button 
                    colorScheme="blue" 
                    leftIcon={<AddIcon />} 
                    isLoading={isAdding}
                    loadingText="Adding..."
                    onClick={handleAddStudents}
                    isDisabled={selectedStudents.length === 0}
                >
                    Add Selected ({selectedStudents.length})
                </Button>
            </HStack>
        </Flex>

        {/* Filters: top bar + expandable Advanced Filters */}
        <Box
          bg="white"
          p={4}
          borderRadius="lg"
          mb={6}
          borderWidth="1px"
          borderColor="gray.200"
          borderLeftWidth="4px"
          borderLeftColor="teal.500"
          shadow="sm"
        >
          <Heading size="sm" mb={3} color="gray.800" fontWeight="600">Filters</Heading>

          {/* Always visible: Search, Only opted-in toggle, Advanced button, Clear */}
          <Flex gap={4} flexWrap="wrap" align="center" mb={showAdvancedFilters ? 4 : 0}>
            <InputGroup maxW="280px" size="sm" flex="1" minW="200px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="gray.50"
                borderColor="gray.200"
                _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)' }}
              />
            </InputGroup>

            <FormControl display="flex" alignItems="center" w="auto" flexShrink={0}>
              <FormLabel htmlFor="opted-in-toggle" mb="0" fontSize="sm" color="gray.700" whiteSpace="nowrap">
                Only opted-in students
              </FormLabel>
              <Switch
                id="opted-in-toggle"
                size="md"
                colorScheme="teal"
                isChecked={onlyOptedIn}
                onChange={(e) => setOnlyOptedIn(e.target.checked)}
              />
            </FormControl>

            <Button
              size="sm"
              variant={showAdvancedFilters ? 'solid' : 'outline'}
              colorScheme="teal"
              leftIcon={<Icon as={MdFilterList} />}
              rightIcon={showAdvancedFilters ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={() => setShowAdvancedFilters((v) => !v)}
            >
              Advanced Filters
            </Button>

            <Button size="sm" variant="ghost" colorScheme="gray" onClick={handleClearFilters}>
              Clear
            </Button>
          </Flex>

          {/* Expandable Advanced Filters */}
          {showAdvancedFilters && (
            <VStack align="stretch" spacing={4} pt={4} borderTopWidth="1px" borderColor="gray.200">
              {/* Row 1: Schools, Programs, Specializations, Majors */}
              <Box>
                <Box px={3} py={1.5} mb={3} borderRadius="md" bg="teal.50" borderLeftWidth="4px" borderLeftColor="teal.500">
                  <Text fontSize="sm" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider">
                    School & Program
                  </Text>
                </Box>
                <Flex gap={4} flexWrap="wrap" align="flex-end">
                  <FilterMultiSelect
                    label="Schools"
                    options={schoolList}
                    value={selectedSchoolIds}
                    onChange={handleSchoolChange}
                    placeholder="Select schools"
                    getLabel={(s) => s.name || s.abbreviation}
                    colorScheme="teal"
                  />
                  <FilterMultiSelect
                    label="Programs"
                    options={programList}
                    value={selectedProgramIds}
                    onChange={handleProgramChange}
                    placeholder="Select programs"
                    isDisabled={!selectedSchoolIds?.length}
                    colorScheme="purple"
                  />
                  <FilterMultiSelect
                    label="Specializations"
                    options={specializationList}
                    value={selectedSpecializationIds}
                    onChange={setSelectedSpecializationIds}
                    placeholder="Click to select"
                    isDisabled={!selectedProgramIds?.length}
                    colorScheme="blue"
                  />
                  <FilterMultiSelect
                    label="Majors"
                    options={majorList}
                    value={selectedMajorIds}
                    onChange={setSelectedMajorIds}
                    placeholder="Click to select"
                    isDisabled={!selectedProgramIds?.length}
                    colorScheme="cyan"
                  />
                </Flex>
              </Box>

              {/* Row 2: Academic */}
              <Box>
                <Box px={3} py={1.5} mb={3} borderRadius="md" bg="blue.50" borderLeftWidth="4px" borderLeftColor="blue.500">
                  <Text fontSize="sm" fontWeight="bold" color="blue.800" textTransform="uppercase" letterSpacing="wider">
                    Academics & Years
                  </Text>
                </Box>
                <Flex gap={4} flexWrap="wrap" align="center">
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Min CGPA</Text>
                    <Input type="number" step="0.01" placeholder="7.5" value={minCGPA} onChange={(e) => setMinCGPA(e.target.value)} size="sm" w="72px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Max CGPA</Text>
                    <Input type="number" step="0.01" value={maxCGPA} onChange={(e) => setMaxCGPA(e.target.value)} size="sm" w="72px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Max Backlogs</Text>
                    <Input type="number" value={maxActiveBacklogs} onChange={(e) => setMaxActiveBacklogs(e.target.value)} size="sm" w="56px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Backlog Hist</Text>
                    <Input type="number" value={maxBacklogHistory} onChange={(e) => setMaxBacklogHistory(e.target.value)} size="sm" w="56px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Max Offers</Text>
                    <Input type="number" placeholder="2" value={maxTotalOffers} onChange={(e) => setMaxTotalOffers(e.target.value)} size="sm" w="56px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Join Yrs</Text>
                    <Input placeholder="2021,2022" value={joiningYears} onChange={(e) => setJoiningYears(e.target.value)} size="sm" w="100px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Grad Yrs</Text>
                    <Input placeholder="2025,2026" value={graduationYears} onChange={(e) => setGraduationYears(e.target.value)} size="sm" w="100px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                </Flex>
              </Box>

              {/* Row 3: CTC */}
              <Box>
                <Box px={3} py={1.5} mb={3} borderRadius="md" bg="purple.50" borderLeftWidth="4px" borderLeftColor="purple.500">
                  <Text fontSize="sm" fontWeight="bold" color="purple.800" textTransform="uppercase" letterSpacing="wider">
                    CTC (LPA)
                  </Text>
                </Box>
                <Flex gap={4} flexWrap="wrap" align="center">
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Max CTC</Text>
                    <Tooltip label="Block if current CTC above this" hasArrow>
                      <Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={4} />
                    </Tooltip>
                    <Input type="number" step="0.5" placeholder="8" value={maxExistingCtcLpa} onChange={(e) => setMaxExistingCtcLpa(e.target.value)} size="sm" w="64px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">Min New CTC</Text>
                    <Tooltip label="New offer must be ≥ this" hasArrow>
                      <Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={4} />
                    </Tooltip>
                    <Input type="number" step="0.5" placeholder="30" value={minNewCtcLpa} onChange={(e) => setMinNewCtcLpa(e.target.value)} size="sm" w="64px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" fontWeight="500" color="gray.600" whiteSpace="nowrap">CTC Mult</Text>
                    <Tooltip label="New CTC ≥ current × this" hasArrow>
                      <Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={4} />
                    </Tooltip>
                    <Input type="number" step="0.1" placeholder="1.5" value={minCtcMultiplier} onChange={(e) => setMinCtcMultiplier(e.target.value)} size="sm" w="64px" bg="gray.50" borderColor="gray.200" />
                  </HStack>
                </Flex>
              </Box>

              {/* Row 4: Checkboxes */}
              <Box>
                <Box px={3} py={1.5} mb={3} borderRadius="md" bg="gray.100" borderLeftWidth="4px" borderLeftColor="gray.600">
                  <Text fontSize="sm" fontWeight="bold" color="gray.800" textTransform="uppercase" letterSpacing="wider">
                    Options
                  </Text>
                </Box>
                <Flex gap={6} flexWrap="wrap" align="center">
                  <Checkbox size="sm" isChecked={allowAlreadyPlaced} onChange={(e) => setAllowAlreadyPlaced(e.target.checked)} colorScheme="teal">Allow Already Placed</Checkbox>
                  <Checkbox size="sm" isChecked={countOffcampusOffers} onChange={(e) => setCountOffcampusOffers(e.target.checked)} colorScheme="teal">Count Off-Campus</Checkbox>
                  <Checkbox size="sm" isChecked={noDisciplinaryAction} onChange={(e) => setNoDisciplinaryAction(e.target.checked)} colorScheme="teal">No Disciplinary Action</Checkbox>
                  <Checkbox size="sm" isChecked={noActivePlacementViolation} onChange={(e) => setNoActivePlacementViolation(e.target.checked)} colorScheme="teal">No Placement Violation</Checkbox>
                  <Checkbox size="sm" isChecked={adminOverrideAllowed} onChange={(e) => setAdminOverrideAllowed(e.target.checked)} colorScheme="teal">Admin Override</Checkbox>
                </Flex>
              </Box>
            </VStack>
          )}
        </Box>

        {/* Table toolbar: column selector */}
        <Flex align="center" justify="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Text fontSize="sm" fontWeight="600" color="gray.700">Students</Text>
          <Popover placement="bottom-end" isLazy>
            <PopoverTrigger>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Icon as={MdViewColumn} />}
                colorScheme="teal"
                aria-label="Select columns"
              >
                Columns ({visibleColumns.filter((id) => id !== 'select').length})
              </Button>
            </PopoverTrigger>
            <PopoverContent w="280px" _focus={{ outline: 'none' }}>
              <PopoverBody p={3}>
                <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">Select columns to display</Text>
                <Checkbox
                  size="sm"
                  mb={2}
                  isChecked={visibleColumns.length === baseColumnIds.length}
                  isIndeterminate={visibleColumns.length > 1 && visibleColumns.length < baseColumnIds.length}
                  onChange={(e) => handleSelectAllColumns(e.target.checked)}
                  colorScheme="teal"
                >
                  Select All
                </Checkbox>
                <VStack align="stretch" spacing={0} maxH="280px" overflowY="auto">
                  {selectableColumns.map((col) => (
                    <Checkbox
                      key={col.id}
                      size="sm"
                      isChecked={visibleColumns.includes(col.id)}
                      onChange={() => handleColumnToggle(col.id)}
                      py={1.5}
                      px={2}
                      _hover={{ bg: 'gray.50' }}
                      borderRadius="md"
                      colorScheme="teal"
                    >
                      {col.label}
                    </Checkbox>
                  ))}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>

        {/* Table */}
        <TableContainer overflowX="auto" maxW="100%">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                   <Th w="50px">
                       <Checkbox 
                            isChecked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                            isIndeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                            onChange={handleSelectAll}
                       />
                   </Th>
                  {visibleColumns.filter(id => id !== 'select').map(columnId => (
                    <Th key={columnId} whiteSpace="nowrap">
                      {getLabelForColumn(columnId)}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={visibleColumns.length + 1} textAlign="center" py={10}>
                      <Spinner size="md" color="blue.500" />
                      <Text mt={2} color="gray.500">Loading students...</Text>
                    </Td>
                  </Tr>
                ) : currentStudents.length === 0 ? (
                  <Tr>
                    <Td colSpan={visibleColumns.length + 1} textAlign="center" py={10}>
                      <Text color="gray.500">No students found matching your criteria</Text>
                    </Td>
                  </Tr>
                ) : (
                  currentStudents.map((student, index) => (
                    <Tr 
                      key={student.usn} 
                      _hover={{ bg: 'gray.50' }}
                    >
                      <Td>
                          <Checkbox 
                                isChecked={selectedStudents.includes(student.usn)}
                                onChange={() => handleSelectStudent(student.usn)}
                          />
                      </Td>
                      {visibleColumns.includes('name') && (
                        <Td>
                          <Flex align="center">
                            <Avatar size="xs" name={student.name} src={student.avatar} mr={2} />
                            <Text fontWeight="600" color="gray.700" fontSize="sm">{student.name}</Text>
                          </Flex>
                        </Td>
                      )}
                      {visibleColumns.includes('usn') && (
                        <Td>
                          <Badge colorScheme="blue" fontSize="xs" variant="subtle">{student.usn}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('year_of_joining') && <Td fontSize="sm" color="gray.600">{student.year_of_joining ?? '-'}</Td>}
                      {visibleColumns.includes('graduation_year') && <Td fontSize="sm" color="gray.600">{student.graduation_year ?? '-'}</Td>}
                      {visibleColumns.includes('school') && <Td fontSize="sm" color="gray.600">{student.school || '-'}</Td>}
                      {visibleColumns.includes('program') && <Td fontSize="sm" color="gray.600">{student.program || '-'}</Td>}
                      {visibleColumns.includes('specialization') && <Td fontSize="sm" color="gray.600">{student.specialization || '-'}</Td>}
                      {visibleColumns.includes('major') && <Td fontSize="sm" color="gray.600">{student.major || '-'}</Td>}
                      {visibleColumns.includes('latest_sgpa') && <Td fontSize="sm" fontWeight="bold">{student.latest_sgpa ?? '-'}</Td>}
                      {visibleColumns.includes('live_backlogs') && <Td fontSize="sm" color={(student.live_backlogs ?? 0) > 0 ? "red.500" : "green.500"}>{student.live_backlogs !== null && student.live_backlogs !== undefined ? student.live_backlogs : '-'}</Td>}
                      {visibleColumns.includes('closed_backlogs') && <Td fontSize="sm">{student.closed_backlogs !== null && student.closed_backlogs !== undefined ? student.closed_backlogs : '-'}</Td>}
                      {visibleColumns.includes('offers_count') && <Td fontSize="sm" color="gray.600">{student.offers_count ?? '-'}</Td>}
                      {visibleColumns.includes('max_ctc_lpa') && <Td fontSize="sm" color="gray.600">{student.max_ctc_lpa != null ? student.max_ctc_lpa : '-'}</Td>}
                      {visibleColumns.includes('is_placed') && (
                        <Td fontSize="sm">
                          <Badge colorScheme={student.is_placed ? 'green' : 'gray'} size="sm">{student.is_placed ? 'Yes' : 'No'}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('is_placed_off_campus') && (
                        <Td fontSize="sm">
                          <Badge colorScheme={student.is_placed_off_campus ? 'orange' : 'gray'} size="sm">{student.is_placed_off_campus ? 'Yes' : 'No'}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('disciplinary') && (
                        <Td fontSize="sm">
                          <Badge colorScheme={(student.disciplinary ?? 0) > 0 ? 'red' : 'gray'} size="sm">{(student.disciplinary ?? 0) > 0 ? 'Yes' : 'No'}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('placement_violations') && (
                        <Td fontSize="sm">
                          <Badge colorScheme={(student.placement_violations ?? 0) > 0 ? 'red' : 'gray'} size="sm">{(student.placement_violations ?? 0) > 0 ? 'Yes' : 'No'}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('admin_hold') && (
                        <Td fontSize="sm">
                          <Badge colorScheme={student.admin_hold ? 'orange' : 'gray'} size="sm">{student.admin_hold ? 'Yes' : 'No'}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('eligibility') && (
                        <Td>
                          {student.is_eligible === false ? (
                            <Badge colorScheme="red" fontSize="xs" title={student.rejection_reasons?.join('; ')}>Ineligible</Badge>
                          ) : student.is_eligible === true ? (
                            <Badge colorScheme="green" fontSize="xs">Eligible</Badge>
                          ) : (
                            <Text fontSize="xs" color="gray.400">—</Text>
                          )}
                        </Td>
                      )}
                      
                      {/* Dynamic Columns Rendering */}
                      {visibleColumns.filter(id => !baseColumnIds.includes(id)).map(id => {
                         let value = '-';
                         switch (id) {
                            case 'gender': value = student.gender || '-'; break;
                            case 'date_of_birth': value = student.date_of_birth || '-'; break;
                            case 'blood_group': value = student.blood_group || '-'; break;
                            case 'marital_status': value = student.marital_status || '-'; break;
                            case 'specially_abled': value = typeof student.specially_abled === 'boolean' ? (student.specially_abled ? 'Yes' : 'No') : '-'; break;
                            case 'languages': value = student.languages || '-'; break;
                            case 'year_of_joining': value = student.year_of_joining || '-'; break;
                            case 'major': value = student.major || '-'; break;
                            case 'minor': value = student.minor || '-'; break;
                            case 'profile_image': value = student.profile_image ? 'Available' : '-'; break;
                            
                            // Communication
                            case 'college_email': value = student.college_email || '-'; break;
                            case 'personal_email': value = student.email || '-'; break;
                            case 'phone': value = student.phone_number || student.contact || '-'; break;
                            case 'links': value = student.links ? 'Available' : '-'; break;

                            // Academics
                            case 'latest_academic_year': value = student.latest_academic_year || '-'; break;
                            case 'latest_semester': value = student.latest_semester || '-'; break;
                            case 'latest_sgpa': value = student.latest_sgpa || '-'; break;
                            case 'closed_backlogs': value = student.closed_backlogs ?? '-'; break;
                            case 'live_backlogs': value = student.live_backlogs ?? '-'; break;

                            // Education
                            case 'highest_education_level': value = student.highest_education_level || '-'; break;
                            case 'latest_institute': value = student.latest_institute || '-'; break;
                            case 'latest_year_of_passing': value = student.latest_year_of_passing || '-'; break;
                            case 'latest_result': value = student.latest_result || '-'; break;

                            // Others
                            case 'projects_count': value = student.projects_count || 0; break;
                            case 'internships_count': value = student.internships_count || 0; break;
                            case 'trainings_count': value = student.trainings_count || 0; break;
                            case 'certifications_count': value = student.certifications_count || 0; break;
                            case 'publications_count': value = student.publications_count || 0; break;
                            
                            default: 
                                value = student[id] || '-';
                         }
                         return <Td key={id} fontSize="sm" color="gray.600">{value}</Td>;
                      })}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
            <Flex justify="space-between" align="center" mt={4}>
              <Text fontSize="sm" color="gray.500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
              </Text>
              <HStack>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
        )}

    </Box>
  );
};

export default AddStudentsToDrive;
