import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  HStack,
  Badge,
  InputGroup,
  InputLeftElement,
  Flex,
  Checkbox,
  useToast,
  FormControl,
  FormLabel,
  Switch,
  VStack,
  Collapse,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, QuestionIcon, SettingsIcon } from '@chakra-ui/icons';
import { PlacementService } from '../../services/placement.service';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import VirtualizedStudentTable from './VirtualizedStudentTable';

const PAGE_SIZE = 50;

/** Multi-select filter: click to open, shows selected options as tags */
const FilterMultiSelect = ({ options, value = [], onChange, placeholder = 'Select...', isDisabled, colorScheme = 'teal', getLabel = (o) => o?.name || o?.abbreviation || String(o) }) => {
  const selected = options.filter((o) => value.includes(o.id));
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };
  const remove = (id) => onChange(value.filter((v) => v !== id));
  return (
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
  );
};

const AddStudentsToDrive = ({ driveId, onCancel, onSuccess, embedded = false, existingUsns = [] }) => {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetchedStudents, setHasFetchedStudents] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const existingUsnsSet = useMemo(
    () => new Set((existingUsns || []).filter(Boolean)),
    [existingUsns]
  );
  const alreadyInDriveCount = existingUsnsSet.size;

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
  const [maxActiveBacklogs, setMaxActiveBacklogs] = useState('');
  const [maxBacklogHistory, setMaxBacklogHistory] = useState('');
  const [maxTotalOffers, setMaxTotalOffers] = useState('');
  const [joiningYears, setJoiningYears] = useState('');
  const [graduationYears, setGraduationYears] = useState('');
  const [maxExistingCtcLpa, setMaxExistingCtcLpa] = useState('');
  const [minNewCtcLpa, setMinNewCtcLpa] = useState('');
  const [minCtcMultiplier, setMinCtcMultiplier] = useState('');
  /** When drive allows it, send admin_override on register so ineligible students can be added. */
  const [useAdminOverride, setUseAdminOverride] = useState(false);

  // Selection state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGenerationRef = useRef(0);
  const abortRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 500);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        debouncedSearch,
        selectedSchoolIds,
        selectedProgramIds,
        selectedSpecializationIds,
        selectedMajorIds,
        minCGPA,
        maxActiveBacklogs,
        maxBacklogHistory,
        joiningYears,
        graduationYears,
      }),
    [
      debouncedSearch,
      selectedSchoolIds,
      selectedProgramIds,
      selectedSpecializationIds,
      selectedMajorIds,
      minCGPA,
      maxActiveBacklogs,
      maxBacklogHistory,
      joiningYears,
      graduationYears,
    ]
  );

  // Fetch meta-data for filters
  useEffect(() => {
    let cancelled = false;
    PlacementService.getSchools().then((list) => {
      if (!cancelled) setSchoolList(list || []);
    });
    return () => { cancelled = true; };
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

  const buildListParams = useCallback(
    (page, pageSize = PAGE_SIZE, bustCache = false) => {
      const params = {
        page,
        page_size: pageSize,
        drive_id: driveId,
        opt_in_only: true,
        exclude_placement_violations: true,
        exclude_disciplinary_records: true,
      };
      if (bustCache) params._bustCache = true;
      if (debouncedSearch?.trim()) params.search = debouncedSearch.trim();
      if (selectedSchoolIds?.length) params.school_ids = selectedSchoolIds.join(',');
      if (selectedProgramIds?.length) params.program_ids = selectedProgramIds.join(',');
      if (selectedSpecializationIds?.length) params.specialization_ids = selectedSpecializationIds.join(',');
      if (selectedMajorIds?.length) params.major_ids = selectedMajorIds.join(',');
      if (minCGPA) params.min_cgpa = minCGPA;
      if (maxActiveBacklogs) params.max_backlogs = maxActiveBacklogs;
      if (maxBacklogHistory) params.max_backlog_history = maxBacklogHistory;
      if (joiningYears?.trim()) params.joining_years = joiningYears.trim();
      if (graduationYears?.trim()) params.graduation_years = graduationYears.trim();
      return params;
    },
    [
      driveId,
      debouncedSearch,
      selectedSchoolIds,
      selectedProgramIds,
      selectedSpecializationIds,
      selectedMajorIds,
      minCGPA,
      maxActiveBacklogs,
      maxBacklogHistory,
      joiningYears,
      graduationYears,
    ]
  );

  const fetchStudents = useCallback(
    async ({ page = 1, bustCache = false } = {}) => {
      if (!driveId) return;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      const ac = new AbortController();
      abortRef.current = ac;
      const generation = ++fetchGenerationRef.current;

      try {
        setLoading(true);
        const params = buildListParams(page, PAGE_SIZE, bustCache);

        const data = await PlacementService.getAllStudents(params, { signal: ac.signal });
        if (generation !== fetchGenerationRef.current || ac.signal.aborted || data == null) return;

        setStudents(data.students ?? []);
        setTotalCount(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setCurrentPage(data.page ?? page);
        setHasFetchedStudents(true);
      } catch (error) {
        if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR' || ac.signal.aborted) return;
        if (generation !== fetchGenerationRef.current) return;
        toast({
          title: 'Error',
          description: error?.message || 'Failed to fetch students.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
        }
      }
    },
    [driveId, buildListParams, toast]
  );

  const goToPage = useCallback((page) => {
    const p = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(p);
    fetchStudents({ page: p });
  }, [fetchStudents, totalPages]);

  useEffect(() => {
    setStudents([]);
    setHasFetchedStudents(false);
    setSelectedStudents([]);
    setTotalCount(0);
    setTotalPages(1);
    setCurrentPage(1);
    initialLoadDoneRef.current = false;
    if (!driveId) {
      setEligibility(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const data = await PlacementService.getDriveEligibility(driveId);
      if (cancelled) return;
      setEligibility(data);
      if (data) {
        if (data.min_cgpa) setMinCGPA(String(data.min_cgpa));
        if (data.max_active_backlogs) setMaxActiveBacklogs(String(data.max_active_backlogs));
        if (data.max_backlog_history) setMaxBacklogHistory(String(data.max_backlog_history));
        if (data.max_total_offers) setMaxTotalOffers(String(data.max_total_offers));
        if (data.joining_years) {
          setJoiningYears(Array.isArray(data.joining_years) ? data.joining_years.join(',') : String(data.joining_years));
        }
        if (data.graduation_years) {
          setGraduationYears(Array.isArray(data.graduation_years) ? data.graduation_years.join(',') : String(data.graduation_years));
        }
        if (data.max_existing_ctc_lpa) setMaxExistingCtcLpa(String(data.max_existing_ctc_lpa));
        if (data.min_new_ctc_lpa) setMinNewCtcLpa(String(data.min_new_ctc_lpa));
        if (data.min_ctc_multiplier) setMinCtcMultiplier(String(data.min_ctc_multiplier));
        if (Array.isArray(data.allowed_school_ids) && data.allowed_school_ids.length > 0) {
          setSelectedSchoolIds(data.allowed_school_ids);
        }
        if (Array.isArray(data.allowed_program_ids) && data.allowed_program_ids.length > 0) {
          setSelectedProgramIds(data.allowed_program_ids);
        }
        if (Array.isArray(data.allowed_specialization_ids) && data.allowed_specialization_ids.length > 0) {
          setSelectedSpecializationIds(data.allowed_specialization_ids);
        }
        if (Array.isArray(data.allowed_major_ids) && data.allowed_major_ids.length > 0) {
          setSelectedMajorIds(data.allowed_major_ids);
        }
      }
      await fetchStudents({ page: 1, bustCache: true });
      if (!cancelled) initialLoadDoneRef.current = true;
    })();
    return () => {
      cancelled = true;
      fetchGenerationRef.current += 1;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [driveId, fetchStudents]);

  useEffect(() => {
    if (!driveId || !initialLoadDoneRef.current) return;
    setCurrentPage(1);
    fetchStudents({ page: 1, bustCache: true });
  }, [filterKey, driveId, fetchStudents]);

  const handleClearFilters = () => {
    setSearchQuery('');
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
    setCurrentPage(1);
    fetchStudents({ page: 1, bustCache: true });
  };

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  const selectableOnPage = useMemo(
    () => students.filter((s) => !existingUsnsSet.has(s.usn)),
    [students, existingUsnsSet]
  );

  const indexOfFirstItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const indexOfLastItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStudents((prev) => {
        const onPage = selectableOnPage.map((s) => s.usn);
        return [...new Set([...prev, ...onPage])];
      });
    } else {
      setSelectedStudents((prev) => {
        const onPageSet = new Set(selectableOnPage.map((s) => s.usn));
        return prev.filter((usn) => !onPageSet.has(usn));
      });
    }
  };

  const handleSelectAllOnPage = () => {
    if (selectableOnPage.length === 0) return;
    handleSelectAll(true);
  };

  const handleSelectAllMatching = async () => {
    if (!driveId || totalCount === 0 || isSelectingAll) return;
    setIsSelectingAll(true);
    try {
      const usns = new Set();
      let page = 1;
      let pages = 1;
      do {
        const data = await PlacementService.getAllStudents(buildListParams(page, 100));
        (data?.students ?? []).forEach((s) => {
          if (s?.usn && !existingUsnsSet.has(s.usn)) usns.add(s.usn);
        });
        pages = data?.totalPages ?? 1;
        page += 1;
      } while (page <= pages);

      setSelectedStudents([...usns]);
      toast({
        title: 'Selection updated',
        description: `Selected ${usns.size.toLocaleString()} student${usns.size === 1 ? '' : 's'} matching current filters.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Could not select all',
        description: error?.message || 'Failed to load all matching students.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSelectingAll(false);
    }
  };

  const handleClearSelection = () => setSelectedStudents([]);

  const allOnPageSelected =
    selectableOnPage.length > 0
    && selectableOnPage.every((s) => selectedStudents.includes(s.usn));
  const someOnPageSelected =
    selectableOnPage.some((s) => selectedStudents.includes(s.usn)) && !allOnPageSelected;

  const handleSelectStudent = (usn) => {
      if (existingUsnsSet.has(usn)) return;
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
                  await PlacementService.registerForDrive(usn, driveId, {
                    admin_override: eligibility?.admin_override_allowed === true && useAdminOverride,
                  });
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
            <HStack flexWrap="wrap" spacing={3} justify="flex-end">
                {eligibility?.admin_override_allowed === true && (
                  <FormControl display="flex" alignItems="center" w="auto">
                    <FormLabel htmlFor="admin-override-add" mb="0" fontSize="sm" color="gray.700" whiteSpace="nowrap">
                      Allow ineligible (admin override)
                    </FormLabel>
                    <Switch
                      id="admin-override-add"
                      size="md"
                      colorScheme="orange"
                      isChecked={useAdminOverride}
                      onChange={(e) => setUseAdminOverride(e.target.checked)}
                    />
                  </FormControl>
                )}
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

        {/* Filters */}
        <Box
          mb={6}
          bg="white"
          p={4}
          borderRadius="xl"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          borderLeftWidth="4px"
          borderLeftColor="teal.400"
        >
          <VStack align="stretch" spacing={3}>
            <Heading size="sm" color="gray.800">Filters</Heading>
            <Text fontSize="xs" color="gray.500">
              Only opted-in students are shown ({PAGE_SIZE} per page). Search and filters run on the server; the count matches all matching students.
            </Text>
            <Flex gap={4} align="center" flexWrap="wrap">
              <InputGroup size="md" maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="gray.50"
                />
              </InputGroup>

              <Button
                leftIcon={<SettingsIcon />}
                rightIcon={showAdvancedFilters ? <ChevronUpIcon /> : <ChevronDownIcon />}
                variant="solid"
                bg="teal.500"
                color="white"
                _hover={{ bg: 'teal.600' }}
                size="md"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Advanced Filters
              </Button>

              <Button variant="ghost" colorScheme="gray" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            </Flex>

            <Collapse in={showAdvancedFilters} animateOpacity>
              <VStack align="stretch" spacing={4} pt={2}>
                {/* SCHOOL & PROGRAM */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="teal.50" px={4} py={2} borderLeft="4px solid" borderLeftColor="teal.400">
                    <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase">SCHOOL & PROGRAM</Text>
                  </Box>
                  <Flex gap={6} p={4} bg="white" flexWrap="wrap">
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Schools</Text>
                      <FilterMultiSelect
                        options={schoolList}
                        value={selectedSchoolIds}
                        onChange={handleSchoolChange}
                        placeholder="Select schools"
                        getLabel={(s) => s.name || s.abbreviation}
                        colorScheme="teal"
                      />
                    </VStack>
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Programs</Text>
                      <FilterMultiSelect
                        options={programList}
                        value={selectedProgramIds}
                        onChange={handleProgramChange}
                        placeholder="Select programs"
                        isDisabled={!selectedSchoolIds.length}
                        colorScheme="purple"
                      />
                    </VStack>
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Specializations</Text>
                      <FilterMultiSelect
                        options={specializationList}
                        value={selectedSpecializationIds}
                        onChange={setSelectedSpecializationIds}
                        placeholder="Click to select"
                        isDisabled={!selectedProgramIds.length}
                        colorScheme="blue"
                      />
                    </VStack>
                    <VStack align="start" spacing={1} flex="1" minW="200px">
                      <Text fontSize="xs" fontWeight="700" color="gray.600">Majors</Text>
                      <FilterMultiSelect
                        options={majorList}
                        value={selectedMajorIds}
                        onChange={setSelectedMajorIds}
                        placeholder="Click to select"
                        isDisabled={!selectedProgramIds.length}
                        colorScheme="cyan"
                      />
                    </VStack>
                  </Flex>
                </Box>

                {/* ACADEMICS & YEARS */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="blue.50" px={4} py={2} borderLeft="4px solid" borderLeftColor="blue.400">
                    <Text fontSize="xs" fontWeight="bold" color="blue.800" textTransform="uppercase">ACADEMICS & YEARS</Text>
                  </Box>
                  <Flex gap={6} p={4} bg="white" flexWrap="wrap" align="center">
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Min CGPA</Text>
                      <Input type="number" step="0.01" placeholder="e.g. 7.5" value={minCGPA} onChange={(e) => setMinCGPA(e.target.value)} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Max Backlogs</Text>
                      <Input type="number" value={maxActiveBacklogs} onChange={(e) => setMaxActiveBacklogs(e.target.value)} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Backlog Hist</Text>
                      <Input type="number" value={maxBacklogHistory} onChange={(e) => setMaxBacklogHistory(e.target.value)} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Max Offers</Text>
                      <Input type="number" placeholder="e.g. 2" value={maxTotalOffers} onChange={(e) => setMaxTotalOffers(e.target.value)} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Join Yrs</Text>
                      <Input placeholder="e.g. 2021,2" value={joiningYears} onChange={(e) => setJoiningYears(e.target.value)} size="sm" w="120px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" whiteSpace="nowrap">Grad Yrs</Text>
                      <Input placeholder="e.g. 2025,2" value={graduationYears} onChange={(e) => setGraduationYears(e.target.value)} size="sm" w="120px" h="32px" bg="gray.50" />
                    </HStack>
                  </Flex>
                </Box>

                {/* CTC (LPA) */}
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Box bg="purple.50" px={4} py={2} borderLeft="4px solid" borderLeftColor="purple.400">
                    <Text fontSize="xs" fontWeight="bold" color="purple.800" textTransform="uppercase">CTC (LPA)</Text>
                  </Box>
                  <Flex gap={8} p={4} bg="white" flexWrap="wrap" align="center">
                    <HStack spacing={2}>
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">Max CTC</Text>
                        <Tooltip label="Block if current CTC above this" hasArrow>
                          <Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} />
                        </Tooltip>
                      </HStack>
                      <Input type="number" step="0.5" placeholder="e.g. 8" value={maxExistingCtcLpa} onChange={(e) => setMaxExistingCtcLpa(e.target.value)} size="sm" w="100px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">Min New CTC</Text>
                        <Tooltip label="New offer must be >= this" hasArrow>
                          <Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} />
                        </Tooltip>
                      </HStack>
                      <Input type="number" step="0.5" placeholder="e.g. 30" value={minNewCtcLpa} onChange={(e) => setMinNewCtcLpa(e.target.value)} size="sm" w="100px" h="32px" bg="gray.50" />
                    </HStack>
                    <HStack spacing={2}>
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">CTC Mult</Text>
                        <Tooltip label="New offer must be >= (Current Max CTC × Multiplier)" hasArrow>
                          <Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} />
                        </Tooltip>
                      </HStack>
                      <Input type="number" step="0.1" placeholder="e.g. 1.5" value={minCtcMultiplier} onChange={(e) => setMinCtcMultiplier(e.target.value)} size="sm" w="80px" h="32px" bg="gray.50" />
                    </HStack>
                  </Flex>
                </Box>
              </VStack>
            </Collapse>
          </VStack>
        </Box>

        {/* Table toolbar */}
        <Flex align="center" justify="space-between" mb={3} flexWrap="wrap" gap={2}>
          <HStack spacing={2} align="center" flexWrap="wrap">
            <Text fontSize="sm" fontWeight="600" color="gray.700">Students</Text>
            <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2}>
              {!hasFetchedStudents || loading
                ? 'Loading...'
                : `${totalCount.toLocaleString()} students`}
            </Badge>
            {totalCount > 0 && alreadyInDriveCount > 0 && (
              <Text fontSize="xs" color="gray.500">
                ({alreadyInDriveCount} already in this drive)
              </Text>
            )}
          </HStack>
          <HStack spacing={2} flexWrap="wrap">
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={handleSelectAllOnPage}
              isDisabled={!hasFetchedStudents || loading || selectableOnPage.length === 0}
            >
              Select page ({selectableOnPage.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={handleSelectAllMatching}
              isLoading={isSelectingAll}
              loadingText="Selecting..."
              isDisabled={!hasFetchedStudents || loading || totalCount === 0}
            >
              Select all matching ({totalCount.toLocaleString()})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSelection}
              isDisabled={selectedStudents.length === 0}
            >
              Clear selection
            </Button>
          </HStack>
        </Flex>

        <VirtualizedStudentTable
          students={students}
          driveId={driveId}
          loading={loading}
          hasFetched={hasFetchedStudents}
          existingUsnsSet={existingUsnsSet}
          selectedStudents={selectedStudents}
          onToggleSelect={handleSelectStudent}
          onSelectAllPage={handleSelectAll}
          allOnPageSelected={allOnPageSelected}
          someOnPageSelected={someOnPageSelected}
          selectableOnPageCount={selectableOnPage.length}
        />
        {/* Pagination */}
        {totalCount > 0 && (
            <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
              <Text fontSize="sm" color="gray.500">
                Showing {indexOfFirstItem}–{indexOfLastItem} of {totalCount.toLocaleString()} students
                {selectedStudents.length > 0 ? ` · ${selectedStudents.length} selected` : ''}
              </Text>
              <HStack>
                <Text fontSize="sm" color="gray.500">Page {currentPage} of {totalPages}</Text>
                <Button 
                  size="sm" 
                  onClick={() => goToPage(currentPage - 1)}
                  isDisabled={currentPage <= 1 || loading}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => goToPage(currentPage + 1)}
                  isDisabled={currentPage >= totalPages || loading}
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
